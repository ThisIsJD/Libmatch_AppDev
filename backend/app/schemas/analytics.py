from __future__ import annotations

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
