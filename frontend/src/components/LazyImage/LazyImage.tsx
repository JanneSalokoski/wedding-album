import { useRef, useState } from "react";

import "./LazyImage.css";
import { sendLike } from "../../api";


interface LazyImageProps {
    photoId: number;
    src: string;
    alt?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export function LazyImage({ photoId, src, alt = '', className, onClick, style }: LazyImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [liked, setLiked] = useState(false);

    const clickTimeoutRef = useRef<number | null>(null);

    function handleDoubleClick() {
        if (clickTimeoutRef.current !== null) {
            window.clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        sendLike(photoId);
        setLiked(true);
        setTimeout(() => setLiked(false), 1000);
    }

    function handleClick() {
        if (!onClick) {
            return;
        }

        if (clickTimeoutRef.current !== null) {
            window.clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            return;
        }

        clickTimeoutRef.current = window.setTimeout(() => {
            onClick?.();
            clickTimeoutRef.current = null;
        }, 250);
    }

    return (
        <div className={`LazyImageWrapper ${className}`} style={style} >
            {!loaded && (
                <div className="LazyImageSpinnerOverlay">
                    <div className="spinner" />
                </div>
            )}
            {liked && (
                <div className="LikeOverlay">
                    ❤️
                </div>
            )}
            <img onDoubleClick={handleDoubleClick} onClick={handleClick}
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
            />
        </div>
    )
}
