from functools import lru_cache
import json
import json
import os

import firebase_admin
from firebase_admin import credentials, firestore

from app.settings import settings


def _project_id_from_service_account(path: str) -> str | None:
    try:
        with open(path, "r", encoding="utf-8") as file:
            payload = json.load(file)
        return payload.get("project_id")
    except Exception:
        return None


def get_firebase_project_id() -> str | None:
    return (
        settings.firebase_project_id
        or os.getenv("GOOGLE_CLOUD_PROJECT")
        or os.getenv("GCLOUD_PROJECT")
        or os.getenv("GOOGLE_CLOUD_QUOTA_PROJECT")
        or (
            _project_id_from_service_account(settings.firebase_credentials_path)
            if settings.firebase_credentials_path
            else None
        )
    )


def _project_id_from_service_account(path: str) -> str | None:
    try:
        with open(path, "r", encoding="utf-8") as file:
            payload = json.load(file)
        return payload.get("project_id")
    except Exception:
        return None


def get_firebase_project_id() -> str | None:
    return (
        settings.firebase_project_id
        or os.getenv("GOOGLE_CLOUD_PROJECT")
        or os.getenv("GCLOUD_PROJECT")
        or os.getenv("GOOGLE_CLOUD_QUOTA_PROJECT")
        or (
            _project_id_from_service_account(settings.firebase_credentials_path)
            if settings.firebase_credentials_path
            else None
        )
    )


def init_firebase_app() -> firebase_admin.App:
    resolved_project_id = get_firebase_project_id()

    if firebase_admin._apps:
        app = firebase_admin.get_app()
        configured_project = (app.options or {}).get("projectId")
        # Recover from stale app state where projectId was not configured.
        if configured_project or not resolved_project_id:
            return app
        firebase_admin.delete_app(app)

    if resolved_project_id:
        os.environ.setdefault("GOOGLE_CLOUD_PROJECT", resolved_project_id)
        os.environ.setdefault("GOOGLE_CLOUD_QUOTA_PROJECT", resolved_project_id)

    project_options = {"projectId": resolved_project_id} if resolved_project_id else None

    if settings.firebase_credentials_path:
        cred = credentials.Certificate(settings.firebase_credentials_path)
        return firebase_admin.initialize_app(cred, options=project_options)

    return firebase_admin.initialize_app(credentials.ApplicationDefault(), options=project_options)


@lru_cache
def firestore_client() -> firestore.Client:
    init_firebase_app()
    return firestore.client()
