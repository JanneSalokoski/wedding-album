from fastapi import FastAPI
from app.r2_utils import generate_presigned_upload_url
from uuid import uuid4

app = FastAPI()


@app.get("/api/upload-url")
def get_upload_url():
    object_key = f"uploads/{uuid4()}.jpg"
    url = generate_presigned_upload_url(object_key)
    return {"upload_url": url, "object_key": object_key}
