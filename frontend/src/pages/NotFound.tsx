import { Link } from "react-router-dom";

export function NotFoundPage() {
    return (
        <div className="NotFound page">
            Page not found. <Link to="/">Return home?</Link>
        </div>
    )
}
