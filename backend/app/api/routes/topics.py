import uuid
from typing import List

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy import delete
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api import deps
from app.models.keyword import Keyword
from app.models.syllabus import Syllabus
from app.models.topic import Topic
from app.schemas.topic import TopicResponse
from app.schemas.topic import TopicUpdate

router = APIRouter()


@router.get("/syllabi/{syllabus_id}/topics", response_model=List[TopicResponse])
def get_syllabus_topics(
    syllabus_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
) -> List[Topic]:
    """Fetch all topics for a given syllabus."""
    # Verify syllabus ownership
    syllabus = db.scalar(
        select(Syllabus).where(
            Syllabus.id == syllabus_id, Syllabus.uploaded_by == current_user.id
        )
    )
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    topics = db.scalars(
        select(Topic).where(Topic.syllabus_id == syllabus_id).order_by(Topic.created_at)
    ).all()
    return list(topics)


@router.put("/syllabi/{syllabus_id}/topics", response_model=List[TopicResponse])
def update_syllabus_topics(
    syllabus_id: uuid.UUID,
    topics_in: List[TopicUpdate],
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
) -> List[Topic]:
    """Bulk update topics for a syllabus using Intelligent Merge."""
    # Verify syllabus ownership
    syllabus = db.scalar(
        select(Syllabus).where(
            Syllabus.id == syllabus_id, Syllabus.uploaded_by == current_user.id
        )
    )
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # 1. Get existing topics for this syllabus
    existing_topics = {
        topic.id: topic
        for topic in db.scalars(
            select(Topic).where(Topic.syllabus_id == syllabus_id)
        ).all()
    }

    # 2. Identify topics to keep/update, delete, and create
    provided_ids = {t.id for t in topics_in if t.id is not None}
    to_delete = set(existing_topics.keys()) - provided_ids

    # Perform deletions
    if to_delete:
        db.execute(delete(Topic).where(Topic.id.in_(to_delete)))

    # 3. Process updates and creations
    final_topics = []
    for topic_data in topics_in:
        if topic_data.id and topic_data.id in existing_topics:
            # Update existing
            topic = existing_topics[topic_data.id]
            topic.topic_text = topic_data.topic_text
            topic.source = topic_data.source
            topic.is_confirmed = True

            # Re-sync keywords (complete replacement within the topic)
            db.execute(delete(Keyword).where(Keyword.topic_id == topic.id))
            for kw in topic_data.keywords:
                new_kw = Keyword(
                    topic_id=topic.id,
                    keyword_text=kw.keyword_text,
                    weight=kw.weight,
                )
                db.add(new_kw)
            final_topics.append(topic)
        else:
            # Create new
            new_topic = Topic(
                syllabus_id=syllabus_id,
                course_id=syllabus.course_id,
                topic_text=topic_data.topic_text,
                source=topic_data.source,
                is_confirmed=True,
            )
            db.add(new_topic)
            db.flush()  # Get ID for keywords

            for kw in topic_data.keywords:
                new_kw = Keyword(
                    topic_id=new_topic.id,
                    keyword_text=kw.keyword_text,
                    weight=kw.weight,
                )
                db.add(new_kw)
            final_topics.append(new_topic)

    # 4. Update parent syllabus status
    syllabus.status = "confirmed"

    db.commit()

    # Refetch to get all nested data
    db.expire_all()
    return list(
        db.scalars(
            select(Topic)
            .where(Topic.syllabus_id == syllabus_id)
            .order_by(Topic.created_at)
        ).all()
    )
