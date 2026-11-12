from sqlmodel import SQLModel, create_engine, Session
from config import DATABASE_URL


engine_options = {"echo": False}
if DATABASE_URL.startswith("sqlite"):
    # SQLite connections are thread-bound unless this option is disabled.
    engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_options)

def create_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
