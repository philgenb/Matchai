from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import groups, users
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


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Matchai API is running"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
