import type { Photo } from "@types";

export async function getPhotos(offset = 0, limit = 20, sort = "newest", search: string | null = null): Promise<Photo[]> {
    try {
        const params = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString(),
            sort,
        });

        if (search && search.trim() !== "") {
            params.append("search_query", search.trim());
        }

        const res = await fetch(`/api/photos?${params.toString()}`);


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
