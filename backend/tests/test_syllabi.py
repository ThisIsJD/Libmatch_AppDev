import io
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api import deps
from app.api.routes import syllabi as syllabi_routes
from app.models.course import Course
from app.models.keyword import Keyword
from app.models.syllabus import Syllabus
from app.models.topic import Topic
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


def test_upload_pdf_updates_course_from_extracted_info(
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
        lambda _file_path, _file_type: "COURSE DETAILS",
    )
    monkeypatch.setattr(
        syllabi_routes,
        "extract_course_info",
        lambda _raw_text: {
            "course_code": "MATH311L",
            "course_title": "STATISTICS",
            "description": "Basic concepts and principles of statistics.",
            "department": "Additional Mathematics Requirements",
            "semester": "1st Sem, A/Y 2025-26",
        },
    )
    monkeypatch.setattr(syllabi_routes, "extract_topics", lambda _raw_text, limit=25: [])

    response = client.post(
        "/syllabi/upload",
        data={"course_id": str(test_course.id)},
        files={"file": ("syllabus.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")},
    )

    assert response.status_code == 201

    db.refresh(test_course)
    assert test_course.course_code == "MATH311L"
    assert test_course.course_title == "STATISTICS"
    assert test_course.description == "Basic concepts and principles of statistics."
    assert test_course.department == "Additional Mathematics Requirements"
    assert test_course.semester == "1st Sem, A/Y 2025-26"


def test_get_syllabus_includes_raw_text(
    client: TestClient,
    db: Session,
    test_user: User,
    test_course: Course,
):
    override_current_user(test_user)

    syllabus = Syllabus(
        course_id=test_course.id,
        file_name="syllabus.pdf",
        file_path="uploads/syllabus.pdf",
        file_type="pdf",
        raw_text="Line 1\nLine 2\nLine 3",
        uploaded_by=test_user.id,
        status="processed",
    )
    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)

    response = client.get(f"/syllabi/{syllabus.id}")

    assert response.status_code == 200
    assert response.json()["raw_text"] == "Line 1\nLine 2\nLine 3"


def test_get_syllabus_file_returns_pdf(
    client: TestClient,
    db: Session,
    tmp_path,
    test_user: User,
    test_course: Course,
):
    override_current_user(test_user)

    pdf_path = tmp_path / "preview.pdf"
    pdf_path.write_bytes(b"%PDF-1.4\npreview")

    syllabus = Syllabus(
        course_id=test_course.id,
        file_name="preview.pdf",
        file_path=str(pdf_path),
        file_type="pdf",
        raw_text="Preview text",
        uploaded_by=test_user.id,
        status="processed",
    )
    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)

    response = client.get(f"/syllabi/{syllabus.id}/file")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content.startswith(b"%PDF-1.4")


def test_delete_syllabus_removes_topics_and_keywords(
    client: TestClient,
    db: Session,
    test_user: User,
    test_course: Course,
):
    override_current_user(test_user)

    syllabus = Syllabus(
        course_id=test_course.id,
        file_name="syllabus.pdf",
        file_path="uploads/syllabus.pdf",
        file_type="pdf",
        raw_text="Preview body",
        uploaded_by=test_user.id,
        status="processed",
    )
    db.add(syllabus)
    db.flush()

    topic = Topic(
        syllabus_id=syllabus.id,
        course_id=test_course.id,
        topic_text="Object-Oriented Programming",
        source="extracted",
    )
    db.add(topic)
    db.flush()

    keyword = Keyword(
        topic_id=topic.id,
        keyword_text="inheritance",
        weight=1.0,
    )
    db.add(keyword)
    db.commit()

    response = client.delete(f"/syllabi/{syllabus.id}")

    assert response.status_code == 204
    assert db.get(Syllabus, syllabus.id) is None
    assert db.get(Topic, topic.id) is None
    assert db.get(Keyword, keyword.id) is None


def test_delete_syllabus_not_owned_returns_not_found(
    client: TestClient,
    db: Session,
    test_user: User,
    test_course: Course,
):
    owner = User(
        email=f"syllabi_owner_{uuid.uuid4()}@example.com",
        password_hash="hashed",
        full_name="Other Owner",
        role="faculty",
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)

    foreign_syllabus = Syllabus(
        course_id=test_course.id,
        file_name="foreign.pdf",
        file_path="uploads/foreign.pdf",
        file_type="pdf",
        raw_text="Foreign syllabus",
        uploaded_by=owner.id,
        status="processed",
    )
    db.add(foreign_syllabus)
    db.commit()
    db.refresh(foreign_syllabus)

    override_current_user(test_user)

    response = client.delete(f"/syllabi/{foreign_syllabus.id}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Syllabus not found"
