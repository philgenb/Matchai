from datetime import UTC, datetime, timedelta
import os
import secrets
from typing import Any
from urllib.parse import urlparse

from fastapi import HTTPException
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.repositories import (
    calendar_oauth_state_ref,
    get_calendar_integration,
    save_calendar_integration,
)
from app.schemas import MeetingProposal
from app.settings import settings
from app.storage import now_iso

CALENDAR_SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.freebusy",
    "https://www.googleapis.com/auth/calendar.events",
]


def _require_oauth_settings() -> None:
    if not settings.google_oauth_client_id or not settings.google_oauth_client_secret:
        raise HTTPException(
            status_code=503,
            detail="Google Calendar OAuth is not configured",
        )


def _client_config() -> dict[str, Any]:
    _require_oauth_settings()
    _allow_local_loopback_oauth()
    return {
        "web": {
            "client_id": settings.google_oauth_client_id,
            "client_secret": settings.google_oauth_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.google_calendar_redirect_uri],
        }
    }


def _allow_local_loopback_oauth() -> None:
    redirect_uri = urlparse(settings.google_calendar_redirect_uri)
    if redirect_uri.scheme == "http" and redirect_uri.hostname in {"127.0.0.1", "localhost"}:
        os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")
    os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")


def create_calendar_auth_url(user_id: str) -> str:
    """Create a Google OAuth consent URL for connecting Calendar access."""
    from google_auth_oauthlib.flow import Flow

    state = secrets.token_urlsafe(32)
    expires_at = (datetime.now(UTC) + timedelta(minutes=10)).isoformat()
    calendar_oauth_state_ref(state).set(
        {
            "user_id": user_id,
            "created_at": now_iso(),
            "expires_at": expires_at,
        }
    )

    flow = Flow.from_client_config(
        _client_config(),
        scopes=CALENDAR_SCOPES,
        redirect_uri=settings.google_calendar_redirect_uri,
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    return auth_url


def exchange_calendar_code(code: str, state: str) -> str:
    """Exchange an OAuth callback code and persist the user's calendar tokens."""
    from google_auth_oauthlib.flow import Flow

    state_snapshot = calendar_oauth_state_ref(state).get()
    if not state_snapshot.exists:
        raise HTTPException(status_code=400, detail="Invalid calendar OAuth state")

    state_data = state_snapshot.to_dict() or {}
    expires_at = datetime.fromisoformat(state_data["expires_at"])
    if datetime.now(UTC) > expires_at:
        calendar_oauth_state_ref(state).delete()
        raise HTTPException(status_code=400, detail="Expired calendar OAuth state")

    flow = Flow.from_client_config(
        _client_config(),
        scopes=CALENDAR_SCOPES,
        redirect_uri=settings.google_calendar_redirect_uri,
    )
    flow.fetch_token(code=code)
    credentials = flow.credentials

    user_info = _fetch_user_info(credentials.token)
    save_calendar_integration(
        state_data["user_id"],
        {
            "google_email": user_info.get("email"),
            "google_sub": user_info.get("sub"),
            "scopes": list(credentials.scopes or CALENDAR_SCOPES),
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "expiry": credentials.expiry.isoformat() if credentials.expiry else None,
        },
    )
    calendar_oauth_state_ref(state).delete()
    return state_data["user_id"]


def _fetch_user_info(access_token: str | None) -> dict[str, Any]:
    if not access_token:
        return {}

    import httpx

    try:
        response = httpx.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=8,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError:
        return {}


def _credentials_for_user(user_id: str) -> Credentials | None:
    integration = get_calendar_integration(user_id)
    if not integration or not integration.get("refresh_token"):
        return None

    expiry = integration.get("expiry")
    credentials = Credentials(
        token=integration.get("token"),
        refresh_token=integration.get("refresh_token"),
        token_uri=integration.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=settings.google_oauth_client_id,
        client_secret=settings.google_oauth_client_secret,
        scopes=integration.get("scopes") or CALENDAR_SCOPES,
        expiry=datetime.fromisoformat(expiry) if expiry else None,
    )

    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        save_calendar_integration(
            user_id,
            {
                **integration,
                "token": credentials.token,
                "expiry": credentials.expiry.isoformat() if credentials.expiry else None,
            },
        )
    return credentials


def get_calendar_status(user_id: str) -> dict[str, Any]:
    integration = get_calendar_integration(user_id)
    if not integration:
        return {"connected": False, "google_email": None, "scopes": [], "updated_at": None}
    return {
        "connected": True,
        "google_email": integration.get("google_email"),
        "scopes": integration.get("scopes") or [],
        "updated_at": integration.get("updated_at"),
    }


def get_busy_windows(user_id: str, time_min: str, time_max: str) -> list[dict[str, str]]:
    """Return busy windows from the user's primary Google Calendar."""
    credentials = _credentials_for_user(user_id)
    if not credentials:
        return []

    service = build("calendar", "v3", credentials=credentials, cache_discovery=False)
    response = (
        service.freebusy()
        .query(
            body={
                "timeMin": time_min,
                "timeMax": time_max,
                "items": [{"id": "primary"}],
            }
        )
        .execute()
    )
    return response.get("calendars", {}).get("primary", {}).get("busy", [])


def create_calendar_event(user_id: str, proposal: MeetingProposal) -> str | None:
    """Create a Google Calendar event for a proposal and return its HTML link."""
    credentials = _credentials_for_user(user_id)
    if not credentials:
        return None

    service = build("calendar", "v3", credentials=credentials, cache_discovery=False)
    event = {
        "summary": proposal.title,
        "description": f"{proposal.summary}\n\n{proposal.rationale}",
        "location": f"{proposal.location_name}, {proposal.address}",
        "start": {"dateTime": proposal.starts_at},
        "end": {"dateTime": proposal.ends_at},
    }
    created = service.events().insert(calendarId="primary", body=event).execute()
    return created.get("htmlLink")
