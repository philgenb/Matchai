# Matchai

Matchai is an early-stage project workspace for building and iterating on the Matchai application.

## Overview

This repository currently contains the project foundation. It is intended to hold the application source code, configuration, documentation, and supporting assets as the product takes shape.

## Getting Started

The repository currently includes a simple FastAPI backend in `backend/`.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Once running, open `http://127.0.0.1:8000/health` to verify the API.

For local API calls during frontend development, use `Authorization: Bearer dev:alice@example.com`.
