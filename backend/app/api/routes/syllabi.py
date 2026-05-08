from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import Form
from fastapi import HTTPException
from fastapi import UploadFile
from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.course import Course
from app.models.keyword import Keyword
from app.models.syllabus import Syllabus
from app.models.topic import Topic
from app.models.user import User
from app.schemas.syllabus import SyllabusRead
from app.services.extractor import extract_text
from app.services.nlp import extract_course_info
from app.services.nlp import extract_keywords_for_topic
from app.services.nlp import extract_topics
from app.services.storage import infer_file_type
from app.services.storage import save_upload_file

router = APIRouter()
settings = get_settings()


@router.get("", response_model=list[SyllabusRead])
def list_syllabi(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SyllabusRead]:
    stmt = (
        select(Syllabus)
        .options(selectinload(Syllabus.course))
        .where(Syllabus.uploaded_by == current_user.id)
        .order_by(Syllabus.upload_date.desc())
    )
    syllabi = db.execute(stmt).scalars().all()
    return [SyllabusRead.model_validate(syllabus) for syllabus in syllabi]


@router.get("/{syllabus_id}", response_model=SyllabusRead)
def get_syllabus(
    syllabus_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SyllabusRead:
    stmt = (
        select(Syllabus)
        .options(selectinload(Syllabus.course))
        .where(Syllabus.id == syllabus_id, Syllabus.uploaded_by == current_user.id)
    )
    syllabus = db.execute(stmt).scalar_one_or_none()
    if syllabus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Syllabus not found",
        )
    return SyllabusRead.model_validate(syllabus)


@router.post("/upload", response_model=SyllabusRead, status_code=status.HTTP_201_CREATED)
def upload_syllabus(
    course_id: uuid.UUID | None = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SyllabusRead:
    pre_selected_course: Course | None = None

    if course_id is not None:
        pre_selected_course = db.execute(
            select(Course).where(
                Course.id == course_id,
                Course.created_by == current_user.id,
            )
        ).scalar_one_or_none()
        if pre_selected_course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )

    stored_path: str | None = None
    upload_succeeded = False

    try:
        stored_path, original_name = save_upload_file(file, settings.upload_dir)
        file_type = infer_file_type(original_name)
        raw_text = extract_text(stored_path, file_type)
        extracted_course_fields = extract_course_info(raw_text)

        if pre_selected_course is not None:
            # Update the pre-selected course with any extracted fields.
            for field_name, field_value in extracted_course_fields.items():
                setattr(pre_selected_course, field_name, field_value)
            if extracted_course_fields:
                db.flush()
            course = pre_selected_course
        else:
            # Auto-detect: find an existing course by extracted code, or create one.
            extracted_code = extracted_course_fields.get("course_code")
            detected_course: Course | None = None

            if extracted_code:
                detected_course = db.execute(
                    select(Course).where(
                        Course.course_code == extracted_code,
                        Course.created_by == current_user.id,
                    )
                ).scalar_one_or_none()

            if detected_course is not None:
                for field_name, field_value in extracted_course_fields.items():
                    setattr(detected_course, field_name, field_value)
                db.flush()
                course = detected_course
            else:
                course = Course(
                    course_code=extracted_course_fields.get("course_code") or "UNKNOWN",
                    course_title=extracted_course_fields.get("course_title") or "Untitled Course",
                    description=extracted_course_fields.get("description"),
                    department=extracted_course_fields.get("department"),
                    semester=extracted_course_fields.get("semester"),
                    created_by=current_user.id,
                )
                db.add(course)
                db.flush()

        topic_suggestions = extract_topics(raw_text, limit=25)

        syllabus = Syllabus(
            course_id=course.id,
            file_name=original_name,
            file_path=stored_path,
            file_type=file_type,
            raw_text=raw_text,
            uploaded_by=current_user.id,
            status="processed",
        )
        db.add(syllabus)
        db.flush()

        for suggestion in topic_suggestions:
            topic_text = str(suggestion.get("topic_text", "")).strip()
            if not topic_text:
                continue

            topic = Topic(
                syllabus_id=syllabus.id,
                course_id=course.id,
                topic_text=topic_text,
                source="extracted",
            )
            db.add(topic)
            db.flush()

            keyword_suggestions = extract_keywords_for_topic(topic_text, raw_text)
            for keyword_suggestion in keyword_suggestions:
                keyword = Keyword(
                    topic_id=topic.id,
                    keyword_text=str(keyword_suggestion.get("keyword_text", "")).strip(),
                    weight=float(keyword_suggestion.get("weight", 0.0)),
                )
                if keyword.keyword_text:
                    db.add(keyword)

        db.commit()
        upload_succeeded = True

        created_syllabus = db.execute(
            select(Syllabus)
            .options(selectinload(Syllabus.course))
            .where(Syllabus.id == syllabus.id)
        ).scalar_one()
        return SyllabusRead.model_validate(created_syllabus)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process syllabus upload.",
        ) from exc
    finally:
        if not upload_succeeded and stored_path:
            _delete_uploaded_file(stored_path)
        file.file.close()


def _delete_uploaded_file(file_path: str) -> None:
    """Best-effort cleanup for files written during failed upload flows."""
    path = Path(file_path)
    if path.exists() and path.is_file():
        path.unlink(missing_ok=True)
