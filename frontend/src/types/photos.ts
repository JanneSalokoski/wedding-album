import type { Tag } from "@types";
import type { Person } from "@types";

export interface Photo {
    id: number;
    original_url: string;
    resized_url: string;
    thumb_url: string;
    likes: number;
    views: number;
    uploaded_at: string;
    tags: Tag[];
    persons: Person[];
}
