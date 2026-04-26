from fastapi import APIRouter, Depends

from app.auth import get_or_create_current_user
from app.repositories import save_user_preferences, user_preferences, user_ref
from app.schemas import UserPreferences, UserProfile

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserProfile)
def get_me(current_user: dict = Depends(get_or_create_current_user)) -> UserProfile:
    """Return the authenticated user's Matchai profile.

    The request must include an `Authorization: Bearer <token>` header. In
    production this token is a Firebase ID token from the React frontend. For
    local development, `Bearer dev:<email>` is accepted when dev auth is
    enabled.

    The auth dependency verifies the token and creates or updates the user
    document in Firestore before this handler returns the normalized profile.
    """
    return UserProfile(**current_user)


@router.get("/users/me/preferences", response_model=UserPreferences)
def get_preferences(current_user: dict = Depends(get_or_create_current_user)) -> UserPreferences:
    """Return the current user's scheduling preferences.

    Preferences are stored under the authenticated user's Firestore document.
    If the user has not completed onboarding yet, the repository returns the
    MVP defaults: common interests, no home city, no location label, and no
    connected calendar.
    """
    return UserPreferences(**user_preferences(current_user["id"]))


@router.post("/users/me/preferences", response_model=UserPreferences)
def save_preferences(
    preferences: UserPreferences,
    current_user: dict = Depends(get_or_create_current_user),
) -> UserPreferences:
    """Create or update the current user's scheduling preferences.

    The frontend calls this after onboarding or whenever the user changes
    their interests, home city, location label, or calendar connection flag.
    These preferences are later used by the scheduling flow to choose a mock
    availability window, search for venues, and generate a meetup proposal.
    """
    save_user_preferences(current_user["id"], preferences.model_dump())
    user_ref(current_user["id"]).set({"onboarding_completed": preferences.onboarding_completed}, merge=True)
    return preferences
