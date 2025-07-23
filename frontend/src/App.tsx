import { useState, useRef, useCallback, useEffect } from 'react';

import './App.css';

import type { Photo, Tag } from './components/PhotoFeed';

import { UploadForm } from './components/UploadForm';
import { PhotoFeed } from './components/PhotoFeed';

import type { SortOptions } from './components/PhotoFeed/PhotoFeed';
import { getTags } from './api';

export function App() {
    const [photos, setPhotos] = useState<Map<number, Photo>>(() => new Map());
    const seenIds = useRef(new Set<number>());
    const maxId = useRef<number>(0);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [tags, setTags] = useState<Tag[]>([]);

    useEffect(() => {
        getTags((res: Tag[]) => setTags(res));
    }, [])

    const [uploadFormOpen, setUploadFormOpen] = useState<boolean>(false);

    const loadPhotos = useCallback(async (sortOption: SortOptions) => {
        if (!hasMore) return;
        const res = await fetch(`/api/photos?limit=20&offset=${offset}&sort=${sortOption}`);
        const newPhotos: Photo[] = await res.json();

        const filtered = newPhotos.filter(photo => !seenIds.current.has(photo.id));
        filtered.forEach(photo => seenIds.current.add(photo.id));

        if (filtered.length > 0) {
            maxId.current = Math.max(maxId.current, ...filtered.map(p => p.id))

            setPhotos(prev => {
                const updated = new Map(prev);
                for (const photo of filtered) {
                    updated.set(photo.id, photo);
                }

                return updated;
            })

            setOffset(prev => prev + newPhotos.length);
            if (newPhotos.length < 20) setHasMore(false);
        }
    }, [offset, hasMore]);

    function resetPhotos() {
        seenIds.current.clear();
        maxId.current = 0;
        setPhotos(new Map());
        setOffset(0);
        setHasMore(true);
    }

    function updatePhoto(newPhoto: Photo) {
        const newPhotos = new Map([...photos]);
        newPhotos.set(newPhoto.id, newPhoto);

        setPhotos(newPhotos);
    }

    const loadLatestPhotos = async () => {
        setUploadFormOpen(false);

        const res = await fetch(`/api/photos?limit=20&offset=0`);
        const newPhotos: Photo[] = await res.json();

        const freshPhotos = newPhotos.filter(p => !seenIds.current.has(p.id));
        freshPhotos.forEach(p => seenIds.current.add(p.id));

        const freshMap = new Map();
        for (const photo of freshPhotos) {
            freshMap.set(photo.id, photo);
        }

        if (freshPhotos.length > 0) {
            maxId.current = Math.max(maxId.current, ...freshPhotos.map(p => p.id))
            setPhotos(prev => new Map([...freshMap, ...prev]));
        }
    };

    return (
        <div className="App">
            <PhotoFeed
                photos={photos}
                tags={tags}
                loadMore={loadPhotos}
                resetPhotos={resetPhotos}
                updatePhoto={updatePhoto}
                hasMore={hasMore}
            />
            <button className="OpenUploadForm" onClick={() => setUploadFormOpen((prev) => !prev)}>Upload photos</button>
            {uploadFormOpen && (
                <div className="UploadFormOverlay">
                    <button className="close-form" onClick={() => setUploadFormOpen(false)}>Cancel</button>
                    <UploadForm onSuccess={loadLatestPhotos} />
                </div>
            )}
        </div>
    );
}
