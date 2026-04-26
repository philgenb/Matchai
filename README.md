# Matchai

Matchai is a social scheduling app that helps friend groups find a good time and place to meet. The app combines user preferences, Google Calendar availability, Google Places venue data, and a short Gemini-generated recommendation.

## Technologies Used

### Product And Partner Technologies

- Lovable: frontend iterations and visual product iteration
- Google DeepMind Gemini: generation of the short meetup summary
- Google Cloud: project setup, OAuth credentials, API enablement, and local Application Default Credentials
- Google Firebase: Firebase Authentication in the frontend and Firestore as the database
- Gradium: accessibility feature for text to speech
- Google Calendar API: calendar connection, FreeBusy checks, and event creation
- Google Places API: venue search, Maps links, images, websites, price level, and opening hours

### Repository Technologies

- Frontend: React 19, Vite, React Router, Tailwind CSS, Firebase Web SDK, lucide-react
- Backend: FastAPI, Uvicorn, Pydantic Settings, firebase-admin, google-auth-oauthlib, httpx
- Local development: Node.js/npm, Python venv, Google Cloud CLI

Unused integrations have been removed from this onboarding.

## Project Structure

```text
backend/
  app/                  FastAPI app, auth, Firestore, Calendar, Places, Gemini planner
  tests/                Backend tests
  .env.example          Backend environment template
  requirements.txt      Python dependencies

frontend/
  src/                  React app
  .env.example          Frontend environment template
  vite.config.js        Vite dev server with /api proxy
  package.json          Frontend scripts and dependencies
```

## Prerequisites

Install locally:

- Python 3.11 or newer
- Node.js 20 or newer
- npm
- Google Cloud CLI (`gcloud`)
- Access to the Matchai Google Cloud / Firebase project

Check your local versions:

```bash
python3 --version
node --version
npm --version
gcloud --version
```

## Prepare Google Cloud And Firebase

### 1. Google Cloud Project

Create a Google Cloud project or use the existing Matchai project. The project ID is used later in both backend and frontend configuration.

Enable these APIs in the Google Cloud project:

- Cloud Firestore API
- Firebase Authentication
- Google Calendar API
- Google Places API
- Generative Language API for Gemini

### 2. Firebase App Setup

1. Open the Firebase Console.
2. Select the Google Cloud project.
3. Enable Authentication.
4. Enable the required sign-in provider, typically Google or Email/Password for local testing.
5. Create a Firebase Web App.
6. Copy the Firebase Web App config into `frontend/.env.local`.

The Firebase values look roughly like this:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

### 3. Firestore Setup

1. Open Firebase Console -> Firestore Database.
2. Create a Firestore database.
3. Choose the appropriate region for local MVP development.
4. Make sure your Google account can read and write Firestore data locally.

For local development, the backend uses Google Application Default Credentials. The authenticated account needs a role such as `Cloud Datastore User`.

```bash
gcloud auth application-default login
gcloud config set project <google-cloud-project-id>
gcloud auth application-default set-quota-project <google-cloud-project-id>
```

A service account can also be used optionally. In that case, set the JSON file path with `FIREBASE_CREDENTIALS_PATH`. Service-account files must never be committed.

## Environment Files

There are two local environment files:

- `backend/.env`
- `frontend/.env.local`

Both files contain local secrets or local configuration and must not be committed. Templates are available at:

- `backend/.env.example`
- `frontend/.env.example`

## Backend Env Setup

Create the file:

```bash
cd backend
cp .env.example .env
```

Complete local example:

```bash
ALLOW_DEV_AUTH=true
FIREBASE_PROJECT_ID=<google-cloud-project-id>
GOOGLE_CLOUD_PROJECT=<google-cloud-project-id>
GOOGLE_CLOUD_QUOTA_PROJECT=<google-cloud-project-id>

# Optional, only when using a service-account file instead of Application Default Credentials:
# FIREBASE_CREDENTIALS_PATH=/absolute/path/to/service-account.json

# Optional, only when using a local Firestore emulator:
# FIRESTORE_EMULATOR_HOST=127.0.0.1:8080

GOOGLE_OAUTH_CLIENT_ID=<google-oauth-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<google-oauth-client-secret>
GOOGLE_CALENDAR_REDIRECT_URI=http://127.0.0.1:8000/auth/google/calendar/callback
FRONTEND_CALENDAR_CONNECTED_URL=http://localhost:5173/onboarding?calendar=connected
FRONTEND_CALENDAR_ERROR_URL=http://localhost:5173/onboarding?calendar=error

GOOGLE_PLACES_API_KEY=<google-places-api-key>
GOOGLE_PLACES_REGION=de
GOOGLE_PLACES_LANGUAGE_CODE=en
GEMINI_API_KEY=<gemini-api-key>
```

