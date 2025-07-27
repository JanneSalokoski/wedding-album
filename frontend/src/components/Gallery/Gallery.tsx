import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type CSSProperties } from "react";
import "./Gallery.css";

import { GoEye, GoHeart, GoHeartFill, GoSearch, GoSortAsc, GoSortDesc, GoX } from "react-icons/go";
import type { IconType } from "react-icons";
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from "@headlessui/react";
import { TfiLayoutAccordionMerged, TfiLayoutGrid2, TfiLayoutGrid3, TfiLayoutGrid4 } from "react-icons/tfi";
import type { Photo } from "@types";
import { getPersons, getPhotos, getTags, sendLike } from "@api";

import { CachedPhoto } from "@components";
import { useNavigate } from "react-router-dom";

interface PhotoCardProps {
    photo: Photo;
}

function PhotoCard({ photo }: PhotoCardProps) {
    const { updatePhoto } = useGallery();

    const [showHeart, setShowHeart] = useState<boolean>(false);

    const navigate = useNavigate();
    let clickTimeout: ReturnType<typeof setTimeout> | null = null;

    function handleClick() {
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
            handleDoubleClick();
        } else {
            clickTimeout = setTimeout(() => {
                navigate(`/photos/${photo.id}`);
                clickTimeout = null;
            }, 250)
        }
    }

    async function handleLike() {
        const newPhoto = await sendLike(photo.id);
        if (!newPhoto) {
            return;
        }

        updatePhoto(newPhoto);
    }

    async function handleDoubleClick() {
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
        const newPhoto = await sendLike(photo.id);
        if (!newPhoto) {
            return;
        }

        updatePhoto(newPhoto);
    }

    return (
        <li className="photo-card" onClick={handleClick}>
            <CachedPhoto photoId={photo.id} src={photo.thumb_url} />
            <div className="photo-actions">
                <div className="photo-action like" onClick={handleLike}>
                    <GoHeart /><span>{photo.likes}</span>
                </div>
                <div className="photo-action view" onClick={handleLike}>
                    <GoEye /><span>{photo.views}</span>
                </div>
            </div>

            {showHeart && (
                <div className="like-heart">
                    <GoHeartFill />
                </div>
            )}
        </li>
    )
}

interface PhotoGridProps {
    photos: Map<number, Photo>;
}

function PhotoGrid({ photos }: PhotoGridProps) {
    const { loadMorePhotos, scaleOption } = useGallery();
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!sentinel) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMorePhotos();
            }
        });

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadMorePhotos]);

    return (
        <>
            <ol className="photogrid" style={{ "--scale": scaleOption.id } as CSSProperties}>
                {
                    [...photos.values()].map(photo => (
                        <PhotoCard key={photo.id} photo={photo} />
                    ))
                }
            </ol>
            <div ref={sentinelRef} style={{ height: "1px" }} />
        </>
    )
}

interface SearchBarProps {
    options?: string[];
    onOpen?: () => void;
    onClose?: () => void;
}

function SearchBar({ options, onOpen, onClose }: SearchBarProps) {
    const [open, setOpen] = useState<boolean>(false);
    const { setSearchQuery } = useGallery();
    const [localValue, setLocalValue] = useState("");

    useEffect(() => {
        if (open) {
            onOpen?.();
        } else {
            onClose?.();
        }
    }, [open, onOpen, onClose])

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSearchQuery(localValue.trim());
        setOpen(false);
    }

    return open ? (
        <form className="searchbar" onSubmit={handleSubmit}>
            <input type="search" name="search"
                value={localValue}
                onChange={e => setLocalValue(e.target.value)}
                autoFocus={true}
                autoComplete="on"
                list="search-suggestions"
            />
            <button type="button"
                onClick={() => {
                    setLocalValue("");
                    setSearchQuery("");
                    setOpen(false);
                }}
            >
                <GoX />
            </button>
            <datalist id="search-suggestions">
                {
                    options ? options.map(opt => <option value={opt} />) : <></>
                }
            </datalist>
            <button type="submit"><GoSearch /></button>
        </form>
    ) : (
        <>
            <button onClick={() => setOpen(true)}><GoSearch /></button >
            {
                localValue.trim() !== "" && (
                    <button type="button"
                        onClick={() => {
                            setLocalValue("");
                            setSearchQuery("");
                            setOpen(false);
                        }}
                    >
                        <GoX />
                    </button>

                )
            }
        </>
    );
}

interface ScaleOption {
    id: string,
    label: string,
    icon?: IconType,
}

const scaleOptions = [
    { id: '1', label: '1x1', icon: TfiLayoutAccordionMerged },
    { id: '2', label: '2x2', icon: TfiLayoutGrid2 },
    { id: '3', label: '3x3', icon: TfiLayoutGrid3 },
    { id: '4', label: '4x4', icon: TfiLayoutGrid4 },
];


interface SortOption {
    id: string,
    label: string,
    icon?: IconType,
}

const sortOptions = [
    { id: 'newest', label: 'Newest first', icon: GoSortDesc },
    { id: 'oldest', label: 'Oldest first', icon: GoSortAsc },
    { id: 'liked', label: 'Most liked', icon: GoHeart },
    { id: 'viewed', label: 'Most viewed', icon: GoEye },
];

