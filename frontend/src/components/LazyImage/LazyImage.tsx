import { useState } from "react";


interface LazyImageProps {
    src: string;
    alt?: string;
    className?: string;
    style?: React.CSSProperties;
}

export function LazyImage({ src, alt = '', className, style }: LazyImageProps) {
    const [loaded, setLoaded] = useState(false)

    return (
        <div className={className}
            style={{
                background: '#333',
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
