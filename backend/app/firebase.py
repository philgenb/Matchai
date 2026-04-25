from functools import lru_cache
import os

import firebase_admin
from firebase_admin import credentials, firestore

from app.settings import settings


def init_firebase_app() -> firebase_admin.App:
    if firebase_admin._apps:
        return firebase_admin.get_app()

    if settings.firebase_project_id:
        os.environ.setdefault("GOOGLE_CLOUD_PROJECT", settings.firebase_project_id)
        os.environ.setdefault("GOOGLE_CLOUD_QUOTA_PROJECT", settings.firebase_project_id)

    project_options = {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None

    if settings.firebase_credentials_path:
        cred = credentials.Certificate(settings.firebase_credentials_path)
        return firebase_admin.initialize_app(cred, options=project_options)

    return firebase_admin.initialize_app(credentials.ApplicationDefault(), options=project_options)


@lru_cache
def firestore_client() -> firestore.Client:
    init_firebase_app()
    return firestore.client()
