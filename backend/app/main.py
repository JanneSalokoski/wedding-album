from fastapi import FastAPI, UploadFile, File
from app.r2_utils import generate_presigned_post, s3_client, R2_BUCKET
from uuid import uuid4

app = FastAPI(root_path="/api")


@app.get("/upload-url")
def get_upload_url():
    object_key = f"uploads/{uuid4()}.jpg"
    return generate_presigned_post(object_key)


@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    object_key = f"uploads/{file.filename}"
    contents = await file.read()

    s3_client.put_object(
        Bucket=R2_BUCKET, Key=object_key, Body=contents, ContentType=file.content_type
    )

    return {"key": object_key}
