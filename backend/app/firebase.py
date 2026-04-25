from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, firestore

from app.settings import settings


def init_firebase_app() -> firebase_admin.App:
    if firebase_admin._apps:
        return firebase_admin.get_app()

    project_options = {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None

    if settings.firebase_credentials_path:
        cred = credentials.Certificate(settings.firebase_credentials_path)
        return firebase_admin.initialize_app(cred, options=project_options)

    return firebase_admin.initialize_app(credentials.ApplicationDefault(), options=project_options)


@lru_cache
def firestore_client() -> firestore.Client:
    init_firebase_app()
    return firestore.client()
