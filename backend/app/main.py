from fastapi import FastAPI, UploadFile, File, Depends, Query
from app.r2_utils import (
    generate_presigned_post,
    generate_presigned_view_url,
    s3_client,
    R2_BUCKET,
)
from uuid import uuid4
from sqlmodel import SQLModel, Session, select
from app.database import engine, get_session
from app.models import Photo, PhotoRead

from enum import Enum

app = FastAPI(root_path="/api")


@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)


@app.get("/upload-url")
def get_upload_url():
    object_key = f"uploads/{uuid4()}.jpg"
    return generate_presigned_post(object_key)


@app.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...), session: Session = Depends(get_session)
):
    object_key = f"uploads/{file.filename}"
    contents = await file.read()

    s3_client.put_object(
        Bucket=R2_BUCKET, Key=object_key, Body=contents, ContentType=file.content_type
    )

    photo = Photo(key=object_key, content_type=file.content_type)
    session.add(photo)
    session.commit()
    session.refresh(photo)

    return {"id": photo.id, "key": photo.key}


class SortOption(str, Enum):
    newest = "newest"
    oldest = "oldest"
    liked = "liked"
    viewed = "viewed"


@app.get("/photos", response_model=list[PhotoRead])
def list_photos(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort: SortOption = Query(SortOption.newest),
    session: Session = Depends(get_session),
):
    query = select(Photo)

    if sort == SortOption.newest:
        query = query.order_by(Photo.uploaded_at.desc())
    elif sort == SortOption.oldest:
        query = query.order_by(Photo.uploaded_at.asc())
    elif sort == SortOption.liked:
        query = query.order_by(Photo.likes.desc())
    elif sort == SortOption.viewed:
        query = query.order_by(Photo.views.desc())

    photos = session.exec(query.offset(offset).limit(limit)).all()

    return [
        {
            "id": photo.id,
            "key": photo.key,
            "likes": photo.likes,
            "views": photo.views,
            "uploaded_at": photo.uploaded_at,
            "url": generate_presigned_view_url(photo.key),
        }
        for photo in photos
    ]
