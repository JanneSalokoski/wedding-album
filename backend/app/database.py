from sqlmodel import SQLModel, create_engine, Session
from os import getenv

DATABASE_URL = (
    f"postgresql+psycopg2://{getenv('POSTGRES_USER')}:"
    f"{getenv('POSTGRES_PASSWORD')}@"
    f"{getenv('POSTGRES_HOST')}:{getenv('POSTGRES_PORT')}/"
    f"{getenv('POSTGRES_DB')}"
)

engine = create_engine(DATABASE_URL, echo=True)


def get_session():
    with Session(engine) as session:
        yield session
