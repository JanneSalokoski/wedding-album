import type { Tag, Photo } from "@types";

export async function getTags(): Promise<Tag[] | null> {
    try {
        const res = await fetch(`/api/tags`);

        if (!res.ok) {
            console.error("Failed to fetch tags:", res.statusText);
            return null;
        }

        return res.json();

    } catch (error) {
        console.error("Network error while fetching tags:", error);
        return null;
    }
}

export async function addTag(photoId: number, tagId: number): Promise<Photo> {
    const res = await fetch(`/api/photos/${photoId}/tags/${tagId}`, {
        method: "POST"
    });

    if (!res.ok) {
        throw new Error("Failed to add tag");
    }

    return res.json();
}

export async function setTags(photoId: number, tag_ids: number[]): Promise<Photo> {
    const res = await fetch(`/api/photos/${photoId}/tags`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(tag_ids)
    });

    if (!res.ok) {
        throw new Error("Failed to add tag");
    }

    return res.json();
}
