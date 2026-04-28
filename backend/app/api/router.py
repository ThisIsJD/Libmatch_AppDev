from fastapi import APIRouter

from app.api.routes import auth, courses, syllabi, topics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(syllabi.router, prefix="/syllabi", tags=["syllabi"])
api_router.include_router(topics.router, tags=["topics"])
