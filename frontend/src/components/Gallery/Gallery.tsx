import { useEffect, useState, type FormEvent } from "react";
import "./Gallery.css";

import { GoEye, GoHeart, GoSearch, GoSortAsc, GoSortDesc } from "react-icons/go";
import type { IconType } from "react-icons";
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from "@headlessui/react";
import { TfiLayoutAccordionMerged, TfiLayoutGrid2, TfiLayoutGrid3, TfiLayoutGrid4 } from "react-icons/tfi";

function Photo() {
    return (
        <li className="photo">
        </li>
    )
}

function PhotoGrid() {
    return (
        <ol className="photogrid">
            {
                [...Array(100).keys()].map(i => <Photo key={i} />)
            }
        </ol>
    )
}

interface SearchBarProps {
    options?: string[];
    onOpen?: () => void;
    onClose?: () => void;
}

function SearchBar({ options, onOpen, onClose }: SearchBarProps) {
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        if (open) {
            onOpen?.();
        } else {
            onClose?.();
        }
    }, [open, onOpen, onClose])

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        console.log("Searching");

        setOpen(false);
    }

    return open ? (
        <form className="searchbar" onSubmit={handleSubmit} onBlur={() => setOpen(false)}>
            <input type="search" name="search"
                autoFocus={true}
                autoComplete="on"
                list="search-suggestions"
            />
            <datalist id="search-suggestions">
                {
                    options ? options.map(opt => <option value={opt} />) : <></>
                }
            </datalist>
            <button type="submit"><GoSearch /></button>
        </form>
    ) : (
        <button onClick={() => setOpen(true)}><GoSearch /></button >
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
    { id: 'desc', label: 'Newest first', icon: GoSortDesc },
    { id: 'asc', label: 'Oldest first', icon: GoSortAsc },
    { id: 'liked', label: 'Most liked', icon: GoHeart },
    { id: 'views', label: 'Most viewed', icon: GoEye },
];

function Settings() {
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [sortOption, setSortOption] = useState<SortOption>(sortOptions[0]);
    const [scaleOption, setScaleOption] = useState<ScaleOption>(scaleOptions[2]);

    return (
        <ul className={`settings ${searchOpen ? "search-open" : ""}`}>
            <li className="setting-block search">
                <SearchBar
                    onOpen={() => setSearchOpen(true)}
                    onClose={() => setSearchOpen(false)}
                    options={["Janne", "Roosa", "Dali"]}
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

export function Gallery() {
    return (
        <div className="gallery">
            <div className="settings-bar">
                <Settings />
            </div>
            <div className="main-content">
                <PhotoGrid />
            </div>
        </div>
    )
}