### Backend Env Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ALLOW_DEV_AUTH` | Recommended locally | Allows local tokens such as `dev:alice@example.com` when Firebase is not configured in the frontend. |
| `FIREBASE_PROJECT_ID` | Yes | Firebase / Google Cloud project ID for auth verification and Firestore. |
| `GOOGLE_CLOUD_PROJECT` | Yes | Google Cloud project ID for local Google credentials. |
| `GOOGLE_CLOUD_QUOTA_PROJECT` | Yes | Quota project for local Application Default Credentials. |
| `FIREBASE_CREDENTIALS_PATH` | Optional | Absolute path to a service-account JSON file. Only use this when ADC is not used. |
| `FIRESTORE_EMULATOR_HOST` | Optional | Host for a local Firestore emulator, for example `127.0.0.1:8080`. |
| `GOOGLE_OAUTH_CLIENT_ID` | For Calendar Connect | OAuth client ID for Google Calendar. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | For Calendar Connect | OAuth client secret for Google Calendar. |
| `GOOGLE_CALENDAR_REDIRECT_URI` | For Calendar Connect | Backend callback URL. This must exactly match the Google Cloud credential redirect URI. |
| `FRONTEND_CALENDAR_CONNECTED_URL` | For Calendar Connect | Frontend redirect after a successful calendar connection. |
| `FRONTEND_CALENDAR_ERROR_URL` | For Calendar Connect | Frontend redirect after calendar connection errors. |
| `GOOGLE_PLACES_API_KEY` | For real venue data | API key for Google Places. Without this key, the backend uses mock venues. |
| `GOOGLE_PLACES_REGION` | Optional | Region bias for Places, for example `de`. |
| `GOOGLE_PLACES_LANGUAGE_CODE` | Optional | Language for Places responses, for example `en` or `de`. |
| `GEMINI_API_KEY` | For AI summary | API key for Gemini. Without this key, the backend uses a deterministic fallback summary. |

## Frontend Env Setup

Create the file:

```bash
cd frontend
cp .env.example .env.local
```

Complete local example:

```bash
VITE_API_BASE_URL=/api
VITE_FIREBASE_API_KEY=<firebase-web-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<google-cloud-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<firebase-messaging-sender-id>
VITE_FIREBASE_APP_ID=<firebase-web-app-id>
```

### Frontend Env Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Use `/api` for local development; Vite proxies requests to `http://127.0.0.1:8000`. |
| `VITE_FIREBASE_API_KEY` | For real Firebase Auth | Firebase Web App API key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | For real Firebase Auth | Firebase Auth domain. |
| `VITE_FIREBASE_PROJECT_ID` | For real Firebase Auth | Firebase project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional for this app | Firebase Storage bucket from the Web App config. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional for this app | Firebase Messaging sender ID from the Web App config. |
| `VITE_FIREBASE_APP_ID` | For real Firebase Auth | Firebase Web App ID. |

If the frontend Firebase values are left empty, the frontend uses local dev auth and sends tokens in the format `dev:<email>` to the backend. This only works when `ALLOW_DEV_AUTH=true` is set in the backend.

## Google Calendar API Setup

1. Open Google Cloud Console -> APIs & Services -> Credentials.
2. Create an OAuth client of type `Web application`.
3. Add this authorized redirect URI:

```text
http://127.0.0.1:8000/auth/google/calendar/callback
```

4. Copy the client ID and client secret into `backend/.env`:

```bash
GOOGLE_OAUTH_CLIENT_ID=<google-oauth-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<google-oauth-client-secret>
```

5. Enable the Google Calendar API.

The flow:

1. The frontend calls `GET /users/me/calendar/connect`.
2. The backend creates a Google OAuth URL.
3. The browser opens the Google consent screen.
4. Google redirects back to `/auth/google/calendar/callback`.
5. The backend stores the integration in Firestore under:

```text
users/{firebase_uid}/integrations/google_calendar
```

Calendar tokens are stored in the backend and are never returned to the frontend.

## Google Places API Setup

