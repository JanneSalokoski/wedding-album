import type { ReactNode, CSSProperties } from "react";
import { useState, useRef, useEffect } from "react";

import { getPhoto } from "@api";

interface Props {
    photoId: number;
    src: string;
    alt?: string;
    className?: string;
    style?: CSSProperties;
    onClick?: () => void;
    spinner?: ReactNode;
    preload?: boolean;
};

const DefaultSpinner = () => (
    <div className="spinner">
        ...
    </div>
)

const imageCache = new Map<string, HTMLImageElement>();

export const CachedPhoto: React.FC<Props> = ({
    photoId,
    src,
    alt,
    className,
    style,
    onClick,
    spinner,
    preload = false,
}) => {

    const [url, setUrl] = useState<string>(src);
    const [loaded, setLoaded] = useState<boolean>(imageCache.has(src));
    const [inView, setInView] = useState<boolean>(preload)
    const [retryCount, setRetryCount] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (preload || imageCache.has(src)) {
            setInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "100px" }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [url, preload])

    useEffect(() => {
        if (!inView || loaded) {
            return;
        }

        if (imageCache.has(src)) {
            setLoaded(true);
            return;
        }

        const img = new Image();
        img.src = src;
        img.onload = () => {
            imageCache.set(src, img);
            setLoaded(true);
        };

        img.onerror = async () => {
            if (retryCount >= 1) {
                return;
            }

            try {
                const res = await getPhoto(photoId);
                console.log(res);
                if (!res) {
                    return;
                }

                setUrl(res.resized_url);
                setRetryCount(retryCount + 1);
            } catch (err) {
                console.error("Failed to refetch image URL:", err);
            }
        };
    }, [inView, url, loaded, retryCount, photoId])

    return (
        <div
            ref={containerRef}
            className={`cached-image-container ${className || ""}`}
            style={{ ...style }}
            onClick={onClick}
        >
            {!loaded && (
                <div className="cached-image-spinner">
                    {spinner || <DefaultSpinner />}
                </div>
            )
            }
            {loaded && (
                <img
                    src={url}
                    alt={alt}
                    className="cached-image"
                    loading="lazy"
                />
            )}
        </div>
    )
}
