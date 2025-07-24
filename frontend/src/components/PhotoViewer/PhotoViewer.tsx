import "./PhotoViewer.css";

import type { Photo, Tag } from "../PhotoFeed";
import { useEffect, useRef, useState } from "react";
import { setTags, sendView, createPerson, setPersons, flagPhoto } from "../../api";
import type { Person } from "../../types";

interface PhotoViewerProps {
    photo: Photo;
    tags: Tag[];
    persons: Person[];
    refreshPersons: () => void;
    onClose: () => void;
    updatePhoto: (res: Photo) => void;
    resetPhotos: () => void;
}

export function PhotoViewer({ photo, tags, persons, refreshPersons, onClose, updatePhoto, resetPhotos }: PhotoViewerProps) {

    const [selectedTags, setSelectedTags] = useState<Set<number>>(() => new Set(photo.tags.map(t => t.id)));
    const [editableTags, setEditableTags] = useState<Tag[]>([]);

    const [selectedPersons, setSelectedPersons] = useState<Set<number>>(new Set(photo.persons.map(p => p.id)));

    const [newPersonName, setNewPersonName] = useState<string>("");

    const [editingTags, setEditingTags] = useState<boolean>(false);
    const [addingPerson, setAddingPerson] = useState<boolean>(false);

    const [inputFocused, setInputFocused] = useState<boolean>(false);

    const nameRef = useRef<HTMLInputElement | null>(null);

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


    async function savePersonChanges(e: React.FormEvent) {
        e.preventDefault();
        e.stopPropagation();

        const trimmed = newPersonName.trim();
        const selectedPerson = persons.find(p => p.name === trimmed);

        // Copy the currently selected persons
        const updatedPersonIds = new Set(selectedPersons);

        if (trimmed !== "") {
            if (!selectedPerson) {
                const newPerson = await createPerson(trimmed);
                refreshPersons();

                updatedPersonIds.add(newPerson.id);
            } else {
                updatedPersonIds.add(selectedPerson.id);
            }

            setNewPersonName("");
        }

        setSelectedPersons(updatedPersonIds);

        const newPhoto = await setPersons(photo.id, [...updatedPersonIds]);
        if (newPhoto) {
            updatePhoto(newPhoto);
        }

        setAddingPerson(false);
    }


    return (
        <div className="PhotoViewerOverlay" onClick={(e) => {
            e.stopPropagation();
            onClose();
        }} >
            <button className="CloseViewer" onClick={onClose}>x</button>
            <div className="PhotoViewerContent" onClick={(e) => e.stopPropagation()}
                style={{ paddingBottom: inputFocused ? undefined : undefined }}
            >
                <img src={photo.url} alt={`Photo ${photo.id}`} />
                <div className="PhotoDetails">
                    <p className="likes">Likes: {photo.likes}</p>
                    <p className="views">Views: {photo.views}</p>
                    <p className="spacer"></p>
                    <p className="uploaded">{new Date(photo.uploaded_at).toLocaleString(undefined, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}</p>
                </div>
                {/* <span className="subtitle">Tags:</span> */}
                <ul className="Tags">
                    {
                        editingTags ? (
                            <>
                                <fieldset className="tags">
                                    {editableTags.map(tag => {
                                        const isChecked = selectedTags.has(tag.id);
                                        return (
                                            <li className="chip"><label key={tag.id} htmlFor={`tag-${tag.id}`} className="tag-label">
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
                                                <span>{tag.name}</span>
                                            </label></li>
                                        );
                                    })}
                                </fieldset>
                            </>
                        ) : (
                            <>
                                {photo.tags.sort((a, b) => a.name < b.name ? 1 : -1).map(tag => (
                                    <li key={tag.id} className="chip">{tag.name}</li>
                                ))}
                            </>
                        )
                    }
                    <li className="edit">
                        <button className="chip" onClick={() => {

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
                            {editingTags ? "save" : (photo.tags.length === 0 ? "Add" : "Edit")}
                        </button>
                    </li>
                </ul>
                {/* <span className="subtitle">People:</span> */}
                <ul className="Persons">
                    {addingPerson ? (
                        <form onSubmit={savePersonChanges}>
                            <fieldset className="persons">
                                {persons.filter(p => selectedPersons.has(p.id)).map(person => (
                                    <li className="chip" key={person.id}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                id={`person-${person.id}`}
                                                value={person.id}
                                                checked={selectedPersons.has(person.id)}
                                                onChange={(e) => {
                                                    const id = parseInt(e.target.value);
                                                    const newSelected = new Set(selectedPersons);
                                                    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
                                                    setSelectedPersons(newSelected);
                                                }}
                                            />
                                            <span>{person.name}</span>
                                        </label>
                                    </li>
                                ))}
                            </fieldset>

                            <li>
                                <input className="chip" ref={nameRef}
                                    type="text"
                                    value={newPersonName}
                                    onChange={e => setNewPersonName(e.target.value)}
                                    onFocus={_ => {
                                        setInputFocused(true);
                                        nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                                    }}
                                    onBlur={() => setInputFocused(false)}
                                    placeholder="Add new person"
                                    list="person-options"
                                />
                            </li>

                            <datalist id="person-options">
                                {[...persons.values()].map(p => (
                                    <option key={p.id} value={p.name} />
                                ))}
                            </datalist>

                            <li className="NewPerson">
                                <button className="chip" type="submit">Save</button>
                            </li>
                            <li className="NewPerson">
                                <button className="chip" type="button" onClick={() => {
                                    setAddingPerson(false)
                                    setSelectedPersons(new Set(photo.persons.map(p => p.id)))
                                }
                                }>
                                    Cancel
                                </button>
                            </li>
                        </form>
                    ) : (
                        photo.persons.map(person => (
                            <li className="chip" key={person.id}>{person.name}</li>
                        ))
                    )}

                    {!addingPerson && (
                        <li className="NewPerson">
                            <button className="chip" onClick={() => setAddingPerson(true)}>Edit</button>
                        </li>
                    )}
                </ul>
                <div className="ReportPhoto">
                    <button className="red report-button"
                        onClick={() => {
                            const response = confirm("Are you sure you want to report this image?")
                            if (response) {
                                flagPhoto(photo.id)
                                resetPhotos();
                                onClose();
                            }
                        }}
                    >Report image</button>
                </div>
            </div>
        </div >
    )
}
