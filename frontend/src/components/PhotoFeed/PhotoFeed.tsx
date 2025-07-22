import { useState, useEffect, useRef } from "react";

import { LazyImage } from "../LazyImage";

import "./PhotoFeed.css";

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
    const observerRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const [showScrollToTop, setShowScrollToTop] = useState(false);

    const [zoomLevel, setZoomLevel] = useState<string>("4");

    useEffect(() => {
        const container = scrollContainerRef.current;
        const target = observerRef.current;

        if (!container || !target) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore()
                }
            },
            { root: container, threshold: 1.0 }
        )

        observer.observe(target)

        return () => observer.disconnect();

    }, [loadMore])

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            console.log(container.scrollTop > 300);
            setShowScrollToTop(container.scrollTop > 300);
        };

        container.addEventListener("scroll", handleScroll);

        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };




    return (
        <div ref={scrollContainerRef} className="PhotoFeedWrapper">
            <div className="Controls">
                <span className="spacer"></span>
                <select className="ZoomLevel" onChange={e => setZoomLevel(e.target.value)} value={zoomLevel}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="4">4</option>
                </select>
            </div>
            <div className="PhotoFeed" style={{ "--column-amount": zoomLevel } as React.CSSProperties}>
                {photos.map(photo => (
                    <LazyImage
                        key={photo.id}
                        src={photo.url}
                        alt={`Photo ${photo.id}`}
                    />
                ))}
                {hasMore && <div ref={observerRef} style={{ height: '1px' }} />}
            </div>

            {showScrollToTop && (
                <div className="ScrollWrapper">
                    <button className="ScrollToTop" onClick={scrollToTop}>
                        ↑
                    </button>
                </div>
            )}
        </div>
    );
}
