import { useState, useEffect, useRef } from "react";

import { LazyImage } from "../LazyImage";
import { PhotoViewer } from "../PhotoViewer";

import "./PhotoFeed.css";

export interface Photo {
    id: number;
    url: string;
    likes: number;
    views: number;
    uploaded_at: string;
}

export type SortOptions = "newest" | "oldest" | "liked" | "viewed";

interface PhotoFeedProps {
    photos: Photo[]
    loadMore: (sort: SortOptions) => void
    resetPhotos: () => void
    hasMore: boolean
}

export function PhotoFeed({ photos, loadMore, resetPhotos, hasMore }: PhotoFeedProps) {
    const observerRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const [showScrollToTop, setShowScrollToTop] = useState(false);


    const [zoomLevel, setZoomLevel] = useState<string>("4");
    const [sortOption, setSortOption] = useState<SortOptions>("newest");
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        const target = observerRef.current;

        if (!container || !target) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore(sortOption)
                }
            },
            { root: container, threshold: 1.0 }
        )

        observer.observe(target)

        return () => observer.disconnect();

    }, [loadMore, sortOption])

    useEffect(() => {
        resetPhotos()
    }, [sortOption]);

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
                <select className="SortOption" onChange={e => setSortOption(e.target.value as SortOptions)} value={sortOption}>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="liked">Liked</option>
                    <option value="viewed">Viewed</option>
                </select>
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
                        onClick={() => setSelectedPhoto(photo)}
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

            {selectedPhoto && (
                <PhotoViewer
                    photo={selectedPhoto}
                    onClose={() => setSelectedPhoto(null)}
                />
            )}
        </div>
    );
}
