export async function sendLike(photoId: number) {
    try {
        const res = await fetch(`/api/likes/${photoId}`, {
            method: "POST",
        });

        if (!res.ok) {
            console.error("Failed to like photo:", res.statusText);
        }
    } catch (error) {
        console.error("Network error while liking photo:", error);
    }
}
