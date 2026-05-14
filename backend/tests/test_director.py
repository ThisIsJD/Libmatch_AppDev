import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.course import Course
from app.models.syllabus import Syllabus
from app.models.topic import Topic
from app.models.user import User


def create_user(db: Session, email: str, role: str, password: str = 'libmatch123') -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=f'{role.title()} User',
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_headers(client: TestClient, email: str, password: str) -> dict[str, str]:
    response = client.post('/auth/login', json={'email': email, 'password': password})
    assert response.status_code == 200
    return {'Authorization': f"Bearer {response.json()['access_token']}"}


def create_course(
    db: Session,
    *,
    created_by: User,
    course_code: str,
    department: str | None,
    semester: str | None,
) -> Course:
    course = Course(
        course_code=course_code,
        course_title=f'Course {course_code}',
        description=f'Description for {course_code}',
        department=department,
        semester=semester,
        created_by=created_by.id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def create_syllabus(db: Session, *, course: Course, uploaded_by: User, status: str) -> Syllabus:
    syllabus = Syllabus(
        course_id=course.id,
        file_name=f'{course.course_code.lower()}.pdf',
        file_path=f'/tmp/{course.course_code.lower()}.pdf',
        file_type='pdf',
        raw_text=f'Syllabus for {course.course_code}',
        uploaded_by=uploaded_by.id,
        status=status,
    )
    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)
    return syllabus


def create_syllabus_with_file(
    db: Session,
    *,
    course: Course,
    uploaded_by: User,
    status: str,
    file_path: str,
    file_type: str,
) -> Syllabus:
    syllabus = Syllabus(
        course_id=course.id,
        file_name=f'{course.course_code.lower()}.{file_type}',
        file_path=file_path,
        file_type=file_type,
        raw_text=f'Syllabus for {course.course_code}',
        uploaded_by=uploaded_by.id,
        status=status,
    )
    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)
    return syllabus


