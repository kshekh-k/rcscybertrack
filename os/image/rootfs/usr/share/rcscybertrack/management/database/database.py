import os
from typing import Generator
import management.env  # Ensure .env is loaded
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Environment variable override or default SQLite database location
DEFAULT_DB_URL = "sqlite:///./data/cybertrack.db"
DATABASE_URL = os.getenv("CYBERTRACK_DATABASE_URL", DEFAULT_DB_URL)

# Ensure database directory exists for local SQLite deployment
if DATABASE_URL.startswith("sqlite:///"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

# Configure SQLAlchemy Engine
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True
)

# Session factory and Declarative Base
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency providing a database session transaction per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
