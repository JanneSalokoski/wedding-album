import "./PhotoViewer.css";

import type { Photo, Tag } from "../PhotoFeed";
import { useEffect, useState } from "react";
import { addTag, sendView, addPerson, createPerson } from "../../api";
import type { Person } from "../../types";

interface PhotoViewerProps {
    photo: Photo;
    tags: Tag[];
    persons: Person[];
    refreshPersons: () => void;
    onClose: () => void;
    updatePhoto: (res: Photo) => void;
}

export function PhotoViewer({ photo, tags, persons, refreshPersons, onClose, updatePhoto }: PhotoViewerProps) {

    const [tagOverlayOpen, setTagOverlayOpen] = useState<boolean>(false);
    const [selectedTag, selectTag] = useState<number>(1);

    const [personOverlayOpen, setPersonOverlayOpen] = useState<boolean>(false);
    const [newPersonName, setNewPersonName] = useState<string>("");
    useEffect(() => {
        sendView(photo.id, (res: Photo) => {
            updatePhoto(res);
        });

        refreshPersons();
    }, []);

    function addNewTag(event: React.FormEvent) {
        event.preventDefault();

        addTag(photo.id, selectedTag, (res: Photo) => {
            console.log(res)
            updatePhoto(res);
            setTagOverlayOpen(false);
        });
    }

    function addNewPerson(event: React.FormEvent) {
        event.preventDefault();

        function callback(res: Photo) {
            updatePhoto(res);
            refreshPersons();
        }

        const person = persons.filter(p => p.name === newPersonName)[0];
        if (person) {
            addPerson(photo.id, person.id, callback);
        }
        else {
            createPerson(newPersonName, (p: Person) => {
                addPerson(photo.id, p.id, callback);
            })
        }
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
                <ul className="Persons">
                    {
                        photo.persons.map(person => (
                            <li key={person.id}>{person.name}</li>
                        ))
                    }
                    <li className="NewPerson">
                        <label className="form-field">
                            <button onClick={() => setPersonOverlayOpen(true)}>
                                Add person
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
                {personOverlayOpen && (
                    <form className="TagOverlay" onSubmit={addNewPerson}>
                        <label className="form-field">
                            <span className="field-label">
                                Name
                            </span>
                            <input type="text"
                                value={newPersonName}
                                onChange={e => setNewPersonName(e.target.value)}
                                list="person-options"
                            />
                            <datalist id="person-options">
                                {
                                    [...persons.values()].map(p => (
                                        <option key={p.id} value={p.name} />
                                    ))
                                }
                            </datalist>
                        </label>
                        <button type="submit">Add person</button>
                        <button onClick={() => setPersonOverlayOpen(false)}>Close</button>
                    </form>
                )}
            </div>
        </div>
    )
}
