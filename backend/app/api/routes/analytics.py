from __future__ import annotations

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Query
from sqlalchemy import case
from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_director
from app.db.session import get_db
from app.models.course import Course
from app.models.syllabus import Syllabus
from app.models.topic import Topic
from app.models.user import User
from app.schemas.analytics import CourseCoverageItem
from app.schemas.analytics import CourseCoverageResponse
from app.schemas.analytics import DepartmentUploadStat
from app.schemas.analytics import FiltersResponse
from app.schemas.analytics import SyllabusListItem
from app.schemas.analytics import SyllabusListResponse
from app.schemas.analytics import TopicCourseItem
from app.schemas.analytics import TopicFrequencyItem
from app.schemas.analytics import TopicFrequencyResponse

router = APIRouter()


def course_level_expression():
    digits_only = func.regexp_replace(Course.course_code, "[^0-9]", "", "g")
    leading_digit = func.substring(digits_only, 1, 1)
    return case(
        (func.length(digits_only) > 0, func.concat(leading_digit, "00-level")),
        else_=None,
    )


@router.get("/topics/frequency", response_model=TopicFrequencyResponse)
def get_topic_frequency(
    department: str = "",
    course_level: str = "",
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
) -> TopicFrequencyResponse:
    _ = current_user

    normalized_limit = max(1, min(limit, 100))
    level_value = course_level_expression()
    topic_count = func.count(Topic.id).label("topic_count")

    stmt = (
        select(Topic.topic_text, topic_count)
        .join(Syllabus, Syllabus.id == Topic.syllabus_id)
        .join(Course, Course.id == Syllabus.course_id)
        .where(Topic.is_confirmed.is_(True))
    )

    if department.strip():
        stmt = stmt.where(Course.department == department.strip())

    if course_level.strip():
        stmt = stmt.where(level_value == course_level.strip())

    rows = db.execute(
        stmt.group_by(Topic.topic_text)
        .order_by(topic_count.desc(), Topic.topic_text.asc())
        .limit(normalized_limit)
    ).all()

    items = [
        TopicFrequencyItem(topic_text=row.topic_text, count=int(row.topic_count))
        for row in rows
    ]
    return TopicFrequencyResponse(items=items)


@router.get("/filters", response_model=FiltersResponse)
def get_analytics_filters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
) -> FiltersResponse:
    _ = current_user

    departments = list(
        db.execute(
            select(Course.department)
            .where(Course.department.is_not(None))
            .distinct()
            .order_by(Course.department.asc())
        ).scalars()
    )

    level_value = course_level_expression()
    course_levels = list(
        db.execute(
            select(level_value)
            .where(level_value.is_not(None))
            .distinct()
            .order_by(level_value.asc())
        ).scalars()
    )

    return FiltersResponse(departments=departments, course_levels=course_levels)


@router.get("/director/syllabi", response_model=SyllabusListResponse)
def get_director_syllabi(
    department: str = "",
    semester: str = "",
    status: str = "",
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
) -> SyllabusListResponse:
    _ = current_user

    normalized_page = max(1, page)
    normalized_page_size = max(1, min(page_size, 100))
    offset_value = (normalized_page - 1) * normalized_page_size

    base_stmt = (
        select(
            Syllabus.id,
            Syllabus.file_name,
            Syllabus.file_type,
            Syllabus.status,
            Syllabus.upload_date,
            Course.course_code,
            Course.course_title,
            Course.department,
            User.full_name.label("uploaded_by_name"),
        )
        .join(Course, Course.id == Syllabus.course_id)
        .join(User, User.id == Syllabus.uploaded_by)
    )

    if department.strip():
        base_stmt = base_stmt.where(Course.department == department.strip())

    if semester.strip():
        base_stmt = base_stmt.where(Course.semester.ilike(f"%{semester.strip()}%"))

    if status.strip():
        base_stmt = base_stmt.where(Syllabus.status == status.strip().lower())

    subquery = base_stmt.subquery()
    total = int(db.execute(select(func.count()).select_from(subquery)).scalar_one())

    rows = db.execute(
        base_stmt.order_by(Syllabus.upload_date.desc())
        .offset(offset_value)
        .limit(normalized_page_size)
    ).all()

    items = [
        SyllabusListItem(
            id=row.id,
            file_name=row.file_name,
            file_type=row.file_type,
            status=row.status,
            upload_date=row.upload_date,
            course_code=row.course_code,
            course_title=row.course_title,
            department=row.department,
            uploaded_by_name=row.uploaded_by_name,
        )
        for row in rows
    ]

    return SyllabusListResponse(items=items, total=total)


@router.get("/director/syllabi/coverage", response_model=CourseCoverageResponse)
def get_syllabi_coverage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
) -> CourseCoverageResponse:
    _ = current_user

    syllabus_count = func.count(Syllabus.id).label("syllabus_count")
    rows = db.execute(
        select(
            Course.id.label("course_id"),
            Course.course_code,
            Course.course_title,
            Course.department,
            syllabus_count,
        )
        .outerjoin(Syllabus, Syllabus.course_id == Course.id)
        .group_by(Course.id, Course.course_code, Course.course_title, Course.department)
        .order_by(syllabus_count.asc(), Course.course_code.asc())
    ).all()

    items = [
        CourseCoverageItem(
            course_id=row.course_id,
            course_code=row.course_code,
            course_title=row.course_title,
            department=row.department,
            syllabus_count=int(row.syllabus_count),
        )
        for row in rows
    ]

    return CourseCoverageResponse(items=items)


@router.get(
    "/director/departments/upload-stats",
    response_model=list[DepartmentUploadStat],
)
def get_department_upload_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
) -> list[DepartmentUploadStat]:
    _ = current_user

    syllabus_count = func.count(Syllabus.id).label("syllabus_count")
    rows = db.execute(
        select(Course.department, syllabus_count)
        .join(Syllabus, Syllabus.course_id == Course.id)
        .where(Course.department.is_not(None))
        .group_by(Course.department)
        .order_by(syllabus_count.desc(), Course.department.asc())
    ).all()

    return [
        DepartmentUploadStat(department=row.department, syllabus_count=int(row.syllabus_count))
        for row in rows
    ]


@router.get("/director/topics/courses", response_model=list[TopicCourseItem])
def get_topic_courses(
    topic_text: str = Query(min_length=1, max_length=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
) -> list[TopicCourseItem]:
    _ = current_user

    normalized_topic_text = topic_text.strip().lower()
    rows = db.execute(
        select(
            Course.id.label("course_id"),
            Course.course_code,
            Course.course_title,
            Course.department,
            Syllabus.id.label("syllabus_id"),
        )
        .join(Syllabus, Syllabus.course_id == Course.id)
        .join(Topic, Topic.syllabus_id == Syllabus.id)
        .where(Topic.is_confirmed.is_(True))
        .where(func.lower(Topic.topic_text) == normalized_topic_text)
        .distinct()
        .order_by(Course.course_code.asc())
    ).all()

    return [
        TopicCourseItem(
            course_id=row.course_id,
            course_code=row.course_code,
            course_title=row.course_title,
            department=row.department,
            syllabus_id=row.syllabus_id,
        )
        for row in rows
    ]