function Settings() {
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const { sortOption, setSortOption, scaleOption, setScaleOption } = useGallery();
    // const [scaleOption, setScaleOption] = useState<ScaleOption>(scaleOptions[2]);

    const [options, setOptions] = useState<string[]>([]);

    async function loadOptions() {
        const tags = await getTags();
        const persons = await getPersons();

        if (!tags || !persons) {
            return;
        }

        const newOptions = [...tags.map(t => t.name), ...persons.map(p => p.name)];
        setOptions(newOptions);
    }

    useEffect(() => {
        loadOptions();
    }, []);

    return (
        <ul className={`settings ${searchOpen ? "search-open" : ""}`}>
            <li className="setting-block search">
                <SearchBar
                    onOpen={() => setSearchOpen(true)}
                    onClose={() => setSearchOpen(false)}
                    options={options}
                />
            </li>
            {
                !searchOpen && (
                    <>
                        <li className="setting-block spacer"></li>
                        <li className="setting-block order">
                            <Listbox value={sortOption} onChange={setSortOption}>
                                {({ open }) => (
                                    <div>
                                        <ListboxButton className="ListboxButton">
                                            <div>
                                                <span className="icon">{sortOption.icon && <sortOption.icon />}</span>
                                            </div>
                                        </ListboxButton>

                                        {open && (
                                            <ListboxOptions className="ListboxOptions">
                                                {sortOptions.map(option => (
                                                    <ListboxOption className="ListboxOption" key={option.id} value={option}>
                                                        <div>
                                                            {option.icon && <option.icon />}
                                                            <span>{option.label}</span>
                                                        </div>
                                                    </ListboxOption>
                                                ))}
                                            </ListboxOptions>
                                        )}
                                    </div>
                                )}
                            </Listbox>
                        </li>
                        <li className="setting-block zoom">
                            <Listbox value={scaleOption} onChange={setScaleOption}>
                                {({ open }) => (
                                    <div>
                                        <ListboxButton className="ListboxButton">
                                            <div>
                                                <span className="icon">{scaleOption.icon && <scaleOption.icon />}</span>
                                            </div>
                                        </ListboxButton>

                                        {open && (
                                            <ListboxOptions className="ListboxOptions">
                                                {scaleOptions.map(option => (
                                                    <ListboxOption className="ListboxOption" key={option.id} value={option}>
                                                        <div>
                                                            {option.icon && <option.icon />}
                                                            <span>{option.label}</span>
                                                        </div>
                                                    </ListboxOption>
                                                ))}
                                            </ListboxOptions>
                                        )}
                                    </div>
                                )}
                            </Listbox>
                        </li>
                    </>
                )
            }
        </ul>
    )
}

interface GalleryContextValue {
    photos: Map<number, Photo>;
    updatePhoto: (photo: Photo) => void;
    deletePhoto: (id: number) => void;
    loadMorePhotos: () => void;
    sortOption: SortOption;
    setSortOption: (opt: SortOption) => void;
    scaleOption: ScaleOption;
    setScaleOption: (opt: ScaleOption) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);

export const useGallery = () => {
    const ctx = useContext(GalleryContext);

    if (!ctx) {
        throw new Error("useGalleryUpdater must be used within GalleryUpdateProvider");
    }

    return ctx;
}

export function GalleryProvider({ children }: { children: React.ReactNode }) {
    const [photos, setPhotos] = useState<Map<number, Photo>>(new Map());
    const [offset, setOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);

    const defaultSort = sortOptions[0];
    const [sortOption, setSortOption] = useState<SortOption>(defaultSort);

    const defaultScale = scaleOptions[2];
    const [scaleOption, setScaleOption] = useState<ScaleOption>(defaultScale);

    const [searchQuery, setSearchQuery] = useState<string>("");

    const limit = 20;

    async function loadMorePhotos() {
        if (loading || !hasMore) {
            return;
        }

        setLoading(true);

        try {
            const res = await getPhotos(offset, limit, sortOption.id, searchQuery);
            if (res.length === 0) {
                setHasMore(false);
            } else {
                setPhotos((prev) => {
                    const newMap = new Map(prev);
                    for (const img of res) {
                        newMap.set(img.id, img);
                    }

                    return newMap;
                });

            }
            setOffset((prev) => prev + res.length);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMorePhotos();
    }, [])

    useEffect(() => {
        setPhotos(new Map());
        setOffset(0);
        setHasMore(true);
        // loadMorePhotos();
    }, [sortOption, searchQuery]);

    function updatePhoto(photo: Photo) {
        setPhotos((prev) => new Map(prev).set(photo.id, photo));
    }

    function deletePhoto(id: number) {
        setPhotos((prev) => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
        });
    }

    return (
        <GalleryContext.Provider value={{ photos, updatePhoto, deletePhoto, loadMorePhotos, sortOption, setSortOption, scaleOption, setScaleOption, searchQuery, setSearchQuery }}>
            {children}
        </GalleryContext.Provider>
    );
}

export function Gallery() {
    const { photos } = useGallery();
    return (
        <div className="gallery">
            <div className="settings-bar">
                <Settings />
            </div>
            <div className="main-content">
                <PhotoGrid photos={photos} />
            </div>
        </div>
    );
}

