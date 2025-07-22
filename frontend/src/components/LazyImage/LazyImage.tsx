import { useState } from "react";

import "./LazyImage.css";


interface LazyImageProps {
    src: string;
    alt?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export function LazyImage({ src, alt = '', className, onClick, style }: LazyImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [liked, setLiked] = useState(false);

    function handleDoubleClick() {
        console.log("Like! Send this to server maybe?");
        setLiked(true);
        setTimeout(() => setLiked(false), 1000);
    }

    function handleClick() {
        if (onClick) {
            onClick();
        }
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
