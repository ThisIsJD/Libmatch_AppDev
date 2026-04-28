from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base import Base


class Syllabus(Base):
    __tablename__ = "syllabi"
    __table_args__ = (
        CheckConstraint("file_type IN ('pdf', 'docx')", name="syllabi_file_type_valid"),
        CheckConstraint(
            "status IN ('pending', 'processed', 'confirmed')",
            name="syllabi_status_valid",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    upload_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="pending",
    )

    course: Mapped["Course"] = relationship(back_populates="syllabi")
    uploader: Mapped["User"] = relationship(back_populates="syllabi_uploaded")
    topics: Mapped[list["Topic"]] = relationship(
        back_populates="syllabus",
        cascade="all, delete-orphan",
    )