1. Enable the Google Places API in the Google Cloud project.
2. Create an API key.
3. Restrict the key to the Places API.
4. Add it to `backend/.env`:

```bash
GOOGLE_PLACES_API_KEY=<google-places-api-key>
GOOGLE_PLACES_REGION=de
GOOGLE_PLACES_LANGUAGE_CODE=en
```

The backend first uses the Places API v1 Text Search and Details endpoints. If that fails, it falls back to the legacy Places Text Search / Details API. Without `GOOGLE_PLACES_API_KEY`, the backend can still create proposals, but it uses mock venue data.

## Gemini Setup

1. Enable the Generative Language API in the Google Cloud project.
2. Create an API key for Gemini.
3. Add it to `backend/.env`:

```bash
GEMINI_API_KEY=<gemini-api-key>
```

The backend currently uses `gemini-1.5-flash` through the Generative Language REST API to generate exactly one short meetup sentence. Without a key, it builds a local fallback summary.

## Gradium Accessibility Setup

Gradium was used as the partner technology for the accessibility text-to-speech feature. If you enable this feature locally or in a demo environment, make sure that:

- Gradium configuration is available in the target environment.
- Gradium secrets are not committed in the frontend.
- API keys or tokens are provided through secure runtime configuration or a secret manager.
- The feature is tested with keyboard navigation and screen reader behavior.

The current repository does not define a dedicated Gradium environment variable in the existing `.env.example` files. If a later Gradium integration needs a key, add it deliberately to the right env template and document it here.

## Run The Backend Locally

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok"}
```

Local request with dev auth:

```bash
curl http://127.0.0.1:8000/me \
  -H "Authorization: Bearer dev:alice@example.com"
```

## Run The Frontend Locally

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open in the browser:

```text
http://localhost:5173
```

The Vite dev server automatically proxies `/api` to:

```text
http://127.0.0.1:8000
```

## Tests And Checks

Backend tests:

```bash
cd backend
source .venv/bin/activate
python -m unittest discover tests
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Important Backend Endpoints

- `GET /health`
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

## Firestore Data Model

The backend uses these collections and documents:

```text
users/{firebase_uid}
users/{firebase_uid}/private/preferences
users/{firebase_uid}/integrations/google_calendar
groups/{group_id}
groups/{group_id}/members/{firebase_uid}
groups/{group_id}/proposals/{proposal_id}
groups/{group_id}/proposals/{proposal_id}/rsvps/{firebase_uid}
invite_codes/{invite_code}
proposal_index/{proposal_id}
calendar_oauth_states/{state}
```

## Typical Local Workflow

1. Create `backend/.env` and `frontend/.env.local` from the templates.
2. Log in with Google Cloud ADC.
3. Start the backend.
4. Start the frontend.
5. Open the app at `http://localhost:5173`.
6. Use dev auth for fast local testing.
7. Configure Firebase Auth and Google Calendar OAuth for real calendar flows.

## Troubleshooting

- Backend cannot reach Firestore: check `FIREBASE_PROJECT_ID`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_QUOTA_PROJECT`, and `gcloud auth application-default login`.
- Quota project error: run `gcloud auth application-default set-quota-project <google-cloud-project-id>`.
- Frontend API calls fail: the backend must be running on `http://127.0.0.1:8000` and `VITE_API_BASE_URL=/api` must be set.
- CORS errors: develop locally through `http://localhost:5173`; this origin is allowed by the backend defaults.
- Calendar redirect mismatch: the redirect URI in Google Cloud must exactly be `http://127.0.0.1:8000/auth/google/calendar/callback`.
- Calendar Connect says OAuth is not configured: set `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in `backend/.env`, then restart the backend.
- Places does not return real venues: set `GOOGLE_PLACES_API_KEY`, enable the Places API, and check key restrictions.
- Gemini summary remains generic: set `GEMINI_API_KEY`, enable the Generative Language API, and restart the backend.
- Firebase login does not work: set all `VITE_FIREBASE_*` values from the Firebase Web App config, then restart the frontend.

## Security Notes

- Do not commit `.env` files.
- Do not commit service-account JSON files.
- Restrict Google Places API keys to the Places API.
- Use OAuth client secrets only on the backend.
- Calendar OAuth tokens stay in Firestore and must not be exposed to the frontend.
- For production, provide secrets through Google Secret Manager or the runtime secret configuration of the hosting platform.
