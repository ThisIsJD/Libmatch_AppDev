from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field


class CourseCreate(BaseModel):
    course_code: str = Field(min_length=2, max_length=20)
    course_title: str = Field(min_length=2, max_length=255)
    description: str | None = None
    department: str | None = Field(default=None, max_length=100)
    semester: str | None = Field(default=None, max_length=20)


class CourseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    course_code: str
    course_title: str
    description: str | None
    department: str | None
    semester: str | None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime