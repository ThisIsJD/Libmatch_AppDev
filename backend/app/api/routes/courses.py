from __future__ import annotations

import uuid

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from fastapi import status
from sqlalchemy import func
from sqlalchemy import or_
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.course import Course
from app.models.user import User
from app.schemas.course import CourseCreate
from app.schemas.course import CourseRead

router = APIRouter()


@router.get("", response_model=list[CourseRead])
def list_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CourseRead]:
    stmt = (
        select(Course)
        .where(Course.created_by == current_user.id)
        .order_by(Course.created_at.desc())
    )
    courses = db.execute(stmt).scalars().all()
    return [CourseRead.model_validate(course) for course in courses]


@router.post("", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseRead:
    course = Course(
        course_code=payload.course_code.strip().upper(),
        course_title=payload.course_title.strip(),
        description=payload.description,
        department=payload.department,
        semester=payload.semester,
        created_by=current_user.id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseRead.model_validate(course)


@router.get("/search", response_model=list[CourseRead])
def search_courses(
    q: str = Query(default="", max_length=255),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CourseRead]:
    search_query = q.strip()
    if not search_query:
        return []

    # Full text search handles stemmed words while ILIKE handles partial tokens
    # such as "CS" matching "CS101" and "math" matching "MATH311L".
    ts_query = func.plainto_tsquery("english", search_query)
    like_pattern = f"%{search_query}%"
    stmt = (
        select(Course)
        .where(
            Course.created_by == current_user.id,
            or_(
                Course.search_vector.op("@@")(ts_query),
                Course.course_code.ilike(like_pattern),
                Course.course_title.ilike(like_pattern),
            ),
        )
        .order_by(Course.created_at.desc())
    )
    courses = db.execute(stmt).scalars().all()
    return [CourseRead.model_validate(course) for course in courses]


@router.get("/{course_id}", response_model=CourseRead)
def get_course_by_id(
    course_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseRead:
    stmt = select(Course).where(
        Course.id == course_id,
        Course.created_by == current_user.id,
    )
    course = db.execute(stmt).scalar_one_or_none()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    return CourseRead.model_validate(course)
