from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import calendar, groups, users
from app.settings import settings

app = FastAPI(
    title="Matchai API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(groups.router)
app.include_router(calendar.router)


@app.get("/")
def read_root() -> dict[str, str]:
    """Return a small welcome payload for the Matchai API.

    This endpoint is intentionally public and lightweight. It is useful for
    confirming that the FastAPI application is reachable without exercising
    Firebase Auth, Firestore, or any external planning integrations.
    """
    return {"message": "Matchai API is running"}


@app.get("/health")
def health_check() -> dict[str, str]:
    """Return the basic service health status.

    Load balancers, deployment smoke tests, and local development checks can
    call this endpoint to verify that the API process is alive. It does not
    check downstream dependencies such as Firestore, Tavily, Gemini, or Google
    Calendar.
    """
    return {"status": "ok"}
