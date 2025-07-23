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

    const [selectedTags, setSelectedTags] = useState<Set<number>>(() => new Set(photo.tags.map(t => t.id)));
    const [editableTags, setEditableTags] = useState<Tag[]>([]);

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
                        editingTags ? (
                            <>
                                <fieldset className="tags">
                                    {editableTags.map(tag => {
                                        const isChecked = selectedTags.has(tag.id);
                                        return (
                                            <li><label key={tag.id} htmlFor={`tag-${tag.id}`} className="tag-label">
                                                <input
                                                    type="checkbox"
                                                    id={`tag-${tag.id}`}
                                                    value={tag.id}
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        const updated = new Set(selectedTags);
                                                        isChecked ? updated.delete(tag.id) : updated.add(tag.id);
                                                        setSelectedTags(updated);
                                                    }}
                                                />
                                                <span className="tag-chip">{tag.name}</span>
                                            </label></li>
                                        );
                                    })}
                                </fieldset>
                            </>
                        ) : (
                            <>
                                {photo.tags.sort((a, b) => a.name < b.name ? 1 : -1).map(tag => (
                                    <li key={tag.id} className="tag-chip static">{tag.name}</li>
                                ))}
                            </>
                        )
                    }
                    <li className="edit">
                        <button onClick={() => {

                            if (!editingTags) {
                                const sorted = [...tags].sort((a, b) => {
                                    const aSelected = selectedTags.has(a.id) ? 0 : 1;
                                    const bSelected = selectedTags.has(b.id) ? 0 : 1;

                                    if (aSelected === bSelected) {
                                        if (a.name < b.name) {
                                            return 1;
                                        }

                                        return -1;
                                    }

                                    return aSelected - bSelected;
                                });
                                setEditableTags(sorted);
                            } else {
                                setNewTags();
                            }

                            setEditingTags(prev => !prev);
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
        </div >
    )
}
