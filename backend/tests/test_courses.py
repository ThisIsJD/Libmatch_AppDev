import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api import deps
from app.models.course import Course
from app.models.user import User


@pytest.fixture
def test_user(db: Session):
    user = User(
        email=f"test_{uuid.uuid4()}@example.com",
        password_hash="hashed",
        full_name="Test User",
        role="faculty",
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def other_user(db: Session):
    user = User(
        email=f"other_{uuid.uuid4()}@example.com",
        password_hash="hashed",
        full_name="Other User",
        role="faculty",
    )
    db.add(user)
    db.commit()
    return user


def create_course(
    db: Session,
    user: User,
    course_code: str,
    course_title: str,
    description: str | None = None,
) -> Course:
    course = Course(
        course_code=course_code,
        course_title=course_title,
        description=description,
        created_by=user.id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def override_current_user(test_user: User) -> None:
    from app.main import app

    app.dependency_overrides[deps.get_current_user] = lambda: test_user


def test_search_by_course_code(client: TestClient, db: Session, test_user: User):
    create_course(db, test_user, "CS101", "Fundamentals of Programming")
    override_current_user(test_user)

    response = client.get("/courses/search", params={"q": "CS101"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["course_code"] == "CS101"


def test_search_by_partial_course_code(client: TestClient, db: Session, test_user: User):
    create_course(db, test_user, "MATH311L", "Linear Algebra Laboratory")
    override_current_user(test_user)

    response = client.get("/courses/search", params={"q": "math"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["course_code"] == "MATH311L"


def test_search_by_title_word(client: TestClient, db: Session, test_user: User):
    create_course(
        db,
        test_user,
        "CS201",
        "Data Structures and Algorithms",
        "Trees, graphs, sorting, and searching",
    )
    override_current_user(test_user)

    response = client.get("/courses/search", params={"q": "algorithms"})


    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["course_title"] == "Data Structures and Algorithms"


def test_search_no_results(client: TestClient, db: Session, test_user: User):
    create_course(db, test_user, "CS301", "Software Engineering")
    override_current_user(test_user)

    response = client.get("/courses/search", params={"q": "xyznonexistent"})

    assert response.status_code == 200
    assert response.json() == []


def test_search_scoped_to_current_user(
    client: TestClient,
    db: Session,
    test_user: User,
    other_user: User,
):
    create_course(db, other_user, "MATH311L", "Linear Algebra Laboratory")
    override_current_user(test_user)

    response = client.get("/courses/search", params={"q": "MATH311L"})

    assert response.status_code == 200
    assert response.json() == []


def test_search_empty_query_returns_empty_list(
    client: TestClient,
    db: Session,
    test_user: User,
):
    create_course(db, test_user, "IT101", "Introduction to Computing")
    override_current_user(test_user)

    response = client.get("/courses/search", params={"q": "   "})

    assert response.status_code == 200
    assert response.json() == []
