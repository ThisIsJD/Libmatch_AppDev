from __future__ import annotations

from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_director
from app.db.session import get_db
from app.models.syllabus import Syllabus
from app.models.user import User
from app.schemas.analytics import UserRosterItem
from app.schemas.analytics import UserRosterResponse

router = APIRouter()


@router.get('/users', response_model=UserRosterResponse)
def get_director_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_director),
) -> UserRosterResponse:
    _ = current_user

    last_upload_subquery = (
        select(
            Syllabus.uploaded_by.label('user_id'),
            func.max(Syllabus.upload_date).label('last_upload'),
        )
        .group_by(Syllabus.uploaded_by)
        .subquery()
    )

    rows = db.execute(
        select(
            User.id,
            User.email,
            User.full_name,
            User.role,
            last_upload_subquery.c.last_upload,
        )
        .outerjoin(last_upload_subquery, last_upload_subquery.c.user_id == User.id)
        .order_by(User.full_name.asc())
    ).all()

    items = [
        UserRosterItem(
            id=row.id,
            email=row.email,
            full_name=row.full_name,
            role=row.role,
            last_upload=row.last_upload,
        )
        for row in rows
    ]

    return UserRosterResponse(items=items)
