from __future__ import annotations

from fastapi import APIRouter
from fastapi import Depends
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
from app.schemas.analytics import FiltersResponse
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
