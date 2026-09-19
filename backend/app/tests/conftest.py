"""Shared pytest fixtures for tests that need a real database.

Deliberately points at a separate `sitesignal_test` database (never the dev
`sitesignal` database), created once via:
    docker exec sitesignal-db psql -U sitesignal -d sitesignal -c "CREATE DATABASE sitesignal_test;"
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401 — registers all models on Base.metadata
from app.db.base import Base

TEST_DATABASE_URL = "postgresql+psycopg://sitesignal:sitesignal@localhost:5433/sitesignal_test"


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def db_session(test_engine):
    """A session per test, with every table truncated afterward so tests
    never see leftover rows from a previous test."""
    Session = sessionmaker(bind=test_engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        with test_engine.begin() as conn:
            for table in reversed(Base.metadata.sorted_tables):
                conn.execute(table.delete())
