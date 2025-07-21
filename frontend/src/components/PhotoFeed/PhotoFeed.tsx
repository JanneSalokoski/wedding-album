import { useEffect, useRef } from "react";

import { LazyImage } from "../LazyImage";

export interface Photo {
    id: number;
    url: string;
    uploaded_at: string;
}

interface PhotoFeedProps {
    photos: Photo[]
    loadMore: () => void
    hasMore: boolean
}

export function PhotoFeed({ photos, loadMore, hasMore }: PhotoFeedProps) {
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
