from __future__ import annotations

import uuid

from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base import Base


class Keyword(Base):
    __tablename__ = "keywords"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    keyword_text: Mapped[str] = mapped_column(String(255), nullable=False)
    weight: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        server_default=text("0.0"),
    )

    topic: Mapped["Topic"] = relationship(back_populates="keywords")