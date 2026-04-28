from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean
from sqlalchemy import CheckConstraint
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import func
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base import Base


class Topic(Base):
    __tablename__ = "topics"
    __table_args__ = (
        CheckConstraint("source IN ('extracted', 'manual')", name="topics_source_valid"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    syllabus_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("syllabi.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    topic_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_confirmed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    source: Mapped[str] = mapped_column(String(20), nullable=False)
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
    embedding_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cluster_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    llm_generated: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )

    syllabus: Mapped["Syllabus"] = relationship(back_populates="topics")
    course: Mapped["Course"] = relationship(back_populates="topics")
    keywords: Mapped[list["Keyword"]] = relationship(
        back_populates="topic",
        cascade="all, delete-orphan",
    )