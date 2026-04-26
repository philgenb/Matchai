import json
import logging
import re
from dataclasses import dataclass

import httpx
from google import genai

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GeminiResult:
    text: str
    provider: str
    model: str


class GeminiClient:
    def __init__(self, api_key: str, model: str) -> None:
        self.api_key = api_key
        self.model = model
        self._fallback_models = ["gemini-2.0-flash", "gemini-1.5-flash-latest"]

    def candidate_models(self) -> list[str]:
        models: list[str] = [self.model, "gemini-2.5-flash", *self._fallback_models]
        unique: list[str] = []
        seen: set[str] = set()
        for model in models:
            if not model or model in seen:
                continue
            seen.add(model)
            unique.append(model)
        return unique

    def generate_json_text(self, prompt: str) -> GeminiResult:
        errors: list[str] = []

        sdk_result, sdk_errors = self._try_sdk(prompt)
        if sdk_result:
            return sdk_result
        errors.extend(sdk_errors)

        http_result, http_errors = self._try_http(prompt)
        if http_result:
            return http_result
        errors.extend(http_errors)

        raise RuntimeError("; ".join(errors) if errors else "Gemini request failed")

    def parse_json_object(self, text: str) -> dict[str, str]:
        cleaned = text.strip().strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
        if cleaned.startswith("```") and cleaned.endswith("```"):
            cleaned = cleaned[3:-3].strip()
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()

        match = re.search(r"\{[\s\S]*\}", cleaned)
        candidate_json = match.group(0) if match else cleaned
        parsed = json.loads(candidate_json)
        if not isinstance(parsed, dict):
            raise ValueError("Gemini response JSON is not an object")
        return {str(key): str(value) for key, value in parsed.items()}

    def _try_sdk(self, prompt: str) -> tuple[GeminiResult | None, list[str]]:
        errors: list[str] = []
        try:
            client = genai.Client(api_key=self.api_key)
        except Exception as error:
            message = f"sdk init failed: {error!r}"
            logger.warning("Gemini %s", message)
            return None, [message]

        for model in self.candidate_models():
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config={"response_mime_type": "application/json"},
                )
                text = (response.text or "").strip()
                if text:
                    logger.info("Gemini success provider=sdk model=%s", model)
                    return GeminiResult(text=text, provider="sdk", model=model), []
                message = f"sdk empty response: model={model}"
                logger.warning("Gemini %s", message)
                errors.append(message)
            except Exception as error:
                message = f"sdk request failed: model={model} error={error!r}"
                logger.warning("Gemini %s", message)
                errors.append(message)
        return None, errors

    def _try_http(self, prompt: str) -> tuple[GeminiResult | None, list[str]]:
        errors: list[str] = []
        timeout = httpx.Timeout(connect=8.0, read=25.0, write=15.0, pool=5.0)

        with httpx.Client(timeout=timeout) as client:
            for model in self.candidate_models():
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                params = {"key": self.api_key}
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"},
                }
                try:
                    response = client.post(url, params=params, json=payload)
                    if response.is_success:
                        body = response.json()
                        text = self._extract_http_text(body).strip()
                        if text:
                            logger.info("Gemini success provider=http model=%s", model)
                            return GeminiResult(text=text, provider="http", model=model), []
                        message = f"http empty response: model={model}"
                        logger.warning("Gemini %s", message)
                        errors.append(message)
                        continue

                    preview = response.text[:300].replace("\n", " ")
                    message = (
                        f"http request failed: model={model} status={response.status_code} body={preview}"
                    )
                    logger.warning("Gemini %s", message)
                    errors.append(message)
                except Exception as error:
                    message = f"http request failed: model={model} error={error!r}"
                    logger.warning("Gemini %s", message)
                    errors.append(message)
        return None, errors

    @staticmethod
    def _extract_http_text(body: dict) -> str:
        candidates = body.get("candidates")
        if not isinstance(candidates, list) or not candidates:
            return ""

        first = candidates[0]
        content = first.get("content", {}) if isinstance(first, dict) else {}
        parts = content.get("parts") if isinstance(content, dict) else None
        if not isinstance(parts, list):
            return ""

        chunks: list[str] = []
        for part in parts:
            if isinstance(part, dict) and isinstance(part.get("text"), str):
                chunks.append(part["text"])
        return "\n".join(chunks)
