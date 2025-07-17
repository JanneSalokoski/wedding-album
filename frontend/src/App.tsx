import React, { useState } from 'react';

import './App.css';

function UploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    }


    async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!file) {
            return;
        }

        setStatus("Uploading to R2...");

        // Build FormData
        const formData = new FormData();
        formData.append("file", file);  // actual image

        const res = await fetch("/api/upload-file", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (res.ok) {
            setStatus(`✅ Uploaded as ${data.key}`);
        } else {
            setStatus("❌ Upload failed");
        }

        console.log(data);
    }


    return (
        <form className="UploadForm" onSubmit={handleUpload}>
            <h2>Upload Photo</h2>
            <label className="form-field" htmlFor="file">
                <span className="form-label">Upload an image</span>
                <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
            <button type="submit" disabled={!file}>Upload</button>
            {
                status && (
                    <div className="status">
                        {status}
                    </div>
                )
            }
        </form>
    )
}

export function App() {
    return (
        <div className="App">
            <UploadForm />
        </div>
    )
}
