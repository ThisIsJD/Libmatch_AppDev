from __future__ import annotations

import uuid

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
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
