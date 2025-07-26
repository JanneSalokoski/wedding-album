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
from app.models import (
    DBPhoto,
    PublicPhoto,
    DBTag,
    PublicTag,
    CreateTag,
    DBPerson,
    PublicPerson,
    CreatePerson,
)

from datetime import datetime, timedelta

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
    session.add(photo)
    session.commit()
    session.refresh(photo)

    return {"id": photo.id, "key": photo.key}


@app.post("/photos")
async def upload_photo(
    original: UploadFile = File(...),
    resized: UploadFile = File(...),
    thumb: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    key = f"{uuid4()}-{original.filename}"

    original_contents = await original.read()
    resized_contents = await resized.read()
    thumb_contents = await thumb.read()

    s3_client.put_object(
        Bucket=R2_BUCKET,
        Key=f"orig/{key}",
        Body=original_contents,
        ContentType=original.content_type,
    )

    s3_client.put_object(
        Bucket=R2_BUCKET,
        Key=f"resized/{key}",
        Body=resized_contents,
        ContentType=resized.content_type,
    )

    s3_client.put_object(
        Bucket=R2_BUCKET,
        Key=f"thumb/{key}",
        Body=thumb_contents,
        ContentType=thumb.content_type,
    )

    photo = DBPhoto(
        key=key,
        content_type=resized.content_type,
        original_url=generate_presigned_view_url(f"orig/{key}"),
        resized_url=generate_presigned_view_url(f"resized/{key}"),
        thumb_url=generate_presigned_view_url(f"thumb/{key}"),
        url_expires_at=datetime.utcnow() + timedelta(seconds=60 * 60),
    )

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
    query = select(DBPhoto).where(DBPhoto.flagged == False)

    if sort == SortOption.newest:
        query = query.order_by(DBPhoto.uploaded_at.desc())
    elif sort == SortOption.oldest:
        query = query.order_by(DBPhoto.uploaded_at.asc())
    elif sort == SortOption.liked:
        query = query.order_by(DBPhoto.likes.desc())
    elif sort == SortOption.viewed:
        query = query.order_by(DBPhoto.views.desc())

    photos = session.exec(query.offset(offset).limit(limit)).all()

    now = datetime.utcnow()
    updated = False
    for photo in photos:
        if photo.url_expires_at <= now + timedelta(minutes=5):
            photo.original_url = generate_presigned_view_url(f"orig/{photo.key}")
            photo.resized_url = generate_presigned_view_url(f"resized/{photo.key}")
            photo.thumb_url = generate_presigned_view_url(f"thumb/{photo.key}")
            photo.url_expires_at = now + timedelta(hours=24)
            session.add(photo)
            updated = True

    if updated:
        session.commit()

    return photos


@app.get("/photos/{photo_id}", response_model=PublicPhoto)
def get_photo(photo_id: int, session: Session = Depends(get_session)):
    photo = session.get(DBPhoto, photo_id)

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    now = datetime.utcnow()
    if photo.url_expires_at <= now + timedelta(minutes=5):
        photo.original_url = generate_presigned_view_url(f"orig/{photo.key}")
        photo.resized_url = generate_presigned_view_url(f"resized/{photo.key}")
        photo.thumb_url = generate_presigned_view_url(f"thumb/{photo.key}")
        photo.url_expires_at = now + timedelta(hours=24)
        session.add(photo)
        session.commit()

    return photo


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


@app.post("/photos/{photo_id}/tags", response_model=PublicPhoto)
def set_tags(
    photo_id: int, tag_ids: list[int], session: Session = Depends(get_session)
):
    photo = session.get(DBPhoto, photo_id)
    tags = [session.get(DBTag, id) for id in tag_ids]

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    photo.tags = tags
    session.add(photo)
    session.commit()
    session.refresh(photo)

    return photo


@app.post("/photos/{photo_id}/persons", response_model=PublicPhoto)
def set_persons(
    photo_id: int, person_ids: list[int], session: Session = Depends(get_session)
):
    photo = session.get(DBPhoto, photo_id)
    persons = [session.get(DBPerson, id) for id in person_ids]

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    photo.persons = persons
    session.add(photo)
    session.commit()
    session.refresh(photo)

    return photo


@app.post("/photos/{photo_id}/persons/{person_id}", response_model=PublicPhoto)
def add_person_to_photo(
    photo_id: int, person_id: int, session: Session = Depends(get_session)
):
    photo = session.get(DBPhoto, photo_id)
    person = session.get(DBPerson, person_id)

    if not photo or not person:
        raise HTTPException(status_code=404, detail="Photo or person not found")

    if person not in photo.tags:
        photo.persons.append(person)
        session.add(photo)
        session.commit()
        session.refresh(photo)

    return photo


@app.post("/photos/{photo_id}/flag")
def flag_image(photo_id: int, session: Session = Depends(get_session)):
    photo = session.exec(select(DBPhoto).where(DBPhoto.id == photo_id)).first()

    if not photo:
        raise HTTPException(status_code=404, details="Photo not found")

    photo.flagged = True
    session.add(photo)
    session.commit()
    session.refresh(photo)

    print(photo)

    return {"status": "ok"}


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


@app.get("/persons", response_model=list[PublicPerson])
def view_persons(session: Session = Depends(get_session)):
    persons = session.exec(select(DBPerson)).all()

    return persons


@app.get("/persons/{person_id}", response_model=PublicPerson)
def view_person(person_id: int, session: Session = Depends(get_session)):
    person = session.exec(select(DBPerson).where(DBPerson.id == person_id)).first()

    if not person:
        raise HTTPException(status_code=404, details="Person not found")

    return person


@app.post("/persons", response_model=PublicPerson)
def create_person(person: CreatePerson, session: Session = Depends(get_session)):
    db_person = DBPerson.model_validate(person)

    session.add(db_person)
    session.commit()
    session.refresh(db_person)

    return db_person


@app.patch("/persons/{person_id}", response_model=PublicPerson)
def update_person(
    person_id: int, person: CreatePerson, session: Session = Depends(get_session)
):
    db_person = session.exec(select(DBPerson).where(DBPerson.id == person_id)).first()

    if not db_person:
        raise HTTPException(status_code=404, details="Person not found")

    data = person.model_dump(exclude_unset=True)
    db_person.sqlmodel_update(data)

    session.add(db_person)
    session.commit()
    session.refresh(person)

    return db_person
