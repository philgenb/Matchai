import json

import httpx
from fastapi import APIRouter, HTTPException, Response, status

from app.schemas import AccessibilityTtsRequest
from app.settings import settings

router = APIRouter(tags=["accessibility"])

GRADIUM_TTS_URL = "https://api.gradium.ai/api/post/speech/tts"
OUTPUT_MEDIA_TYPES = {
    "wav": "audio/wav",
    "pcm": "audio/pcm",
    "opus": "audio/ogg",
}


@router.post("/accessibility/tts")
async def tts_accessibility(payload: AccessibilityTtsRequest) -> Response:
    """Generate speech audio for accessibility playback via Gradium TTS.

    This endpoint is intentionally public so the read-aloud accessibility
    button works for every visitor, signed in or not.
    """
    if not settings.gradium_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TTS is not configured on the server.",
        )

    gradium_payload: dict[str, object] = {
        "text": payload.text,
        "voice_id": payload.voice_id,
        "output_format": payload.output_format,
        "model_name": payload.model_name,
        "only_audio": True,
        "json_config": "{}",
    }
    if payload.pronunciation_id:
        gradium_payload["pronunciation_id"] = payload.pronunciation_id

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            gradium_response = await client.post(
                GRADIUM_TTS_URL,
                json=gradium_payload,
                headers={"x-api-key": settings.gradium_api_key},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach TTS provider.",
        ) from exc

    if gradium_response.status_code >= 400:
        detail = "TTS request failed."
        try:
            body = gradium_response.json()
            if isinstance(body, dict):
                detail = body.get("error") or body.get("detail") or detail
        except json.JSONDecodeError:
            if gradium_response.text:
                detail = gradium_response.text

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        )

    media_type = OUTPUT_MEDIA_TYPES[payload.output_format]
    return Response(content=gradium_response.content, media_type=media_type)
