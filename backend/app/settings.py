from functools import lru_cache
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    allow_dev_auth: bool = True

    firebase_project_id: str | None = None
    firebase_credentials_path: str | None = None

    tavily_api_key: str | None = None
    gemini_api_key: str | None = None


class FirebaseUser(BaseModel):
    firebase_uid: str
    email: str
    name: str
    profile_image: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
