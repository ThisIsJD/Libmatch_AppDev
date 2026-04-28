import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.course import Course
from app.models.syllabus import Syllabus
from app.models.topic import Topic
from app.models.keyword import Keyword

@pytest.fixture
def test_user(db: Session):
    user = User(
        email=f"test_{uuid.uuid4()}@example.com",
        password_hash="hashed",
        full_name="Test User",
        role="faculty"
    )
    db.add(user)
    db.commit()
    return user

@pytest.fixture
def test_course(db: Session, test_user: User):
    course = Course(
        course_code="TEST101",
        course_title="Test Course",
        created_by=test_user.id
    )
    db.add(course)
    db.commit()
    return course

@pytest.fixture
def test_syllabus(db: Session, test_course: Course, test_user: User):
    syllabus = Syllabus(
        course_id=test_course.id,
        file_name="test.pdf",
        file_path="/tmp/test.pdf",
        file_type="pdf",
        raw_text="Test syllabus content",
        uploaded_by=test_user.id,
        status="processed"
    )
    db.add(syllabus)
    db.commit()
    return syllabus

def test_get_topics(client: TestClient, db: Session, test_syllabus: Syllabus, test_user: User):
    # Mock current user
    from app.main import app
    app.dependency_overrides[deps.get_current_user] = lambda: test_user

    # Add a topic
    topic = Topic(
        syllabus_id=test_syllabus.id,
        course_id=test_syllabus.course_id,
        topic_text="Existing Topic",
        source="extracted"
    )
    db.add(topic)
    db.commit()

    response = client.get(f"/syllabi/{test_syllabus.id}/topics")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["topic_text"] == "Existing Topic"

def test_put_topics_intelligent_merge(client: TestClient, db: Session, test_syllabus: Syllabus, test_user: User):
    # Mock current user
    from app.main import app
    app.dependency_overrides[deps.get_current_user] = lambda: test_user

    # 1. Create initial topic
    topic1 = Topic(
        syllabus_id=test_syllabus.id,
        course_id=test_syllabus.course_id,
        topic_text="Topic 1",
        source="extracted"
    )
    db.add(topic1)
    db.commit()

    # 2. Prepare PUT payload: Update topic1, delete none, add topic2
    payload = [
        {
            "id": str(topic1.id),
            "topic_text": "Topic 1 Updated",
            "source": "extracted",
            "keywords": [{"keyword_text": "kw1", "weight": 0.5}]
        },
        {
            "topic_text": "Topic 2 New",
            "source": "manual",
            "keywords": []
        }
    ]

    response = client.put(f"/syllabi/{test_syllabus.id}/topics", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    # Verify update
    t1 = next(t for t in data if t["id"] == str(topic1.id))
    assert t1["topic_text"] == "Topic 1 Updated"
    assert t1["is_confirmed"] is True
    assert len(t1["keywords"]) == 1
    
    # Verify creation
    t2 = next(t for t in data if t["topic_text"] == "Topic 2 New")
    assert t2["source"] == "manual"
    assert t2["is_confirmed"] is True

    # Verify syllabus status
    db.refresh(test_syllabus)
    assert test_syllabus.status == "confirmed"

def test_put_topics_deletion(client: TestClient, db: Session, test_syllabus: Syllabus, test_user: User):
    # Mock current user
    from app.main import app
    app.dependency_overrides[deps.get_current_user] = lambda: test_user

    # 1. Create two topics
    topic1 = Topic(syllabus_id=test_syllabus.id, course_id=test_syllabus.course_id, topic_text="T1", source="manual")
    topic2 = Topic(syllabus_id=test_syllabus.id, course_id=test_syllabus.course_id, topic_text="T2", source="manual")
    db.add_all([topic1, topic2])
    db.commit()

    # 2. PUT payload with only topic2
    payload = [
        {
            "id": str(topic2.id),
            "topic_text": "T2",
            "source": "manual",
            "keywords": []
        }
    ]

    response = client.put(f"/syllabi/{test_syllabus.id}/topics", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == str(topic2.id)

    # Verify deletion of topic1
    assert db.get(Topic, topic1.id) is None
