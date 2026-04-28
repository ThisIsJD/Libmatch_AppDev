import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.api import deps
from app.db.base import Base
from app.core.config import get_settings

# For tests, we use a separate SQLite in-memory database if possible, 
# but Libmatch uses PostgreSQL features (UUID). 
# For now, we will mock the database session or use a test postgres if available.
# To keep it simple and portable for this task, we will use the actual DB 
# but roll back transactions.

@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(get_settings().database_url)
    yield engine

@pytest.fixture(scope="function")
def db(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = SessionLocal()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[deps.get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
