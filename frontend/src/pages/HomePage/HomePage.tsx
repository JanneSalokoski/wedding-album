import { Gallery } from "@components";
import { Link } from "react-router-dom";

import "./HomePage.css";

export function HomePage() {
    return (
        <div className="HomePage page">
            <Gallery />
            <div className="upload-overlay" tabIndex={1}>
                <Link className="upload-button" to="/upload">Upload photos</Link>
            </div>
        </div>
    )
}
