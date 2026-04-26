# Matchai

Matchai is an early-stage social scheduling application. The repository contains a FastAPI backend and a React + Vite frontend.

## Project Structure

```text
backend/    FastAPI API, Firebase Auth verification, Firestore access, Google Calendar OAuth
frontend/   React + Vite app, Firebase client auth, local API proxy
```

More focused notes are available in `backend/README.md` and `frontend/README.md`.

## Local Onboarding

These steps set up the project for local development with the backend at `http://127.0.0.1:8000` and the frontend at `http://localhost:5173`.

### 1. Prerequisites

Install these tools before starting:

- Python 3.11 or newer
- Node.js 20 or newer and npm
- Google Cloud CLI (`gcloud`) if you want to use Firestore, Firebase Auth, or Google Calendar locally
- Access to the Firebase / Google Cloud project used by Matchai

Verify the basics:

```bash
python3 --version
node --version
npm --version
```

### 2. Clone and Enter the Repository

```bash
git clone <repository-url>
cd matchai
```

### 3. Configure the Backend Environment

Create your local backend environment file from the example:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set the values for your local setup:

```bash
ALLOW_DEV_AUTH=true
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_QUOTA_PROJECT=your-project-id

GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=http://127.0.0.1:8000/auth/google/calendar/callback
FRONTEND_CALENDAR_CONNECTED_URL=http://localhost:5173/onboarding?calendar=connected
FRONTEND_CALENDAR_ERROR_URL=http://localhost:5173/onboarding?calendar=error

TAVILY_API_KEY=
GEMINI_API_KEY=
```

Required values:

- `ALLOW_DEV_AUTH=true` keeps local development simple by accepting tokens like `dev:alice@example.com`.
- `FIREBASE_PROJECT_ID` is the Firebase / Google Cloud project ID used for Firestore.
- `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_QUOTA_PROJECT` should usually match `FIREBASE_PROJECT_ID`.

Optional values:

- `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` enable Google Calendar connect/disconnect flows.
- `TAVILY_API_KEY` and `GEMINI_API_KEY` enable richer planning. Without them, scheduling still works with mock availability and deterministic mock venue data.
- `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` can be added if you are intentionally using a local Firestore emulator.

Do not commit `.env` files or service-account JSON keys.

### 4. Authenticate Google Cloud Locally

For normal local development, use Application Default Credentials instead of a service-account file:

```bash
gcloud auth application-default login
gcloud config set project your-project-id
gcloud auth application-default set-quota-project your-project-id
```

The backend uses these credentials to access Firestore. The authenticated account needs permission to read and write Firestore data, for example the `Cloud Datastore User` role.

### 5. Configure Google Calendar OAuth

This is only needed if you want to test calendar connection flows.

1. Open Google Cloud Console.
2. Go to APIs & Services -> Credentials.
3. Create an OAuth client ID for a web application.
4. Add this authorized redirect URI:

```text
http://127.0.0.1:8000/auth/google/calendar/callback
```

5. Copy the client ID and client secret into `backend/.env`.

During local development the frontend calls `GET /users/me/calendar/connect`, the backend returns a Google `auth_url`, and Google redirects back to the backend callback after consent.

### 6. Install and Run the Backend

From `backend/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Check that the API is running:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok"}
```

For authenticated local API calls while `ALLOW_DEV_AUTH=true`, send a development bearer token:

```bash
curl http://127.0.0.1:8000/me \
  -H "Authorization: Bearer dev:alice@example.com"
```

### 7. Configure the Frontend Environment

Open a second terminal from the repository root:

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```bash
VITE_API_BASE_URL=/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

For the fastest local setup, keep `VITE_API_BASE_URL=/api`. Vite proxies `/api` to `http://127.0.0.1:8000` as configured in `frontend/vite.config.js`.

Firebase values are optional for dev-auth mode. If they are empty, the frontend falls back to a local development email and sends backend requests with a `dev:<email>` bearer token. If Firebase values are configured, the frontend uses real Firebase ID tokens instead.

### 8. Install and Run the Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Keep both servers running while developing:

- Backend: `uvicorn app.main:app --reload` in `backend/`
- Frontend: `npm run dev` in `frontend/`

### 9. Useful Development Commands

Backend:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

### 10. Troubleshooting

- Backend cannot access Firestore: confirm `FIREBASE_PROJECT_ID`, `GOOGLE_CLOUD_PROJECT`, and Application Default Credentials are set correctly.
- Quota project error from Google credentials: run `gcloud auth application-default set-quota-project your-project-id`.
- Frontend API requests fail in local dev: confirm the backend is running on `http://127.0.0.1:8000` and `VITE_API_BASE_URL=/api`.
- CORS errors: use the Vite dev server at `http://localhost:5173`; this origin is allowed by the backend defaults.
- Calendar OAuth redirect mismatch: make sure the Google Cloud OAuth client contains exactly `http://127.0.0.1:8000/auth/google/calendar/callback`.
- Real Firebase login does not work: fill all `VITE_FIREBASE_*` values from the Firebase web app configuration and restart `npm run dev`.
