from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional


class PhotoTagLink(SQLModel, table=True):
    photo_id: int = Field(foreign_key="dbphoto.id", primary_key=True)
    tag_id: int = Field(foreign_key="dbtag.id", primary_key=True)


class BasePhoto(SQLModel):
    key: str
    url: str
    views: int
    likes: int
    uploaded_at: datetime


class DBPhoto(BasePhoto, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str
    url: str
    views: int = 0
    likes: int = 0
    content_type: Optional[str]
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    tags: list["DBTag"] = Relationship(back_populates="photos", link_model=PhotoTagLink)


class PublicPhoto(BasePhoto):
    tags: list["PublicTag"]


class BaseTag(SQLModel):
    name: str


class DBTag(BaseTag, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

    photos: list[DBPhoto] = Relationship(back_populates="tags", link_model=PhotoTagLink)


class PublicTag(BaseTag):
    id: int
    name: str


class CreateTag(BaseTag):
    name: str
