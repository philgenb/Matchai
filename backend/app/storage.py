import secrets
from datetime import UTC, datetime


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_urlsafe(12)}"


def new_invite_code() -> str:
    return secrets.token_urlsafe(6)

