import type { Tag, Photo } from "../components/PhotoFeed";

export async function getTags(callback: (res: Tag[]) => void) {
    try {
        const res = await fetch(`/api/tags`);

        if (!res.ok) {
            console.error("Failed to fetch tags:", res.statusText);
        }

        const tags = await res.json();
        callback(tags);

    } catch (error) {
        console.error("Network error while fetching tags:", error);
    }
}

export async function addTag(photoId: number, tagId: number, callback: (res: Photo) => void) {
    try {
        const res = await fetch(`/api/photos/${photoId}/tags/${tagId}`, {
            method: "POST"
        });

        if (!res.ok) {
            console.error("Failed to add tag:", res.statusText);
        }

        const photo = await res.json();
        callback(photo);

    } catch (error) {
        console.error("Network error while adding tag:", error)
    }

}
