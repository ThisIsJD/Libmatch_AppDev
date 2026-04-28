"""Pydantic schemas package."""

from app.schemas.course import CourseCreate
from app.schemas.course import CourseRead
from app.schemas.syllabus import SyllabusRead
from app.schemas.topic import KeywordResponse
from app.schemas.topic import TopicResponse
from app.schemas.topic import TopicUpdate

__all__ = [
    "CourseCreate",
    "CourseRead",
    "SyllabusRead",
    "KeywordResponse",
    "TopicResponse",
    "TopicUpdate",
]