def create_topic(
    db: Session,
    *,
    syllabus: Syllabus,
    course: Course,
    topic_text: str,
    is_confirmed: bool,
) -> Topic:
    topic = Topic(
        syllabus_id=syllabus.id,
        course_id=course.id,
        topic_text=topic_text,
        source='extracted',
        is_confirmed=is_confirmed,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@pytest.fixture
def director_user(db: Session) -> User:
    return create_user(db, f'director_{uuid.uuid4()}@example.com', 'director')


@pytest.fixture
def faculty_user(db: Session) -> User:
    return create_user(db, f'faculty_{uuid.uuid4()}@example.com', 'faculty')


def test_director_syllabi_requires_director(client: TestClient, faculty_user: User):
    headers = login_headers(client, faculty_user.email, 'libmatch123')

    response = client.get('/analytics/director/syllabi', headers=headers)

    assert response.status_code == 403


def test_director_syllabi_returns_all_for_director(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
):
    course_one = create_course(
        db,
        created_by=faculty_user,
        course_code='CS101',
        department='Computer Science',
        semester='1st Sem',
    )
    course_two = create_course(
        db,
        created_by=faculty_user,
        course_code='MATH201',
        department='Mathematics',
        semester='2nd Sem',
    )
    create_syllabus(db, course=course_one, uploaded_by=faculty_user, status='processed')
    create_syllabus(db, course=course_two, uploaded_by=faculty_user, status='confirmed')

    headers = login_headers(client, director_user.email, 'libmatch123')
    response = client.get('/analytics/director/syllabi', headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload['total'] >= 2
    assert len(payload['items']) >= 2


def test_director_syllabi_department_filter(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
):
    course_cs = create_course(
        db,
        created_by=faculty_user,
        course_code='CS105',
        department='Computer Science',
        semester='1st Sem',
    )
    course_math = create_course(
        db,
        created_by=faculty_user,
        course_code='MATH105',
        department='Mathematics',
        semester='1st Sem',
    )
    create_syllabus(db, course=course_cs, uploaded_by=faculty_user, status='confirmed')
    create_syllabus(db, course=course_math, uploaded_by=faculty_user, status='confirmed')

    headers = login_headers(client, director_user.email, 'libmatch123')
    response = client.get(
        '/analytics/director/syllabi',
        params={'department': 'Computer Science'},
        headers=headers,
    )

    assert response.status_code == 200
    assert all(item['department'] == 'Computer Science' for item in response.json()['items'])


def test_director_syllabi_status_filter(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
):
    course = create_course(
        db,
        created_by=faculty_user,
        course_code='CS205',
        department='Computer Science',
        semester='1st Sem',
    )
    create_syllabus(db, course=course, uploaded_by=faculty_user, status='processed')
    create_syllabus(db, course=course, uploaded_by=faculty_user, status='confirmed')

    headers = login_headers(client, director_user.email, 'libmatch123')
    response = client.get(
        '/analytics/director/syllabi',
        params={'status': 'processed'},
        headers=headers,
    )

    assert response.status_code == 200
    assert len(response.json()['items']) >= 1
    assert all(item['status'] == 'processed' for item in response.json()['items'])


def test_director_syllabus_file_requires_director(
    client: TestClient,
    faculty_user: User,
):
    headers = login_headers(client, faculty_user.email, 'libmatch123')

    response = client.get(
        f'/analytics/director/syllabi/{uuid.uuid4()}/file',
        headers=headers,
    )

    assert response.status_code == 403


def test_director_syllabus_file_returns_pdf_for_director(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
    tmp_path,
):
    course = create_course(
        db,
        created_by=faculty_user,
        course_code='CS260',
        department='Computer Science',
        semester='1st Sem',
    )
    preview_file_path = tmp_path / 'director-preview.pdf'
    preview_file_path.write_bytes(b'%PDF-1.4 test content')

    syllabus = create_syllabus_with_file(
        db,
        course=course,
        uploaded_by=faculty_user,
        status='confirmed',
        file_path=str(preview_file_path),
        file_type='pdf',
    )

    headers = login_headers(client, director_user.email, 'libmatch123')
    response = client.get(
        f'/analytics/director/syllabi/{syllabus.id}/file',
        headers=headers,
    )

    assert response.status_code == 200
    assert response.headers['content-type'].startswith('application/pdf')
    assert response.content.startswith(b'%PDF')


def test_director_syllabus_file_rejects_docx_preview(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
    tmp_path,
):
    course = create_course(
        db,
        created_by=faculty_user,
        course_code='CS261',
        department='Computer Science',
        semester='1st Sem',
    )
    preview_file_path = tmp_path / 'director-preview.docx'
    preview_file_path.write_bytes(b'DOCX test content')

    syllabus = create_syllabus_with_file(
        db,
        course=course,
        uploaded_by=faculty_user,
        status='processed',
        file_path=str(preview_file_path),
        file_type='docx',
    )

    headers = login_headers(client, director_user.email, 'libmatch123')
    response = client.get(
        f'/analytics/director/syllabi/{syllabus.id}/file',
        headers=headers,
    )

    assert response.status_code == 422
    assert response.json()['detail'] == 'Preview is available only for PDF syllabi.'


def test_syllabi_coverage_includes_courses_without_syllabi(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
):
    covered_course = create_course(
        db,
        created_by=faculty_user,
        course_code='CS301',
        department='Computer Science',
        semester='1st Sem',
    )
    uncovered_course = create_course(
        db,
        created_by=faculty_user,
        course_code='CS302',
        department='Computer Science',
        semester='1st Sem',
    )
    create_syllabus(db, course=covered_course, uploaded_by=faculty_user, status='confirmed')

    headers = login_headers(client, director_user.email, 'libmatch123')
    response = client.get('/analytics/director/syllabi/coverage', headers=headers)

    assert response.status_code == 200
    coverage_by_code = {item['course_code']: item['syllabus_count'] for item in response.json()['items']}
    assert coverage_by_code['CS301'] >= 1
    assert coverage_by_code[uncovered_course.course_code] == 0


def test_department_upload_stats_group_counts(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
):
    primary_department = f"Computer Science {uuid.uuid4().hex[:6]}"
    secondary_department = f"Mathematics {uuid.uuid4().hex[:6]}"

    course_cs = create_course(
        db,
        created_by=faculty_user,
        course_code='CS401',
        department=primary_department,
        semester='1st Sem',
    )
    course_math = create_course(
        db,
        created_by=faculty_user,
        course_code='MATH401',
        department=secondary_department,
        semester='1st Sem',
    )
    create_syllabus(db, course=course_cs, uploaded_by=faculty_user, status='confirmed')
    create_syllabus(db, course=course_cs, uploaded_by=faculty_user, status='processed')
    create_syllabus(db, course=course_math, uploaded_by=faculty_user, status='confirmed')

    headers = login_headers(client, director_user.email, 'libmatch123')
    response = client.get('/analytics/director/departments/upload-stats', headers=headers)

    assert response.status_code == 200
    payload = {item['department']: item['syllabus_count'] for item in response.json()}
    assert payload[primary_department] == 2
    assert payload[secondary_department] == 1


def test_topic_courses_returns_only_matching_confirmed_topics(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
):
    course_match = create_course(
        db,
        created_by=faculty_user,
        course_code='CS501',
        department='Computer Science',
        semester='1st Sem',
    )
    course_other = create_course(
        db,
        created_by=faculty_user,
        course_code='CS502',
        department='Computer Science',
        semester='1st Sem',
    )
    syllabus_match = create_syllabus(
        db,
        course=course_match,
        uploaded_by=faculty_user,
        status='confirmed',
    )
    syllabus_other = create_syllabus(
        db,
        course=course_other,
        uploaded_by=faculty_user,
        status='confirmed',
    )
    create_topic(
        db,
        syllabus=syllabus_match,
        course=course_match,
        topic_text='Advanced Algorithms',
        is_confirmed=True,
    )
    create_topic(
        db,
        syllabus=syllabus_other,
        course=course_other,
        topic_text='Advanced Algorithms',
        is_confirmed=False,
    )

    headers = login_headers(client, director_user.email, 'libmatch123')
    response = client.get(
        '/analytics/director/topics/courses',
        params={'topic_text': 'Advanced Algorithms'},
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]['course_code'] == 'CS501'


def test_director_users_requires_director(
    client: TestClient,
    faculty_user: User,
):
    headers = login_headers(client, faculty_user.email, 'libmatch123')

    response = client.get('/director/users', headers=headers)

    assert response.status_code == 403


def test_director_users_returns_all_roles(
    client: TestClient,
    db: Session,
    director_user: User,
    faculty_user: User,
):
    cataloger_user = create_user(db, f'cataloger_{uuid.uuid4()}@example.com', 'cataloger')
    create_user(db, f'librarian_{uuid.uuid4()}@example.com', 'librarian')

    course = create_course(
        db,
        created_by=faculty_user,
        course_code='CS601',
        department='Computer Science',
        semester='1st Sem',
    )
    create_syllabus(db, course=course, uploaded_by=faculty_user, status='confirmed')

    headers = login_headers(client, director_user.email, 'libmatch123')
    response = client.get('/director/users', headers=headers)

    assert response.status_code == 200
    payload = response.json()['items']
    role_map = {item['email']: item for item in payload}

    assert role_map[director_user.email]['role'] == 'director'
    assert role_map[faculty_user.email]['role'] == 'faculty'
    assert role_map[cataloger_user.email]['role'] == 'cataloger'
    assert role_map[faculty_user.email]['last_upload'] is not None
