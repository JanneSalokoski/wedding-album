import { useState } from "react";

import "./UploadForm.css";
import { GoTrash, GoUpload, GoUnverified, GoVerified, GoImage, GoCircleSlash, GoX } from "react-icons/go";
import { Link, useNavigate } from "react-router-dom";

interface ImagePreview {
    file: File;
    object_url?: string;
    resized?: Blob;
    thumb?: Blob;
    valid: boolean;
}


type ImageStatus =
    | "pending"
    | "processing"
    | "thumbnail"
    | "uploading"
    | "finished"
    | "error";

interface Props {
    maxFileSizeMB?: number;
    maxWidth?: number;
    maxHeight?: number;
}

export function UploadForm({
    maxFileSizeMB = 10,
    maxWidth = 2000,
    maxHeight = 2000,
}: Props) {
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageStatuses, setImageStatuses] = useState<Map<string, ImageStatus>>(
        new Map()
    );
    const [uploaded, setUploaded] = useState<boolean>(false);

    const navigate = useNavigate();

    async function setImageStatus(name: string, status: ImageStatus) {
        setImageStatuses((prev) => {
            const m = new Map(prev);
            m.set(name, status);
            return m;
        });
    }

    async function resizeImage(
        file: File,
        maxW: number,
        maxH: number
    ): Promise<Blob> {
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

        const selected = Array.from(files);

        for (const file of selected) {
            let valid = true;

            if (!file.type.startsWith("image/")) {
                valid = false;
                setError(`${file.name} is not an image`);
            }
            else if (file.size > maxFileSizeMB * 1024 * 1024) {
                valid = false;
                setError(`${file.name} is too large`);
            }

            const status = valid ? "pending" : "error"
            setImageStatus(file.name, status as ImageStatus);

            setImages(prev => [...prev, { file, valid }]);

            if (valid) {
                processImage(file);
            }
        }
    }

    function removeImage(name: string) {
        setImages((prev) => prev.filter((img) => img.file.name !== name));
        setImageStatuses((prev) => {
            const m = new Map(prev);
            m.delete(name);
            return m;
        })
    }

    async function processImage(file: File) {
        try {
            await setImageStatus(file.name, "processing");

            const thumb = await resizeImage(file, 1000, 1000);
            const object_url = URL.createObjectURL(thumb);

            setImages(prev =>
                prev.map(img =>
                    img.file.name === file.name ? { ...img, thumb, object_url } : img
                )
            );

            await setImageStatus(file.name, "thumbnail");

            const resized = await resizeImage(file, maxWidth, maxHeight);

            setImages(prev =>
                prev.map(img =>
                    img.file.name === file.name ? { ...img, resized } : img
                )
            );

            await setImageStatus(file.name, "pending");
        } catch (err) {
            setError(`Failed to process ${file.name}`)
            setImageStatus(file.name, "error");
        }
    }

    async function uploadImages() {
        const ready = images.filter(
            (img) => img.valid && img.resized && img.thumb
        );

        const tasks = ready.map(async (img) => {
            const { file, resized, thumb } = img;
            setImageStatus(file.name, "uploading");

            const formData = new FormData();
            formData.append("original", file);
            formData.append(
                "resized",
                resized!,
                file.name.replace(/\.\w+$/, ".webp")
            );
            formData.append(
                "thumb",
                thumb!,
                "thumb-" + file.name.replace(/\.\w+$/, ".webp")
            );

            const res = await fetch("/api/photos", { method: "POST", body: formData });
            if (!res.ok) {
                setImageStatus(file.name, "error");
            } else {
                setImageStatus(file.name, "finished");
            }
        });

        await Promise.all(tasks);

        setUploaded(true);
        window.setTimeout(() => {
            setImages([]);
            setImageStatuses(new Map());
            navigate("/");
        }, 10 * 1000)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await uploadImages();
        } catch (err) {
            console.error(err);
            setError("Upload failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="UploadForm" onSubmit={handleSubmit}>

            <div>
                <h2>Upload images</h2>
                <p>
                    Here you can upload images to the album. Remember that anyone can see and download the images you submit, so be careful with what you select!
                </p>
            </div>

            {error && (
                <div className="error">
                    <span>Error: {error}</span>
                    <button
                        className="close-button"
                        onClick={() => setError("")}
                    >
                        <GoX />
                    </button>
                </div>
            )}

            <div className="preview-grid">
                {images.map((img) => {
                    const status = imageStatuses.get(img.file.name);
                    const invalid = !img.valid || status === "error";

                    return (
                        <div
                            key={img.file.name}
                            className={`preview-item ${invalid ? "invalid" : ""}`}
                        >
                            <button
                                type="button"
                                className="remove-button"
                                onClick={() => removeImage(img.file.name)}
                            >
                                <GoTrash />
                            </button>

                            {img.object_url && img.valid ? (
                                <img src={img.object_url} alt={img.file.name} />
                            ) : (
                                <div className="placeholder" />
                            )}

                            <div className="info">
                                <span className="name">{img.file.name}</span>
                                <span className="status">{imageStatuses.get(img.file.name)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="messages">
                {uploaded && (
                    <>
                        <p>
                            Upload finished. Returning you back to gallery...
                        </p>
                        <p>
                            <Link to="/">Take me there now.</Link>
                        </p>
                    </>
                )}
            </div>

            <div className="buttons">
                <label htmlFor="file-upload" className="upload-button">
                    <span className="icon-text"><span><GoImage /></span><span>Select images</span></span>
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ opacity: 0, position: "absolute", pointerEvents: "none" }}
                    onChange={(e) => handleFiles(e.target.files)}
                />
                <button type="submit" disabled={loading || images.length === 0}>
                    {loading ? "Uploading..." : (<span className="icon-text"><span><GoUpload /></span><span>Upload</span></span>)}
                </button>
                <Link className="cancel-button button red" to="/">
                    <span className="icon-text"><span><GoCircleSlash /></span><span>Cancel</span></span>
                </Link>
            </div>
        </form>
    );
}

