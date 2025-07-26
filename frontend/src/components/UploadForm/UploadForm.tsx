import { useState } from "react";

import "./UploadForm.css";

interface ImagePreview {
    file: File;
    src: string;
    resized?: Blob;
    thumb?: Blob;
}

type ImageStatus
    = "pending"
    | "thumbnail"
    | "processing"
    | "validating"
    | "uploading"
    | "finished"
    | "error";

interface Props {
    maxFileSizeMB?: number;
    maxWidth?: number;
    maxHeight?: number;
    onSubmit: (images: { original: File; resized: Blob; thumb: Blob }[]) => Promise<void>;
}
export function UploadForm({
    maxFileSizeMB = 10,
    maxWidth = 2000,
    maxHeight = 2000,
    onSubmit,
}: Props) {
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [imageStatuses, setImageStatuses] = useState<Map<string, ImageStatus>>(new Map());
    const [error, setError] = useState<string | null>(null);

    async function setImageStatus(name: string, status: ImageStatus) {
        setImageStatuses(prev => {
            const newStatuses = new Map(prev);
            newStatuses.set(name, status);

            return newStatuses;
        })
    }

    async function resizeImage(file: File, maxW: number, maxH: number): Promise<Blob> {
        const img = document.createElement("img");
        const url = URL.createObjectURL(file);
        await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.src = url;
        });

        URL.revokeObjectURL(url);

        let { width, height } = img;
        const scale = Math.min(maxW / width, maxH / height, 1);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        return new Promise((resolve) =>
            canvas.toBlob((blob) => resolve(blob!), "image/webp", 0.9)
        );
    }

    async function handleFiles(files: FileList | null) {
        if (!files) {
            return;
        }

        const newImages: ImagePreview[] = [];
        for (const file of Array.from(files)) {

            setImageStatus(file.name, "validating");

            if (!file.type.startsWith("image/")) {
                setError("Only images are allowed");
                continue;
            }

            if (file.size > maxFileSizeMB * 1024 * 1024) {
                setError(`File ${file.name} is too large.`);
                continue;
            }

            const src = URL.createObjectURL(file);
            newImages.push({ file, src });

            setImageStatus(file.name, "pending");

        }

        setImages((prev) => [...prev, ...newImages]);
    }

    async function prepareImages() {
        const results = [];
        for (const img of images) {

            setImageStatus(img.file.name, "processing");

            const resized = await resizeImage(img.file, maxWidth, maxHeight);

            setImageStatus(img.file.name, "thumbnail");

            const thumb = await resizeImage(img.file, 400, 400);

            setImageStatus(img.file.name, "pending");

            results.push({
                original: img.file,
                resized,
                thumb,
            });
        }

        return results;
    }

    async function uploadImages(data: { original: File; resized: Blob; thumb: Blob }[]) {
        for (const { original, resized, thumb } of data) {
            const formData = new FormData();
            formData.append("original", original);
            formData.append("resized", resized, original.name.replace(/\.\w+$/, ".webp"));
            formData.append("thumb", thumb, "thumb-" + original.name.replace(/\.\w+$/, ".webp"));

            const res = await fetch("/api/photos", { method: "POST", body: formData });

            if (!res.ok) {
                setImageStatus(original.name, "error");
                setError("Could not upload all files");
            } else {
                setImageStatus(original.name, "finished");
                setImages([]);
            }

        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const prepared = await prepareImages();
            // await onSubmit(prepared);
            await uploadImages(prepared);
            //setImages([]);
        } catch (err) {
            console.error(err);
            setError("Upload failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="UploadForm" onSubmit={handleSubmit}>
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
            />

            {error && <div className="error">{error}</div>}

            <div className="preview-grid">
                {images.map((img: ImagePreview) => (
                    <div key={img.src} className="preview-item">
                        <img src={img.src} alt="" />
                        <span>{img.file.name}</span>
                        <span>State: {imageStatuses.get(img.file.name)}</span>
                    </div>
                ))}
            </div>

            <button type="submit" disabled={loading || images.length == 0}>
                {loading ? "Uploading..." : "Upload"}
            </button>
        </form>
    )
}
