import { useEffect, useState } from "react";

import { formatFileSize } from "../../utils/formatFileSize";

import "./UploadForm.css";

interface UploadFormProps {
    onSuccess?: () => void
}

export function UploadForm({ onSuccess }: UploadFormProps) {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    type UploadStatus =
        | { type: "pending" }
        | { type: "uploading" }
        | { type: "uploaded"; key: string }
        | { type: "error"; message: string }

    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [statusMessages, setStatusMessages] = useState<UploadStatus[]>([]);
    const [globalStatus, setGlobalStatus] = useState<"idle" | "uploading" | "done">("idle");

    useEffect(() => {
        if (!files) {
            setPreviewUrls([]);
            return;
        }

        const statuses = files.map(file => {
            if (file.size > MAX_FILE_SIZE) {
                return { type: "error", message: "File too large" } as UploadStatus;
            }
            return { type: "pending" } as UploadStatus;
        });
        setStatusMessages(statuses);

        const urls = Array.from(files).map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);

        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
        }
    }, [files]);

    useEffect(() => {
        if (globalStatus === "done") {
            const timeout = setTimeout(() => {
                setFiles([]);
                setPreviewUrls([]);
                setStatusMessages([]);
                setGlobalStatus("idle");
            }, 3000);

            return () => clearTimeout(timeout);
        }
    }, [globalStatus]);

    async function setStatus(idx: number, status: UploadStatus) {
        setStatusMessages(prev =>
            prev.map((s, i) => (i === idx) ? status : s)
        );
    }


    function handleUploads(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setGlobalStatus("uploading");

        const uploadableIndexes = statusMessages
            .map((status, idx) => status.type !== "error" ? idx : null)
            .filter((i): i is number => i !== null);

        if (uploadableIndexes.length === 0) {
            setGlobalStatus("done");
            return;
        }

        uploadableIndexes.forEach(idx => {
            handleUpload(files[idx], idx);
        });
    }

    async function handleUpload(file: File, idx: number) {
        setStatus(idx, { type: "uploading" });
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload-file", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setStatus(idx, { type: "uploaded", key: data.key });
            } else {
                setStatus(idx, { type: "error", message: "Upload failed" });
            }
        } catch (err) {
            setStatus(idx, { type: "error", message: "Network error" });
        }

        setStatusMessages((prev) => {
            const next = [...prev];
            next[idx] = next[idx]; // ensure reactivity

            const doneCount = next.filter(
                (s) => s?.type === "uploaded" || s?.type === "error"
            ).length;

            if (doneCount === files.length) {
                setGlobalStatus("done");
                onSuccess?.();
            }

            return next;
        });
    }

    function removeFile(index: number) {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFiles = Array.from(e.target.files ?? []);
        setFiles(selectedFiles);
    }

    return (
        <form className="UploadForm" onSubmit={handleUploads}>
            <h2>Upload Photos</h2>
            <label className="form-field" htmlFor="file">
                <span className="form-label">Select photos to upload</span>
                <input type="file"
                    accept="image/*"
                    multiple={true}
                    onChange={handleFileChange}
                />
            </label>

            <ol className="CandidatePhotos">
                {Array.from(files ?? []).map((file, idx) => (
                    <li key={file.name} className="CandidatePhoto">
                        <img className="preview" src={previewUrls[idx]} alt={file.name} />
                        <ul className="file-info">
                            <li className="filename">Filename: {file.name}</li>
                            <li className="filesize">Size: {formatFileSize(file.size)}</li>
                            <li className="status">
                                Status: {
                                    (() => {
                                        const status = statusMessages[idx];

                                        if (!status) {
                                            return "Pending";
                                        }

                                        switch (status.type) {
                                            case "pending": return "Pending";
                                            case "uploading": return "Uploading...";
                                            case "uploaded": return `Uploaded as ${status.key}`;
                                            case "error": return `Error: ${status.message}`;
                                        }
                                    })()
                                }
                            </li>
                        </ul>
                        <button type="button" onClick={() => removeFile(idx)}>Remove</button>
                    </li>
                ))}
            </ol>

            <button type="submit" disabled={!files || files.length === 0 || globalStatus !== "idle"}>Upload</button>

            {globalStatus === "done" && (
                <div className="global-status success">All files uploaded</div>
            )}
            {globalStatus === "uploading" && (
                <div className="global-status">Uploading...</div>
            )}
        </form>
    )
}


