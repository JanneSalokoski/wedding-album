import React, { useState, useEffect, useRef, useCallback } from 'react';

import './App.css';

interface Photo {
    id: number;
    key: string;
    url: string;
    uploaded_at: string;
}

function PhotoFeed() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef<HTMLDivElement | null>(null);

    const seenIds = useRef(new Set<number>());
    const loadPhotos = useCallback(async () => {
        if (!hasMore) {
            return;
        }

        const res = await fetch(`/api/photos?limit=20&offset=${offset}`)
        const newPhotos: Photo[] = await res.json()

        const filtered = newPhotos.filter(photo => !seenIds.current.has(photo.id))
        filtered.forEach(photo => seenIds.current.add(photo.id))
        setPhotos(prev => [...prev, ...filtered])

        setOffset((prev) => prev + newPhotos.length)

        if (newPhotos.length < 20) {
            setHasMore(false)
        }
    }, [offset, hasMore]);

    useEffect(() => {
        loadPhotos()
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadPhotos();
                }
            },
            { threshold: 1 }
        )
        if (observerRef.current) {
            observer.observe(observerRef.current)
        }

        return () => observer.disconnect()
    }, [loadPhotos])

    return (
        <>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
            }}>
                {photos.map((photo) => (
                    <img
                        key={photo.id}
                        src={photo.url}
                        alt={`Photo ${photo.id}`}
                        style={{ width: '100%', borderRadius: '0.5rem' }}
                    />
                ))}
            </div>
            {hasMore && <div ref={observerRef} style={{ height: '1px' }} />}
        </>
    )

}

function UploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    }


    async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!file) {
            return;
        }

        setStatus("Uploading to R2...");

        // Build FormData
        const formData = new FormData();
        formData.append("file", file);  // actual image

        const res = await fetch("/api/upload-file", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (res.ok) {
            setStatus(`✅ Uploaded as ${data.key}`);
        } else {
            setStatus("❌ Upload failed");
        }

        console.log(data);
    }


    return (
        <form className="UploadForm" onSubmit={handleUpload}>
            <h2>Upload Photo</h2>
            <label className="form-field" htmlFor="file">
                <span className="form-label">Upload an image</span>
                <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
            <button type="submit" disabled={!file}>Upload</button>
            {
                status && (
                    <div className="status">
                        {status}
                    </div>
                )
            }
        </form>
    )
}

export function App() {
    return (
        <div className="App">
            <UploadForm />
            <PhotoFeed />
        </div>
    )
}
