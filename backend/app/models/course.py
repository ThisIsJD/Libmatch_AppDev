from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Computed
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Index
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base import Base


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (
        Index(
            "ix_courses_search_vector",
            "search_vector",
            postgresql_using="gin",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    course_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    course_title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    semester: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    search_vector: Mapped[str | None] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('english', "
            "coalesce(course_code, '') || ' ' || "
            "coalesce(course_title, '') || ' ' || "
            "coalesce(description, '')"
            ")",
            persisted=True,
        ),
    )

    creator: Mapped["User"] = relationship(back_populates="courses_created")
    syllabi: Mapped[list["Syllabus"]] = relationship(back_populates="course")
    topics: Mapped[list["Topic"]] = relationship(back_populates="course")