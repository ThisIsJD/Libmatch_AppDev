from __future__ import annotations

import uuid
from datetime import datetime
from typing import List
from typing import Optional

from pydantic import BaseModel
from pydantic import ConfigDict


class KeywordBase(BaseModel):
    keyword_text: str
    weight: float = 0.0


class KeywordCreate(KeywordBase):
    pass


class KeywordResponse(KeywordBase):
    id: uuid.UUID
    topic_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class TopicBase(BaseModel):
    topic_text: str
    source: str = "extracted"


class TopicCreate(TopicBase):
    keywords: List[KeywordCreate] = []


class TopicUpdate(TopicBase):
    id: Optional[uuid.UUID] = None
    is_confirmed: bool = False
    keywords: List[KeywordCreate] = []


class TopicResponse(TopicBase):
    id: uuid.UUID
    syllabus_id: uuid.UUID
    course_id: uuid.UUID
    is_confirmed: bool
    created_at: datetime
    updated_at: datetime
    keywords: List[KeywordResponse] = []

    model_config = ConfigDict(from_attributes=True)
