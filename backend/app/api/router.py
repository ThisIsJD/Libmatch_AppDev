from fastapi import APIRouter

from app.api.routes import analytics, auth, courses, syllabi, topics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(syllabi.router, prefix="/syllabi", tags=["syllabi"])
api_router.include_router(topics.router, tags=["topics"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
