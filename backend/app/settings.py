from functools import lru_cache
from pathlib import Path
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_ENV_FILE, extra="ignore")

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    allow_dev_auth: bool = True

    firebase_project_id: str | None = None
    firebase_credentials_path: str | None = None

    google_oauth_client_id: str | None = None
    google_oauth_client_secret: str | None = None
    google_calendar_redirect_uri: str = "http://127.0.0.1:8000/auth/google/calendar/callback"
    frontend_calendar_connected_url: str = "http://localhost:5173/settings?calendar=connected"
    frontend_calendar_error_url: str = "http://localhost:5173/settings?calendar=error"

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
