import base64
import json

from fastapi import Depends, Header, HTTPException, status

from app.firebase import get_firebase_project_id, init_firebase_app
from app.settings import FirebaseUser, settings
from app.storage import new_id, now_iso


def _parse_dev_token(token: str) -> FirebaseUser:
    raw = token.removeprefix("dev:")
    email = raw if "@" in raw else f"{raw}@example.com"
    name = email.split("@", maxsplit=1)[0].replace(".", " ").replace("_", " ").title()
    return FirebaseUser(firebase_uid=f"dev:{email}", email=email, name=name)


def _token_payload_hint(token: str) -> str:
    expected_project = get_firebase_project_id()
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return "token is not a JWT"
        payload = parts[1] + "=" * (-len(parts[1]) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload.encode("utf-8")))
        return f"aud={decoded.get('aud')!r}, iss={decoded.get('iss')!r}, expected_project={expected_project!r}"
    except Exception:
        return f"could not decode token payload, expected_project={expected_project!r}"


def verify_firebase_token(authorization: str | None = Header(default=None)) -> FirebaseUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = authorization.removeprefix("Bearer ").strip()
    if settings.allow_dev_auth and token.startswith("dev:"):
        return _parse_dev_token(token)

    try:
        from firebase_admin import auth
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Admin SDK is not installed",
        ) from exc

    firebase_app = init_firebase_app()

    try:
        decoded = auth.verify_id_token(token, check_revoked=True, app=firebase_app)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase ID token ({_token_payload_hint(token)}): {exc}",
        ) from exc

    email = decoded.get("email")
    uid = decoded.get("uid")
    if not uid or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase token must include uid and email",
        )

    return FirebaseUser(
        firebase_uid=uid,
        email=email,
        name=decoded.get("name") or email.split("@", maxsplit=1)[0],
        profile_image=decoded.get("picture"),
    )


def get_or_create_current_user(
    firebase_user: FirebaseUser = Depends(verify_firebase_token),
) -> dict:
    from app.repositories import save_user_preferences, user_ref

    current = now_iso()
    ref = user_ref(firebase_user.firebase_uid)
    snapshot = ref.get()
    created_at = (snapshot.to_dict() or {}).get("created_at") if snapshot.exists else current
    user = {
        "id": firebase_user.firebase_uid,
        "firebase_uid": firebase_user.firebase_uid,
        "email": firebase_user.email,
        "name": firebase_user.name,
        "profile_image": firebase_user.profile_image,
        "created_at": created_at,
        "updated_at": current,
    }
    ref.set(user, merge=True)

    if not snapshot.exists:
        save_user_preferences(
            firebase_user.firebase_uid,
            {
                "interests": ["Cafe", "Bar", "Restaurant"],
                "home_city": None,
                "location_label": None,
                "calendar_connected": False,
            },
        )

    return user
