from fastapi import APIRouter

router = APIRouter()


@router.get("/syllabi/{syllabus_id}/topics/status")
def topics_status(syllabus_id: str) -> dict[str, str]:
    return {
        "module": "topics",
        "syllabus_id": syllabus_id,
        "status": "scaffolded",
    }
