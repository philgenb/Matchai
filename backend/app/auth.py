import base64
import json

from fastapi import Depends, Header, HTTPException, status

from app.firebase import init_firebase_app
from app.settings import FirebaseUser, settings
from app.storage import new_id, now_iso


def _parse_dev_token(token: str) -> FirebaseUser:
    raw = token.removeprefix("dev:")
    email = raw if "@" in raw else f"{raw}@example.com"
    name = email.split("@", maxsplit=1)[0].replace(".", " ").replace("_", " ").title()
    return FirebaseUser(firebase_uid=f"dev:{email}", email=email, name=name)


def _token_payload_hint(token: str) -> str:
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return "token is not a JWT"
        payload = parts[1] + "=" * (-len(parts[1]) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload.encode("utf-8")))
        return f"aud={decoded.get('aud')!r}, iss={decoded.get('iss')!r}, expected_project={settings.firebase_project_id!r}"
    except Exception:
        return f"could not decode token payload, expected_project={settings.firebase_project_id!r}"


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

    init_firebase_app()

    try:
        decoded = auth.verify_id_token(token, check_revoked=True)
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
    from app.repositories import save_user_preferences, user_preferences, user_ref

    current = now_iso()
    ref = user_ref(firebase_user.firebase_uid)
    snapshot = ref.get()
    snapshot_data = snapshot.to_dict() or {}
    created_at = snapshot_data.get("created_at") if snapshot.exists else current
    onboarding_completed = bool(snapshot_data.get("onboarding_completed", False))
    if snapshot.exists and "onboarding_completed" not in snapshot_data:
        onboarding_completed = bool(user_preferences(firebase_user.firebase_uid).get("onboarding_completed", False))

    user = {
        "id": firebase_user.firebase_uid,
        "firebase_uid": firebase_user.firebase_uid,
        "email": firebase_user.email,
        "name": firebase_user.name,
        "profile_image": firebase_user.profile_image,
        "onboarding_completed": onboarding_completed,
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
