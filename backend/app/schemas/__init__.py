"""Pydantic schemas package."""

from app.schemas.course import CourseCreate
from app.schemas.course import CourseRead
from app.schemas.syllabus import SyllabusRead

__all__ = ["CourseCreate", "CourseRead", "SyllabusRead"]
