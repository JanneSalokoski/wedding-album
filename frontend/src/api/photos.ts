import type { Photo } from "@types";

export async function getPhotos(offset = 0, limit = 20): Promise<Photo[]> {
    try {
        const res = await fetch(`/api/photos?offset=${offset}&limit=${limit}`);

        if (!res.ok) {
            console.error("Failed to fetch photos:", res.statusText);
        }

        return res.json();

    } catch (error) {
        console.error("Network error while fetching photos:", error);
    }

    return [];
}

export async function getPhoto(photoId: number): Promise<Photo | null> {
    try {
        const res = await fetch(`/api/photos/${photoId}`);

        if (!res.ok) {
            console.error("Failed to fetch photo:", res.statusText);
            return null;
        }

        return res.json();
    } catch (err) {
        console.error("Network error while fetching photo:", err);
        return null;
    }
}

export async function refreshPhotoUrl(photo_id: number): Promise<Photo> {
    const res = await fetch(`api/photos/${photo_id}/url`);

    if (!res.ok) {
        console.error("Failed to get photo:", res.statusText);
    }

    return res.json();
}

export async function flagPhoto(photo_id: number) {
    try {
        const res = await fetch(`/api/photos/${photo_id}/flag`, {
            method: "POST"
        });

        if (!res.ok) {
            console.error("Failed to flag photo:", res.statusText);
        }

        return res.json();

    } catch (error) {
        console.error("Network error while flagging photo:", error);
    }

}
