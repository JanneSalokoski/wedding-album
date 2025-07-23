import "./PhotoViewer.css";

import type { Photo, Tag } from "../PhotoFeed";
import { useEffect, useState } from "react";
import { addTag, sendView } from "../../api";

interface PhotoViewerProps {
    photo: Photo;
    tags: Tag[];
    onClose: () => void;
    updatePhoto: (res: Photo) => void;
}

export function PhotoViewer({ photo, tags, onClose, updatePhoto }: PhotoViewerProps) {

    const [tagOverlayOpen, setTagOverlayOpen] = useState<boolean>(false);
    const [selectedTag, selectTag] = useState<number>(1);
    useEffect(() => {
        sendView(photo.id, (res: Photo) => {
            updatePhoto(res);
        });
    }, []);

    function addNewTag(event: React.FormEvent) {
        event.preventDefault();

        console.log("adding tag")
        addTag(photo.id, selectedTag, (res: Photo) => {
            console.log(res)
            updatePhoto(res);
            setTagOverlayOpen(false);
        });
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
                    <form className="TagOverlay" onSubmit={addNewTag}>
                        <select name="tag" value={selectedTag} onChange={e => selectTag(parseInt(e.target.value) ?? 1)}>
                            {
                                tags.map((tag) => (
                                    <option key={tag.id} value={tag.id}>
                                        {tag.name}
                                    </option>
                                ))
                            }
                        </select>
                        <button type="submit">Add tag</button>
                        <button onClick={() => setTagOverlayOpen(false)}>Close</button>
                    </form>
                )}
            </div>
        </div>
    )
}
