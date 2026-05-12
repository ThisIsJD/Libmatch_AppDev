import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.course import Course
from app.models.syllabus import Syllabus
from app.models.topic import Topic
from app.models.user import User


def create_user(db: Session, email: str, role: str, password: str = "libmatch123") -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=f"{role.title()} User",
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_headers(client: TestClient, email: str, password: str) -> dict[str, str]:
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def add_confirmed_topic(
    db: Session,
    *,
    created_by: User,
    uploaded_by: User,
    course_code: str,
    department: str,
    topic_text: str,
) -> None:
    course = Course(
        course_code=course_code,
        course_title=f"Course {course_code}",
        description=f"Description for {course_code}",
        department=department,
        created_by=created_by.id,
    )
    db.add(course)
    db.flush()

    syllabus = Syllabus(
        course_id=course.id,
        file_name=f"{course_code.lower()}.pdf",
        file_path=f"/tmp/{course_code.lower()}.pdf",
        file_type="pdf",
        raw_text=f"Syllabus content for {course_code}",
        uploaded_by=uploaded_by.id,
        status="confirmed",
    )
    db.add(syllabus)
    db.flush()

    topic = Topic(
        syllabus_id=syllabus.id,
        course_id=course.id,
        topic_text=topic_text,
        source="extracted",
        is_confirmed=True,
    )
    db.add(topic)
    db.commit()


@pytest.fixture
def director_user(db: Session) -> User:
    unique_id = uuid.uuid4()
    return create_user(db, f"director_{unique_id}@example.com", "director")


@pytest.fixture
def faculty_user(db: Session) -> User:
    unique_id = uuid.uuid4()
    return create_user(db, f"faculty_{unique_id}@example.com", "faculty")


def test_frequency_requires_director(
    client: TestClient,
    faculty_user: User,
):
    headers = login_headers(client, faculty_user.email, "libmatch123")

    response = client.get("/analytics/topics/frequency", headers=headers)

    assert response.status_code == 403


def test_filters_requires_director(
    client: TestClient,
    faculty_user: User,
):
    headers = login_headers(client, faculty_user.email, "libmatch123")

    response = client.get("/analytics/filters", headers=headers)

    assert response.status_code == 403


def test_frequency_returns_200_for_director(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
):
    add_confirmed_topic(
        db,
        created_by=faculty_user,
        uploaded_by=faculty_user,
        course_code="CS101",
        department="Computer Science",
        topic_text="Programming Basics",
    )
    headers = login_headers(client, director_user.email, "libmatch123")

    response = client.get("/analytics/topics/frequency", headers=headers)

    assert response.status_code == 200
    assert isinstance(response.json().get("items"), list)


def test_frequency_department_filter(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
):
    add_confirmed_topic(
        db,
        created_by=faculty_user,
        uploaded_by=faculty_user,
        course_code="CS101",
        department="Computer Science",
        topic_text="Programming Basics",
    )
    add_confirmed_topic(
        db,
        created_by=faculty_user,
        uploaded_by=faculty_user,
        course_code="MATH201",
        department="Mathematics",
        topic_text="Linear Algebra",
    )
    headers = login_headers(client, director_user.email, "libmatch123")

    response = client.get(
        "/analytics/topics/frequency",
        params={"department": "Computer Science"},
        headers=headers,
    )

    assert response.status_code == 200
    topic_values = [item["topic_text"] for item in response.json()["items"]]
    assert "Programming Basics" in topic_values
    assert "Linear Algebra" not in topic_values


def test_frequency_course_level_filter(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
):
    add_confirmed_topic(
        db,
        created_by=faculty_user,
        uploaded_by=faculty_user,
        course_code="CS101",
        department="Computer Science",
        topic_text="Intro Programming",
    )
    add_confirmed_topic(
        db,
        created_by=faculty_user,
        uploaded_by=faculty_user,
        course_code="CS201",
        department="Computer Science",
        topic_text="Data Structures",
    )
    headers = login_headers(client, director_user.email, "libmatch123")

    response = client.get(
        "/analytics/topics/frequency",
        params={"course_level": "100-level"},
        headers=headers,
    )

    assert response.status_code == 200
    topic_values = [item["topic_text"] for item in response.json()["items"]]
    assert "Intro Programming" in topic_values
    assert "Data Structures" not in topic_values


def test_filters_returns_departments_and_levels(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
):
    add_confirmed_topic(
        db,
        created_by=faculty_user,
        uploaded_by=faculty_user,
        course_code="CS101",
        department="Computer Science",
        topic_text="Programming Basics",
    )
    add_confirmed_topic(
        db,
        created_by=faculty_user,
        uploaded_by=faculty_user,
        course_code="MATH201",
        department="Mathematics",
        topic_text="Linear Algebra",
    )
    headers = login_headers(client, director_user.email, "libmatch123")

    response = client.get("/analytics/filters", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload.get("departments"), list)
    assert isinstance(payload.get("course_levels"), list)
    assert "Computer Science" in payload["departments"]
    assert "100-level" in payload["course_levels"]
