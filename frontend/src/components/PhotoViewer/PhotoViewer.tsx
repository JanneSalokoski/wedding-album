import "./PhotoViewer.css";

import type { Photo } from "../PhotoFeed";
import { useEffect, useState } from "react";
import { sendView } from "../../api";

interface PhotoViewerProps {
    photo: Photo;
    onClose: () => void;
    updatePhoto: (res: Photo) => void;
}

export function PhotoViewer({ photo, onClose, updatePhoto }: PhotoViewerProps) {

    const [tagOverlayOpen, setTagOverlayOpen] = useState<boolean>(false);
    const [selectedTag, selectTag] = useState<number>(1);
    useEffect(() => {
        sendView(photo.id, (res: Photo) => {
            updatePhoto(res);
        });
    }, []);

    function addTag(event: React.FormEvent) {
        event.preventDefault();

        console.log(selectedTag);
    }

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
                <ul className="Tags">
                    {
                        photo.tags.map(tag => (
                            <li key={tag.id}>{tag.name}</li>
                        ))
                    }
                    <li className="NewTag">
                        <label className="form-field">
                            <button onClick={() => setTagOverlayOpen(true)}>
                                Add tag
                            </button>
                        </label>
                    </li>
                </ul>
                <button className="CloseViewer" onClick={onClose}>x</button>
                {tagOverlayOpen && (
                    <form className="TagOverlay" onSubmit={addTag}>
                        <select name="tag" value={selectedTag} onChange={e => selectTag(parseInt(e.target.value) ?? 1)}>
                            <option value={1}>hääpari</option>
                            <option value={2}>ruoka</option>
                        </select>
                        <button type="submit">Add tag</button>
                    </form>
                )}
            </div>
        </div>
    )
}
