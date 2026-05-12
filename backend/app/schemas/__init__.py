"""Pydantic schemas package."""

from app.schemas.analytics import FiltersResponse
from app.schemas.analytics import CourseCoverageItem
from app.schemas.analytics import CourseCoverageResponse
from app.schemas.analytics import DepartmentUploadStat
from app.schemas.analytics import SyllabusListItem
from app.schemas.analytics import SyllabusListResponse
from app.schemas.analytics import TopicCourseItem
from app.schemas.analytics import TopicFrequencyItem
from app.schemas.analytics import TopicFrequencyResponse
from app.schemas.analytics import UserRosterItem
from app.schemas.analytics import UserRosterResponse
from app.schemas.course import CourseCreate
from app.schemas.course import CourseRead
from app.schemas.syllabus import SyllabusRead
from app.schemas.topic import KeywordResponse
from app.schemas.topic import TopicResponse
from app.schemas.topic import TopicUpdate

__all__ = [
    "TopicFrequencyItem",
    "TopicFrequencyResponse",
    "FiltersResponse",
    "SyllabusListItem",
    "SyllabusListResponse",
    "CourseCoverageItem",
    "CourseCoverageResponse",
    "DepartmentUploadStat",
    "TopicCourseItem",
    "UserRosterItem",
    "UserRosterResponse",
    "CourseCreate",
    "CourseRead",
    "SyllabusRead",
    "KeywordResponse",
    "TopicResponse",
    "TopicUpdate",
]
