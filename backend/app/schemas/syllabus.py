from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel
from pydantic import ConfigDict


class SyllabusCourseSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    course_code: str
    course_title: str
    semester: str | None


class SyllabusRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    course_id: uuid.UUID
    file_name: str
    file_type: str
    raw_text: str | None = None
    upload_date: datetime
    status: str
    uploaded_by: uuid.UUID
    course: SyllabusCourseSummary


class SyllabusListRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    course_id: uuid.UUID
    file_name: str
    file_type: str
    upload_date: datetime
    status: str
    uploaded_by: uuid.UUID
    course: SyllabusCourseSummary