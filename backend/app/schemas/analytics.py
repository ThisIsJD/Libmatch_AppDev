from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel
from pydantic import ConfigDict


class TopicFrequencyItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    topic_text: str
    count: int


class TopicFrequencyResponse(BaseModel):
    items: list[TopicFrequencyItem]


class FiltersResponse(BaseModel):
    departments: list[str]
    course_levels: list[str]


class SyllabusListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_name: str
    file_type: str
    status: str
    upload_date: datetime
    course_code: str
    course_title: str
    department: str | None
    uploaded_by_name: str


class SyllabusListResponse(BaseModel):
    items: list[SyllabusListItem]
    total: int


class CourseCoverageItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    course_id: uuid.UUID
    course_code: str
    course_title: str
    department: str | None
    syllabus_count: int


class CourseCoverageResponse(BaseModel):
    items: list[CourseCoverageItem]


class DepartmentUploadStat(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    department: str
    syllabus_count: int


class TopicCourseItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    course_id: uuid.UUID
    course_code: str
    course_title: str
    department: str | None
    syllabus_id: uuid.UUID


class UserRosterItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: str
    last_upload: datetime | None


class UserRosterResponse(BaseModel):
    items: list[UserRosterItem]
