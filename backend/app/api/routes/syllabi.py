from __future__ import annotations

from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.syllabus import Syllabus
from app.models.user import User
from app.schemas.syllabus import SyllabusRead

router = APIRouter()


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
