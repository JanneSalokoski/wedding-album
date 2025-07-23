import "./PhotoViewer.css";

import type { Photo, Tag } from "../PhotoFeed";
import { useEffect, useState } from "react";
import { setTags, sendView, addPerson, createPerson } from "../../api";
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

    const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());

    const [personOverlayOpen, setPersonOverlayOpen] = useState<boolean>(false);
    const [newPersonName, setNewPersonName] = useState<string>("");

    const [editingTags, setEditingTags] = useState<boolean>(false);

    useEffect(() => {
        sendView(photo.id, (res: Photo) => {
            updatePhoto(res);
        });

        refreshPersons();
    }, []);


    async function setNewTags() {
        const newPhoto = await setTags(photo.id, [...selectedTags]);

        if (newPhoto) {
            updatePhoto(newPhoto);
        }
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
                        !editingTags ? (
                            photo.tags.map(tag => (
                                <li key={tag.id}>{tag.name}</li>
                            )))
                            : (
                                <fieldset>
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
                            )
                    }
                    <li className="edit">
                        <button onClick={() => {
                            if (editingTags) {
                                setNewTags();
                            }

                            setEditingTags(prev => !prev)
                        }}>
                            {editingTags ? "save" : (photo.tags.length === 0 ? "add" : "edit")}
                        </button>
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
