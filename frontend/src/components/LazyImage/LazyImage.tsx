import { useState } from "react";

import "./LazyImage.css";


interface LazyImageProps {
    src: string;
    alt?: string;
    className?: string;
    style?: React.CSSProperties;
}

export function LazyImage({ src, alt = '', className, style }: LazyImageProps) {
    const [loaded, setLoaded] = useState(false)

    return (
        <div className={`LazyImageWrapper ${className}`} style={style}>
            {!loaded && (
                <div className="LazyImageSpinnerOverlay">
                    <div className="spinner" />
                </div>
            )
            }
            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
            />
        </div>
    )
}
