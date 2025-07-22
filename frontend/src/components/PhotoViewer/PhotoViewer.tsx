import "./PhotoViewer.css";

import type { Photo } from "../PhotoFeed";

interface PhotoViewerProps {
    photo: Photo;
    onClose: () => void;
}

export function PhotoViewer({ photo, onClose }: PhotoViewerProps) {
    return (
        <div className="PhotoViewerOverlay" onClick={onClose}>
            <div className="PhotoViewerContent" onClick={(e) => e.stopPropagation()}>
                <img src={photo.url} alt={`Photo ${photo.id}`} />
                <div className="PhotoDetails">
                    <p className="likes">Likes: {photo.likes}</p>
                    <p className="views">Views: {photo.views}</p>
                    <p className="spacer"></p>
                    <p className="uploaded">Date: {new Date(photo.uploaded_at).toLocaleString()}</p>
                </div>
                <button className="CloseViewer" onClick={onClose}>x</button>
            </div>
        </div>
    )
}
