import "./Gallery.css";

function Photo() {
    return (
        <li className="photo">
        </li>
    )
}

function PhotoGrid() {
    return (
        <ol className="photogrid">
            {
                [...Array(100).keys()].map(i => <Photo key={i} />)
            }
        </ol>
    )
}

export function Gallery() {
    return (
        <div className="gallery">
            <div className="settings-bar">Settings here</div>
            <div className="main-content">
                <PhotoGrid />
            </div>
        </div>
    )
}
