export async function sendView(photoId: number) {
    try {
        const res = await fetch(`/api/views/${photoId}`, {
            method: "POST",
        });

        if (!res.ok) {
            console.error("Failed to like photo:", res.statusText);
        }
    } catch (error) {
        console.error("Network error while liking photo:", error);
    }
}
