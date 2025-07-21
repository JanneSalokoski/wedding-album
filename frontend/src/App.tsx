import { useState, useRef, useCallback } from 'react';

import './App.css';

import type { Photo } from './components/PhotoFeed';

import { UploadForm } from './components/UploadForm';
import { PhotoFeed } from './components/PhotoFeed';


export function App() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const seenIds = useRef(new Set<number>());
    const maxId = useRef<number>(0);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadPhotos = useCallback(async () => {
        if (!hasMore) return;
        const res = await fetch(`/api/photos?limit=20&offset=${offset}`);
        const newPhotos: Photo[] = await res.json();

        const filtered = newPhotos.filter(photo => !seenIds.current.has(photo.id));
        filtered.forEach(photo => seenIds.current.add(photo.id));

        if (filtered.length > 0) {
            maxId.current = Math.max(maxId.current, ...filtered.map(p => p.id))
            setPhotos(prev => [...prev, ...filtered]);
            setOffset(prev => prev + newPhotos.length);
            if (newPhotos.length < 20) setHasMore(false);
        }
    }, [offset, hasMore]);

    const loadLatestPhotos = async () => {
        const res = await fetch(`/api/photos?limit=20&offset=0`);
        const newPhotos: Photo[] = await res.json();

        const freshPhotos = newPhotos.filter(p => !seenIds.current.has(p.id));
        freshPhotos.forEach(p => seenIds.current.add(p.id));

        if (freshPhotos.length > 0) {
            maxId.current = Math.max(maxId.current, ...freshPhotos.map(p => p.id))
            setPhotos(prev => [...freshPhotos, ...prev]);
        }
    };

    return (
        <div className="App">
            <UploadForm onSuccess={loadLatestPhotos} />
            <PhotoFeed
                photos={photos}
                loadMore={loadPhotos}
                hasMore={hasMore}
            />
        </div>
    );
}
