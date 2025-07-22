import type { Photo } from "../components/PhotoFeed";

export async function sendView(photoId: number, callback: (res: Photo) => void) {
    try {
        const res = await fetch(`/api/views/${photoId}`, {
            method: "POST",
        });

        if (!res.ok) {
            console.error("Failed to like photo:", res.statusText);
        }

        const photo = await res.json();

        callback(photo);

    } catch (error) {
        console.error("Network error while liking photo:", error);
    }
}
