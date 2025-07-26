import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"

import type { Photo, Person, Tag } from "@types";

import { addPerson, createPerson, flagPhoto, getPersons, getPhoto, getTags, sendLike, sendView, setPersons as setPhotoPersons, setTags as setPhotoTags } from "@api";

import { CachedPhoto, useGallery } from "@components";
import { GoCalendar, GoEye, GoHeart, GoHeartFill } from "react-icons/go";


import "./PhotoPage.css";

export function PhotoPage() {
    const navigate = useNavigate();

    const { photoId } = useParams<{ photoId: string }>();
    const { photos, updatePhoto, deletePhoto } = useGallery();
    const cached = photos.get(Number(photoId));

    const [photo, setPhoto] = useState<Photo | undefined>(cached);
    const [showHeart, setShowHeart] = useState(false);


    useEffect(() => {
        if (!photo) {
            getPhoto(Number(photoId)).then((fresh) => {
                if (fresh) {
                    setPhoto(fresh);
                    updatePhoto(fresh);
                }
            });
        }
    }, [photoId]);

    const [persons, setPersons] = useState<Person[]>([]);
    const [editingPersons, setEditingPersons] = useState<boolean>(false);

    const [tags, setTags] = useState<Tag[]>([]);
    const [editingTags, setEditingTags] = useState<boolean>(false);
    const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());

    const [selectedPersons, setSelectedPersons] = useState<Set<number>>(new Set());
    const [newPersonName, setNewPersonName] = useState<string>("");

    async function loadPersons() {
        const persons = await getPersons();

        if (!persons) {
            return;
        }

        setPersons(persons);
    }

    async function loadTags() {
        const tags = await getTags();

        if (!tags) {
            return;
        }

        setTags(tags);
    }

    useEffect(() => {
        setSelectedPersons(new Set(photo?.persons.map(p => p.id)));
        setSelectedTags(new Set(photo?.tags.map(p => p.id)));
    }, [photo])

    useEffect(() => {
        loadPersons();
        loadTags();
        handleView();
    }, [])

    function togglePerson(id: number) {
        setSelectedPersons(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) {
                newSelected.delete(id);
                return newSelected;
            }

            newSelected.add(id);
            return newSelected;
        });
    }

    function toggleTag(id: number) {
        setSelectedTags(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) {
                newSelected.delete(id);
                return newSelected;
            }

            newSelected.add(id);
            return newSelected;
        });
    }

    function addNewPerson() {
        async function addNewPersonAsync() {
            const person = await createPerson(newPersonName);
            const newPhoto = await addPerson(photo?.id || 0, person.id);
            if (newPhoto) {
                updatePhoto(newPhoto);
                setSelectedPersons((prev) => {
                    const newSelected = new Set([...prev, ...newPhoto.persons.map(p => p.id)]);
                    return newSelected;
                });
            }
            await loadPersons();
            setNewPersonName("");
        }

        addNewPersonAsync();
    }

    function setNewPersons() {
        async function setNewPersonsAsync() {
            const ids = [...selectedPersons];
            const newPhoto = await setPhotoPersons(photo?.id ?? 0, ids);
            if (newPhoto) {
                updatePhoto(newPhoto);
                setSelectedPersons((prev) => {
                    const newSelected = new Set([...prev, ...newPhoto.persons.map(p => p.id)]);
                    return newSelected;
                });
                setPhoto(newPhoto);
            }
            setEditingPersons(false);
        }

        setNewPersonsAsync();
    }

    function setNewTags() {
        async function setNewTagsAsync() {
            const ids = [...selectedTags];
            const newPhoto = await setPhotoTags(photo?.id ?? 0, ids);
            if (newPhoto) {
                updatePhoto(newPhoto);
                setSelectedTags((prev) => {
                    const newSelected = new Set([...prev, ...newPhoto.persons.map(p => p.id)]);
                    return newSelected;
                });
                setPhoto(newPhoto);
            }
            setEditingTags(false);
        }

        setNewTagsAsync();
    }


    async function handleView() {
        const newPhoto = await sendView(Number(photoId));
        if (!newPhoto) {
            return;
        }

        updatePhoto(newPhoto);
        setPhoto(newPhoto);
    }

    async function handleLike() {
        const newPhoto = await sendLike(photo?.id ?? 0);
        if (!newPhoto) {
            return;
        }

        updatePhoto(newPhoto);
        setPhoto(newPhoto);
    }

    async function handleDoubleClick() {
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
        const newPhoto = await sendLike(Number(photoId));
        if (!newPhoto) {
            return;
        }

        updatePhoto(newPhoto);
        setPhoto(newPhoto);
    }

    if (!photo) return <div>Loading...</div>

    if (!editingPersons && !editingTags) {
        return (
            <div className="PhotoPage page">
                <div className="photo" onDoubleClick={handleDoubleClick}>
                    <CachedPhoto photoId={photo.id} src={photo.resized_url} />
                    {showHeart && (
                        <div className="like-heart">
                            <GoHeartFill />
                        </div>
                    )}
                    <div className="info">
                        <p className="likes" onClick={() => handleLike()}>
                            <span className="icon-text"><span><GoHeart /></span><span>{photo.likes}</span></span>
                        </p>
                        <p className="views">
                            <span className="icon-text"><span><GoEye /></span><span>{photo.views}</span></span>
                        </p>
                        <p className="spacer"></p>
                        <p className="uploaded">
                            <span className="icon-text">
                                <span><GoCalendar /></span>
                                <span>
                                    {
                                        new Intl.DateTimeFormat(undefined, {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        }).format(new Date(photo.uploaded_at))
                                    }
                                </span>
                            </span>
                        </p>
                    </div></div>

                <div className="people">
                    <h3>People in this photo</h3>
                    <ul className="chips persons">
                        {
                            photo.persons.length > 0 ?
                                photo.persons.map(person => (
                                    <li key={person.id} className="chip person">
                                        {person.name}
                                    </li>
                                )) :
                                <li className="empty">
                                    Nobody tagged yet
                                </li>
                        }
                    </ul>
                    <button type="button"
                        onClick={() => setEditingPersons(true)}
                    >
                        Tag people
                    </button>
                </div>
                <div className="tags">
                    <h3>Tags</h3>
                    <ul className="chips tags">
                        {
                            photo.tags.length > 0 ?
                                photo.tags.map(tag => (
                                    <li key={tag.id} className="chip tag">
                                        {tag.name}
                                    </li>
                                )) :
                                <li className="empty">
                                    No tags set yet
                                </li>
                        }
                    </ul>
                    <button type="button"
                        onClick={() => setEditingTags(true)}
                    >
                        Edit tags
                    </button>
                </div>
                <div className="report">
                    <h3>
                        Options
                    </h3>
                    <button className="report-button red"
                        onClick={() => {
                            const res = confirm("Are you sure you want to report this image? It will be removed from view of all users.")

                            if (res) {
                                deletePhoto(photo.id);
                                flagPhoto(photo.id);
                                navigate("/");
                            }
                        }}
                    >
                        Report image
                    </button>
                    <a className="full-size-link" href={photo.original_url}>View full-sized image</a>
                </div>
            </div >
        )
    }
    else if (editingPersons) {
        return (
            <div className="EditPersons page">
                <h3>Select people in the photo</h3>
                <fieldset id="all-people">
                    <ul className="chips persons">
                        {
                            persons.map(person => (
                                <li key={person.id} className="chip person">
                                    <label>
                                        {person.name}
                                        <input type="checkbox"
                                            value={person.id}
                                            checked={selectedPersons.has(person.id)}
                                            onChange={_ => {
                                                togglePerson(person.id);
                                            }}
                                        />
                                    </label>

                                </li>
                            ))
                        }
                    </ul>
                </fieldset>
                <div className="new-person">
                    <label className="form-field">
                        <span className="field-label">
                            Add a new person:
                        </span>
                        <input type="text"
                            value={newPersonName}
                            onChange={(e) => setNewPersonName(e.target.value)}
                            name="new-person-name"
                            placeholder="Dali Koira"
                        />
                    </label>
                </div>
                <div className="buttons">
                    {(newPersonName === "") ? (
                        <button type="button"
                            onClick={() => setNewPersons()}
                        >
                            Save
                        </button>
                    ) : (
                        <button type="button"
                            onClick={() => addNewPerson()}
                        >
                            Add person
                        </button>
                    )
                    }
                    <button type="button"
                        className="cancel-button red"
                        onClick={() => setEditingPersons(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )
    } else if (editingTags) {
        return (
            <div className="EditTags page">
                <h3>Select tags for the photo</h3>
                <fieldset id="all-tags">
                    <ul className="chips tags">
                        {
                            tags.map(tag => (
                                <li key={tag.id} className="chip tag">
                                    <label>
                                        {tag.name}
                                        <input type="checkbox"
                                            value={tag.id}
                                            checked={selectedTags.has(tag.id)}
                                            onChange={_ => {
                                                toggleTag(tag.id);
                                            }}
                                        />
                                    </label>

                                </li>
                            ))
                        }
                    </ul>
                </fieldset>
                <div className="buttons">
                    <button type="button"
                        onClick={() => setNewTags()}
                    >
                        Save
                    </button>
                    <button type="button"
                        className="cancel-button red"
                        onClick={() => setEditingTags(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )
    }

}
