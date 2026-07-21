import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.anhcvndjvypucrneqhvq:tpscl!13467@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
)
# PostgreSQL 연결 설정 (SQLite 전용 옵션이었던 check_same_thread는 제거됨)
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()