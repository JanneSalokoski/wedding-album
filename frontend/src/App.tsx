import React, { useState, useEffect, useRef, useCallback } from 'react';

import './App.css';

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
}

interface Photo {
    id: number;
    url: string;
    uploaded_at: string;
}

interface LazyImageProps {
    src: string;
    alt?: string;
    className?: string;
    style?: React.CSSProperties;
}

function LazyImage({ src, alt = '', className, style }: LazyImageProps) {
    const [loaded, setLoaded] = useState(false)

    return (
        <div className={className}
            style={{
                position: 'relative',
                overflow: 'hidden',
                background: '#eee',
                ...style,
            }}
        >
            {
                !loaded && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1,
                        }}
                    >
                        <div className="spinner" />
                    </div>
                )
            }
            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out',
                }}
            />
        </div>
    )
}

interface PhotoFeedProps {
    photos: Photo[]
    loadMore: () => void
    hasMore: boolean
}

function PhotoFeed({ photos, loadMore, hasMore }: PhotoFeedProps) {
    const observerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore()
                }
            },
            { threshold: 1 }
        )
        if (observerRef.current) observer.observe(observerRef.current)
        return () => observer.disconnect()
    }, [loadMore])

    return (
        <>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
            }}>
                {photos.map(photo => (
                    <LazyImage
                        key={photo.id}
                        src={photo.url}
                        alt={`Photo ${photo.id}`}
                        style={{ aspectRatio: "1 / 1", borderRadius: "0.5rem" }}
                    />
                ))}
            </div>
            {hasMore && <div ref={observerRef} style={{ height: '1px' }} />}
        </>
    );
}

interface UploadFormProps {
    onSuccess?: () => void
}

function UploadForm({ onSuccess }: UploadFormProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!files) {
            setPreviewUrls([]);
            return;
        }

        const urls = Array.from(files).map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);

        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
        }
    }, [files]);

    async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!files) return;

        setStatus("Uploading to R2...");
        const formData = new FormData();
        formData.append("file", files[0]);

        const res = await fetch("/api/upload-file", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        if (res.ok) {
            setStatus(`Uploaded as ${data.key}`);
            setFiles([]);
            onSuccess?.();
        } else {
            setStatus("Upload failed");
        }
    }

    function removeFile(index: number) {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }

    return (
        <form className="UploadForm" onSubmit={handleUpload}>
            <h2>Upload Photo</h2>
            <label className="form-field" htmlFor="file">
                <span className="form-label">Upload an image</span>
                <input type="file"
                    accept="image/*"
                    multiple={true}
                    onChange={e => setFiles(Array.from(e.target.files ?? []))}
                />
            </label>

            <ol className="CandidatePhotos">
                {Array.from(files ?? []).map((file, idx) => (
                    <li key={file.name} className="CandidatePhoto">
                        <img className="preview" src={previewUrls[idx]} alt={file.name} />
                        <ul className="file-info">
                            <li className="filename">Filename: {file.name}</li>
                            <li className="filesize">Size: {formatFileSize(file.size)}</li>
                            <li className="status">Status: ok</li>
                        </ul>
                        <button type="button" onClick={() => removeFile(idx)}>Remove</button>
                    </li>
                ))}
            </ol>

            <button type="submit" disabled={!files || files.length === 0}>Upload</button>
            {status && <div className="status">{status}</div>}
        </form>
    )
}

export function App() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const seenIds = useRef(new Set<number>());
    const maxId = useRef<number>(0);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadPhotos = useCallback(async () => {
        if (!hasMore) return;
        const res = await fetch(`/api/photos?limit=20&offset=${offset}`);
        const newPhotos: Photo[] = await res.json();

        const filtered = newPhotos.filter(photo => !seenIds.current.has(photo.id));
        filtered.forEach(photo => seenIds.current.add(photo.id));

        if (filtered.length > 0) {
            maxId.current = Math.max(maxId.current, ...filtered.map(p => p.id))
            setPhotos(prev => [...prev, ...filtered]);
            setOffset(prev => prev + newPhotos.length);
            if (newPhotos.length < 20) setHasMore(false);
        }
    }, [offset, hasMore]);

    const loadLatestPhotos = async () => {
        const res = await fetch(`/api/photos?limit=20&offset=0`);
        const newPhotos: Photo[] = await res.json();

        const freshPhotos = newPhotos.filter(p => !seenIds.current.has(p.id));
        freshPhotos.forEach(p => seenIds.current.add(p.id));

        if (freshPhotos.length > 0) {
            maxId.current = Math.max(maxId.current, ...freshPhotos.map(p => p.id))
            setPhotos(prev => [...freshPhotos, ...prev]);
        }
    };

    return (
        <div className="App">
            <UploadForm onSuccess={loadLatestPhotos} />
            <PhotoFeed
                photos={photos}
                loadMore={loadPhotos}
                hasMore={hasMore}
            />
        </div>
    );
}
