from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class Photo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str
    views: int = 0
    likes: int = 0
    content_type: Optional[str]
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class PhotoRead(SQLModel):
    id: int
    key: str
    url: str
    views: int
    likes: int
    uploaded_at: datetime
