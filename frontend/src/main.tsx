import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { GalleryProvider } from "@components";

import './index.css';

import { HomePage, UploadPage, PhotoPage, NotFoundPage } from "@pages";

function App() {
    useEffect(() => {
        function setVH() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty("--vh", `${vh}px`);
        }

        setVH();

        window.addEventListener("resize", setVH);

        return () => window.removeEventListener("resize", setVH);
    });

    return (
        <GalleryProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/photos/:photoId" element={<PhotoPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </BrowserRouter>
        </GalleryProvider>
    )
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
