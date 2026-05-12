from __future__ import annotations

import os

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.course import Course
from app.models.user import User

DEFAULT_EMAIL = "faculty@libmatch.dev"
DEFAULT_PASSWORD = "libmatch123"
DEFAULT_FULL_NAME = "LibMatch Faculty"
DIRECTOR_EMAIL = "director@libmatch.dev"
DIRECTOR_PASSWORD = "libmatch123"
DIRECTOR_FULL_NAME = "LibMatch Director"

SEED_COURSES = [
    {
        "course_code": "CS101",
        "course_title": "Fundamentals of Programming",
        "description": "Introduction to problem solving, control flow, and basic programming constructs.",
        "department": "Computer Science",
        "semester": "1st Sem",
    },
    {
        "course_code": "CS201",
        "course_title": "Data Structures and Algorithms",
        "description": "Core data structures, algorithm analysis, and practical implementation techniques.",
        "department": "Computer Science",
        "semester": "2nd Sem",
    },
    {
        "course_code": "CS301",
        "course_title": "Software Engineering",
        "description": "Software process, architecture, testing, and collaborative development practices.",
        "department": "Computer Science",
        "semester": "1st Sem",
    },
]


def seed() -> None:
    email = os.getenv("LIBMATCH_SEED_EMAIL", DEFAULT_EMAIL).strip().lower()
    password = os.getenv("LIBMATCH_SEED_PASSWORD", DEFAULT_PASSWORD)
    full_name = os.getenv("LIBMATCH_SEED_FULL_NAME", DEFAULT_FULL_NAME).strip() or DEFAULT_FULL_NAME

    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        user_created = False

        if user is None:
            user = User(
                email=email,
                password_hash=hash_password(password),
                full_name=full_name,
                role="faculty",
            )
            db.add(user)
            db.flush()
            user_created = True

        existing_codes = set(
            db.execute(
                select(Course.course_code).where(Course.created_by == user.id)
            ).scalars()
        )

        inserted_courses = 0
        skipped_courses = 0

        for payload in SEED_COURSES:
            if payload["course_code"] in existing_codes:
                skipped_courses += 1
                continue

            db.add(
                Course(
                    created_by=user.id,
                    **payload,
                )
            )
            inserted_courses += 1

        director = db.execute(
            select(User).where(User.email == DIRECTOR_EMAIL)
        ).scalar_one_or_none()
        director_created = False
        if director is None:
            db.add(
                User(
                    email=DIRECTOR_EMAIL,
                    password_hash=hash_password(DIRECTOR_PASSWORD),
                    full_name=DIRECTOR_FULL_NAME,
                    role="director",
                )
            )
            director_created = True

        db.commit()

        print("Seed complete")
        print(f"- User: {'created' if user_created else 'already exists'} ({email})")
        print(
            "- Director: "
            f"{'created' if director_created else 'already exists'} ({DIRECTOR_EMAIL})"
        )
        print(f"- Courses inserted: {inserted_courses}")
        print(f"- Courses skipped: {skipped_courses}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()