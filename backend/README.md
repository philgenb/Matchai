# Matchai Backend

FastAPI backend for the Matchai social scheduling MVP. Firebase Auth handles identity and Firestore stores app data.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Auth

Production requests should send a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

For local development, dev auth is enabled by default:

```http
Authorization: Bearer dev:alice@example.com
```

The backend will create or update the user profile automatically.

## Firebase / Firestore

The API uses these Firestore collections:

- `users/{firebase_uid}`
- `users/{firebase_uid}/private/preferences`
- `groups/{group_id}`
- `groups/{group_id}/members/{firebase_uid}`
- `groups/{group_id}/proposals/{proposal_id}`
- `groups/{group_id}/proposals/{proposal_id}/rsvps/{firebase_uid}`
- `invite_codes/{invite_code}` for fast invite joins
- `proposal_index/{proposal_id}` for RSVP lookup

For local development, use Google Application Default Credentials:

```bash
gcloud auth application-default login
gcloud config set project bigberlin-hack26ber-3030
```

Then set `FIREBASE_PROJECT_ID` in `.env`. Do not create or commit service-account JSON keys.

For production, deploy FastAPI to Cloud Run and grant the Cloud Run service account Firestore access, for example `Cloud Datastore User`. The backend will use the runtime identity automatically.

## Core Endpoints

- `GET /me`
- `GET /users/me/preferences`
- `POST /users/me/preferences`
- `GET /users/me/calendar/connect`
- `GET /auth/google/calendar/callback`
- `GET /users/me/calendar/status`
- `DELETE /users/me/calendar`
- `POST /groups`
- `GET /groups`
- `GET /groups/{group_id}`
- `POST /groups/join/{invite_code}`
- `POST /groups/{group_id}/schedule`
- `GET /groups/{group_id}/proposal`
- `POST /proposals/{proposal_id}/rsvp`
- `POST /proposals/{proposal_id}/add-to-calendar`

## Optional Integrations

Create a `.env` file in `backend/` to enable external services:

```bash
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_CALENDAR_REDIRECT_URI=http://127.0.0.1:8000/auth/google/calendar/callback
FRONTEND_CALENDAR_CONNECTED_URL=http://localhost:5173/settings?calendar=connected
FRONTEND_CALENDAR_ERROR_URL=http://localhost:5173/settings?calendar=error
GOOGLE_PLACES_API_KEY=...
GOOGLE_PLACES_REGION=de
GOOGLE_PLACES_LANGUAGE_CODE=en
GEMINI_API_KEY=...
```

Without Google Places or Gemini keys, scheduling still works with mock availability and a deterministic mock venue.

Google Places key handling:

- Keep `GOOGLE_PLACES_API_KEY` in backend-only secrets (`backend/.env` locally, secret manager in production).
- Restrict the key in Google Cloud to Places API only.
- Add application restrictions (server IPs) where possible.

## Google Calendar OAuth

Create an OAuth client in Google Cloud Console:

1. Open APIs & Services -> Credentials.
2. Create an OAuth client ID for a web application.
3. Add this authorized redirect URI:

```text
http://127.0.0.1:8000/auth/google/calendar/callback
```

4. Add the client ID and secret to `backend/.env`.

The frontend should call `GET /users/me/calendar/connect` with the normal
Firebase bearer token. The backend returns an `auth_url`; the frontend redirects
the browser to that URL. After consent, Google redirects to the backend callback,
and the backend stores the Calendar integration under the current user in
Firestore.

Stored integration data lives at:

```text
users/{firebase_uid}/integrations/google_calendar
```

The backend stores OAuth tokens for the MVP so it can call Google Calendar
FreeBusy during scheduling and create events for confirmed proposals. Do not
return these tokens to the frontend.
