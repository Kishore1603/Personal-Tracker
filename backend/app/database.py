from pathlib import Path
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

# Resolve DB path relative to this file so it works regardless of CWD
_DB_URL = settings.DATABASE_URL
if _DB_URL.startswith("sqlite:///."):
    _BASE = Path(__file__).parent.parent  # backend/
    _DB_URL = "sqlite:///" + str(_BASE / "life_tracker.db")

# SQLite connection with foreign keys + WAL for better concurrency
engine = create_engine(
    _DB_URL,
    connect_args={"check_same_thread": False},
    echo=settings.DEBUG,
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, _connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA temp_store=MEMORY")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and seed default categories."""
    from app.models import user, category, habit, time_log, meal  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Seed default categories
    db = SessionLocal()
    try:
        from app.models.category import Category

        existing = db.query(Category).count()
        if existing == 0:
            defaults = [
                Category(name="Health", color="#22c55e", icon="💊"),
                Category(name="Fitness", color="#f97316", icon="🏋️"),
                Category(name="Career", color="#3b82f6", icon="💼"),
                Category(name="Finance", color="#eab308", icon="💰"),
                Category(name="Personal", color="#a855f7", icon="🌱"),
                Category(name="Social", color="#ec4899", icon="👥"),
                Category(name="Learning", color="#06b6d4", icon="📚"),
                Category(name="Mindfulness", color="#84cc16", icon="🧘"),
            ]
            db.add_all(defaults)
            db.commit()
    finally:
        db.close()
