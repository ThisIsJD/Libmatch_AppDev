"""SQLAlchemy model package.

Model modules are imported here so Alembic can discover table metadata.
"""

from app.models.course import Course
from app.models.keyword import Keyword
from app.models.syllabus import Syllabus
from app.models.topic import Topic
from app.models.user import User

__all__ = ["User", "Course", "Syllabus", "Topic", "Keyword"]
