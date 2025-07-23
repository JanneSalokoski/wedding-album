import "./PhotoViewer.css";

import type { Photo, Tag } from "../PhotoFeed";
import { useEffect, useState } from "react";
import { addTag, setTags, sendView, addPerson, createPerson } from "../../api";
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

    const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());

    const [personOverlayOpen, setPersonOverlayOpen] = useState<boolean>(false);
    const [newPersonName, setNewPersonName] = useState<string>("");
    useEffect(() => {
        sendView(photo.id, (res: Photo) => {
            updatePhoto(res);
        });

        refreshPersons();
    }, []);

    async function addNewTag(event: React.FormEvent) {
        event.preventDefault();

        const newPhoto = await setTags(photo.id, [...selectedTags]);
        console.log(newPhoto);

        if (newPhoto) {
            updatePhoto(newPhoto);
        }

        setTagOverlayOpen(false);
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
                        <fieldset>
                            <legend>Select appropriate tags</legend>
                            <div className="tags">
                                {
                                    tags.map((tag) => (
                                        <label htmlFor={`${tag.id}`}>
                                            <input type="checkbox" id={`${tag.id}`} name={`${tag.id}`} value={`${tag.id}`}
                                                checked={selectedTags.has(tag.id)}
                                                onChange={e => {
                                                    const value = parseInt(e.target.value);
                                                    const newTags = new Set([...selectedTags])

                                                    if (newTags.has(value)) {
                                                        newTags.delete(value);
                                                    } else {
                                                        newTags.add(value);
                                                    }

                                                    setSelectedTags(newTags);
                                                }}
                                            />
                                            <span className="input-label">{tag.name}</span>
                                        </label>
                                    ))
                                }
                            </div>
                        </fieldset>
                        <button type="submit">Set tags</button>
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
