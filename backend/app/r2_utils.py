import boto3
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from botocore.client import Config

load_dotenv()

R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_ENDPOINT = os.getenv(
    "R2_ENDPOINT"
)  # e.g. https://<account>.r2.cloudflarestorage.com
R2_BUCKET = os.getenv("R2_BUCKET")

session = boto3.session.Session()
s3_client = session.client(
    service_name="s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto",
    config=Config(signature_version="s3v4"),
)


def generate_presigned_upload_url(object_key: str, expiration_minutes: int = 15):
    print(f"Bucket: {R2_BUCKET}")

    return s3_client.generate_presigned_url(
        "put_object",
        Params={"Bucket": R2_BUCKET, "Key": object_key},
        ExpiresIn=expiration_minutes * 60,
    )


def generate_presigned_post(object_key: str, expiration_minutes: int = 15):
    return s3_client.generate_presigned_post(
        Bucket=R2_BUCKET,
        Key=object_key,
        ExpiresIn=expiration_minutes * 60,
        Fields=None,
        Conditions=[{"acl": "private"}, ["starts-with", "$Content-Type", ""]],
    )


def generate_presigned_view_url(object_key: str, expiration_minutes: int = 60):
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": R2_BUCKET, "Key": object_key},
        ExpiresIn=expiration_minutes * 60,
    )
