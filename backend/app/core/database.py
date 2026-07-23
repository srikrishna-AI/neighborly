from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

connect_args = {}
db_url = settings.normalized_database_url

if "ssl-mode=" in db_url or "aivencloud.com" in db_url:
    connect_args["ssl"] = {"ssl_mode": "REQUIRED"}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
