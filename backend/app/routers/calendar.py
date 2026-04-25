from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse

from app.auth import get_or_create_current_user
from app.repositories import delete_calendar_integration
from app.schemas import CalendarConnectResponse, CalendarStatusResponse
from app.services.calendar import (
    create_calendar_auth_url,
    exchange_calendar_code,
    get_calendar_status,
)
from app.settings import settings

router = APIRouter(tags=["calendar"])


@router.get("/users/me/calendar/connect", response_model=CalendarConnectResponse)
def connect_calendar(current_user: dict = Depends(get_or_create_current_user)) -> CalendarConnectResponse:
    """Return the Google OAuth URL for connecting the user's calendar.

    The frontend should call this endpoint with the normal Firebase bearer
    token, then redirect the browser to the returned `auth_url`. Google will
    show the consent screen for Calendar access and redirect back to the
    backend callback endpoint.

    This endpoint does not store tokens. It only creates a short-lived OAuth
    state document in Firestore so the unauthenticated callback can be mapped
    back to the Matchai user who started the connection flow.
    """
    return CalendarConnectResponse(auth_url=create_calendar_auth_url(current_user["id"]))


@router.get("/auth/google/calendar/callback")
def google_calendar_callback(code: str | None = None, state: str | None = None, error: str | None = None):
    """Handle Google's OAuth callback after Calendar consent.

    Google calls this endpoint after the user approves or denies Calendar
    access. On success, the backend exchanges the authorization code for OAuth
    credentials, stores the Calendar integration under the user's Firestore
    document, and redirects back to the frontend success URL.

    If Google returns an error or the state/code is missing, the user is
    redirected to the configured frontend error URL.
    """
    if error or not code or not state:
        return RedirectResponse(settings.frontend_calendar_error_url)

    try:
        exchange_calendar_code(code=code, state=state)
    except Exception:
        return RedirectResponse(settings.frontend_calendar_error_url)

    return RedirectResponse(settings.frontend_calendar_connected_url)


@router.get("/users/me/calendar/status", response_model=CalendarStatusResponse)
def calendar_status(current_user: dict = Depends(get_or_create_current_user)) -> CalendarStatusResponse:
    """Return whether the authenticated user has connected Google Calendar.

    The response contains only safe metadata for the frontend: connection
    state, Google account email, granted scopes, and last update timestamp.
    Stored access and refresh tokens are never returned to the client.
    """
    return CalendarStatusResponse(**get_calendar_status(current_user["id"]))


@router.delete("/users/me/calendar", response_model=CalendarStatusResponse)
def disconnect_calendar(current_user: dict = Depends(get_or_create_current_user)) -> CalendarStatusResponse:
    """Disconnect Google Calendar for the authenticated user.

    This removes the stored Calendar integration document from Firestore and
    flips the user's `calendar_connected` preference flag back to false. It
    does not revoke the grant at Google; users can revoke app access from
    their Google Account security settings if needed.
    """
    delete_calendar_integration(current_user["id"])
    return CalendarStatusResponse(**get_calendar_status(current_user["id"]))
