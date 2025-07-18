import React, { useState, useEffect, useRef, useCallback } from 'react';

import './App.css';

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
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!file) return;

        setStatus("Uploading to R2...");
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload-file", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        if (res.ok) {
            setStatus(`Uploaded as ${data.key}`);
            setFile(null);
            onSuccess?.();
        } else {
            setStatus("❌ Upload failed");
        }
    }

    return (
        <form className="UploadForm" onSubmit={handleUpload}>
            <h2>Upload Photo</h2>
            <label className="form-field" htmlFor="file">
                <span className="form-label">Upload an image</span>
                <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <button type="submit" disabled={!file}>Upload</button>
            {status && <div className="status">{status}</div>}
        </form>
    )
}

export function App() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const seenIds = useRef(new Set<number>());
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadPhotos = useCallback(async () => {
        if (!hasMore) return;
        const res = await fetch(`/api/photos?limit=20&offset=${offset}`);
        const newPhotos: Photo[] = await res.json();

        const filtered = newPhotos.filter(photo => !seenIds.current.has(photo.id));
        filtered.forEach(photo => seenIds.current.add(photo.id));

        setPhotos(prev => [...prev, ...filtered]);
        setOffset(prev => prev + newPhotos.length);
        if (newPhotos.length < 20) setHasMore(false);
    }, [offset, hasMore]);

    const resetPhotos = async () => {
        // Clear and fully reload the feed
        seenIds.current.clear();
        setPhotos([]);
        setOffset(0);
        setHasMore(true);
        const res = await fetch(`/api/photos?limit=20&offset=0`);
        const newPhotos: Photo[] = await res.json();
        newPhotos.forEach(p => seenIds.current.add(p.id));
        setPhotos(newPhotos);
        setOffset(newPhotos.length);
        if (newPhotos.length < 20) setHasMore(false);
    };

    return (
        <div className="App">
            <UploadForm onSuccess={resetPhotos} />
            <PhotoFeed
                photos={photos}
                loadMore={loadPhotos}
                hasMore={hasMore}
            />
        </div>
    );
}
