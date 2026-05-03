import io
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api import deps
from app.api.routes import syllabi as syllabi_routes
from app.models.course import Course
from app.models.syllabus import Syllabus
from app.models.user import User


@pytest.fixture
def test_user(db: Session):
    user = User(
        email=f"syllabi_{uuid.uuid4()}@example.com",
        password_hash="hashed",
        full_name="Syllabi User",
        role="faculty",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_course(db: Session, test_user: User):
    course = Course(
        course_code="CS101",
        course_title="Fundamentals of Programming",
        created_by=test_user.id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def override_current_user(test_user: User) -> None:
    from app.main import app

    app.dependency_overrides[deps.get_current_user] = lambda: test_user


def test_list_syllabi_empty(client: TestClient, test_user: User):
    override_current_user(test_user)

    response = client.get("/syllabi")

    assert response.status_code == 200
    assert response.json() == []


def test_upload_unsupported_type(
    client: TestClient,
    test_user: User,
    test_course: Course,
):
    override_current_user(test_user)

    response = client.post(
        "/syllabi/upload",
        data={"course_id": str(test_course.id)},
        files={"file": ("notes.txt", io.BytesIO(b"plain text"), "text/plain")},
    )

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_upload_pdf_creates_processed_syllabus(
    client: TestClient,
    db: Session,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path,
    test_user: User,
    test_course: Course,
):
    override_current_user(test_user)
    monkeypatch.setattr(syllabi_routes.settings, "upload_dir", str(tmp_path))
    monkeypatch.setattr(
        syllabi_routes,
        "extract_text",
        lambda _file_path, _file_type: "Object-oriented programming and inheritance",
    )
    monkeypatch.setattr(
        syllabi_routes,
        "extract_topics",
        lambda _raw_text, limit=25: [{"topic_text": "Object-Oriented Programming"}],
    )
    monkeypatch.setattr(
        syllabi_routes,
        "extract_keywords_for_topic",
        lambda _topic_text, _raw_text: [{"keyword_text": "inheritance", "weight": 1.0}],
    )

    response = client.post(
        "/syllabi/upload",
        data={"course_id": str(test_course.id)},
        files={"file": ("syllabus.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["file_name"] == "syllabus.pdf"
    assert data["file_type"] == "pdf"
    assert data["status"] == "processed"

    created_syllabus = db.get(Syllabus, uuid.UUID(data["id"]))
    assert created_syllabus is not None
    assert created_syllabus.raw_text == "Object-oriented programming and inheritance"
