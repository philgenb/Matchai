from fastapi import APIRouter, Depends

from app.auth import get_or_create_current_user
from app.repositories import save_user_preferences, user_preferences
from app.schemas import UserPreferences, UserProfile

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserProfile)
def get_me(current_user: dict = Depends(get_or_create_current_user)) -> UserProfile:
    return UserProfile(**current_user)


@router.get("/users/me/preferences", response_model=UserPreferences)
def get_preferences(current_user: dict = Depends(get_or_create_current_user)) -> UserPreferences:
    return UserPreferences(**user_preferences(current_user["id"]))


@router.post("/users/me/preferences", response_model=UserPreferences)
def save_preferences(
    preferences: UserPreferences,
    current_user: dict = Depends(get_or_create_current_user),
) -> UserPreferences:
    save_user_preferences(current_user["id"], preferences.model_dump())
    return preferences
