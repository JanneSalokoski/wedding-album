import type { Photo } from "../components/PhotoFeed";
import type { Person } from "../types";

export async function getPersons(callback: (res: Person[]) => void) {
    try {
        const res = await fetch(`/api/persons`);

        if (!res.ok) {
            console.error("Failed to fetch persons:", res.statusText);
        }

        const tags = await res.json();
        callback(tags);

    } catch (error) {
        console.error("Network error while fetching persons:", error);
    }
}

export async function addPerson(photoId: number, personId: number, callback: (res: Photo) => void) {
    try {
        const res = await fetch(`/api/photos/${photoId}/persons/${personId}`, {
            method: "POST"
        });

        if (!res.ok) {
            console.error("Failed to add person:", res.statusText);
        }

        const photo = await res.json();
        callback(photo);

    } catch (error) {
        console.error("Network error while adding person:", error)
    }

}

export async function createPerson(name: string, callback: (res: Person) => void) {
    try {
        const res = await fetch(`/api/persons`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "name": name })
        });

        if (!res.ok) {
            console.error("Failed to add person:", res.statusText);
        }

        const photo = await res.json();
        callback(photo);

    } catch (error) {
        console.error("Network error while adding person:", error)
    }

}
