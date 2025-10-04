import type { Photo } from "@types";

export async function sendLike(photoId: number): Promise<Photo | null> {
    try {
        const res = await fetch(`/likes/${photoId}`, {
            method: "POST",
        });

        if (!res.ok) {
            console.error("Failed to like photo:", res.statusText);
            return null;
        }

        return res.json();

    } catch (error) {
        console.error("Network error while liking photo:", error);
        return null;
    }
}
