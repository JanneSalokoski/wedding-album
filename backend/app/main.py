from fastapi import FastAPI, UploadFile, File, Depends, Query, HTTPException
from app.r2_utils import (
    generate_presigned_post,
    generate_presigned_view_url,
    s3_client,
    R2_BUCKET,
)
from uuid import uuid4
from sqlmodel import SQLModel, Session, select
from app.database import engine, get_session
from app.models import DBPhoto, PublicPhoto, DBTag, PublicTag, CreateTag

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

    photo = DBPhoto(key=object_key, content_type=file.content_type)
    photo.url = generate_presigned_view_url(photo.key)
    session.add(photo)
    session.commit()
    session.refresh(photo)

    return {"id": photo.id, "key": photo.key}


class SortOption(str, Enum):
    newest = "newest"
    oldest = "oldest"
    liked = "liked"
    viewed = "viewed"


@app.get("/photos", response_model=list[PublicPhoto])
def list_photos(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort: SortOption = Query(SortOption.newest),
    session: Session = Depends(get_session),
):
    query = select(DBPhoto)

    if sort == SortOption.newest:
        query = query.order_by(DBPhoto.uploaded_at.desc())
    elif sort == SortOption.oldest:
        query = query.order_by(DBPhoto.uploaded_at.asc())
    elif sort == SortOption.liked:
        query = query.order_by(DBPhoto.likes.desc())
    elif sort == SortOption.viewed:
        query = query.order_by(DBPhoto.views.desc())

    photos = session.exec(query.offset(offset).limit(limit)).all()

    return photos


@app.post("/photos/{photo_id}/tags/{tag_id}", response_model=PublicPhoto)
def add_tag_to_photo(
    photo_id: int, tag_id: int, session: Session = Depends(get_session)
):
    photo = session.get(DBPhoto, photo_id)
    tag = session.get(DBTag, tag_id)

    if not photo or not tag:
        raise HTTPException(status_code=404, detail="Photo or tag not found")

    if tag not in photo.tags:
        photo.tags.append(tag)
        session.add(photo)
        session.commit()
        session.refresh(photo)

    return photo


@app.post("/views/{photo_id}", response_model=PublicPhoto)
def view_photo(photo_id: int, session: Session = Depends(get_session)):
    photo = session.exec(select(DBPhoto).where(DBPhoto.id == photo_id)).first()

    if not photo:
        raise HTTPException(status_code=404, details="Photo not found")

    photo.views += 1
    session.add(photo)
    session.commit()
    session.refresh(photo)

    return photo


@app.post("/likes/{photo_id}", response_model=PublicPhoto)
def like_photo(photo_id: int, session: Session = Depends(get_session)):
    photo = session.exec(select(DBPhoto).where(DBPhoto.id == photo_id)).first()

    if not photo:
        raise HTTPException(status_code=404, details="Photo not found")

    photo.likes += 1
    session.add(photo)
    session.commit()
    session.refresh(photo)

    return photo


@app.get("/tags", response_model=list[PublicTag])
def view_tags(session: Session = Depends(get_session)):
    tags = session.exec(select(DBTag)).all()

    return tags


@app.get("/tags/{tag_id}", response_model=PublicTag)
def view_tag(tag_id: int, session: Session = Depends(get_session)):
    tag = session.exec(select(DBTag).where(DBTag.id == tag_id)).first()

    if not tag:
        raise HTTPException(status_code=404, details="Tag not found")

    return tag


@app.post("/tags", response_model=PublicTag)
def create_tag(tag: CreateTag, session: Session = Depends(get_session)):
    db_tag = DBTag.model_validate(tag)

    session.add(db_tag)
    session.commit()
    session.refresh(db_tag)

    return db_tag


@app.patch("/tags/{tag_id}", response_model=PublicTag)
def update_tag(tag_id: int, tag: CreateTag, session: Session = Depends(get_session)):
    db_tag = session.exec(select(DBTag).where(DBTag.id == tag_id)).first()

    if not db_tag:
        raise HTTPException(status_code=404, details="Tag not found")

    data = tag.model_dump(exclude_unset=True)
    db_tag.sqlmodel_update(data)

    session.add(db_tag)
    session.commit()
    session.refresh(tag)

    return db_tag
