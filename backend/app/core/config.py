from functools import lru_cache

from pydantic import Field
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LibMatch API"
    environment: str = "development"

    database_url: str = ""
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    upload_dir: str = "./uploads"

    allowed_origins_csv: str = Field(
        default="http://localhost:5173",
        validation_alias="ALLOWED_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str | None) -> str:
        if value is None:
            return ""

        normalized = value.strip().strip('"').strip("'")
        prefix = "DATABASE_URL="
        if normalized.upper().startswith(prefix):
            return normalized[len(prefix):]
        return normalized

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins_csv.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
