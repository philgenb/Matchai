from datetime import UTC, datetime, timedelta
import json
import logging

import httpx

from app.firebase import firestore_client
from app.repositories import group_members, group_ref, proposal_ref, user_preferences
from app.schemas import MeetingProposal, VenueCandidate
from app.services.calendar import get_busy_windows
from app.services.places import search_place
from app.settings import settings
from app.storage import new_id, now_iso

logger = logging.getLogger(__name__)


def _gemini_text(prompt: str) -> str:
    if not settings.gemini_api_key:
        return ""

    tried_models: list[str] = []
    for model in [settings.gemini_model, "gemini-2.5-flash", "gemini-flash-latest"]:
        if model in tried_models:
            continue
        tried_models.append(model)
        try:
            response = httpx.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": settings.gemini_api_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"},
                },
                timeout=12,
            )
            if response.status_code >= 400:
                logger.warning("Gemini model failed: model=%s status=%s", model, response.status_code)
                continue
            return (
                response.json()
                .get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
                .strip()
            )
        except httpx.HTTPError as error:
            logger.warning("Gemini model error: model=%s error=%s", model, error.__class__.__name__)
            continue
    return ""


def _candidate_slots() -> list[tuple[str, str]]:
    now = datetime.now(UTC)
    slots: list[tuple[str, str]] = []
    for day_offset in range(1, 15):
        candidate_day = now + timedelta(days=day_offset)
        for hour in (18, 19, 20):
            start = candidate_day.replace(hour=hour, minute=30, second=0, microsecond=0)
            end = start + timedelta(hours=2)
            slots.append((start.isoformat(), end.isoformat()))
    return slots


def _overlaps(slot_start: str, slot_end: str, busy_window: dict[str, str]) -> bool:
    busy_start = busy_window.get("start")
    busy_end = busy_window.get("end")
    if not busy_start or not busy_end:
        return False
    return slot_start < busy_end and busy_start < slot_end


def _best_candidate_slot(member_ids: list[str]) -> tuple[str, str]:
    for slot_start, slot_end in _candidate_slots():
        has_conflict = False
        for member_id in member_ids:
            try:
                busy_windows = get_busy_windows(member_id, slot_start, slot_end)
            except Exception:
                busy_windows = []
            if any(_overlaps(slot_start, slot_end, busy) for busy in busy_windows):
                has_conflict = True
                break
        if not has_conflict:
            return slot_start, slot_end
    return _candidate_slots()[0]


def _mock_venue(city: str | None, interests: list[str]) -> VenueCandidate:
    top_interest = interests[0] if interests else "Cafe"
    place_city = city or "the city center"
    return VenueCandidate(
        name=f"{top_interest} Social Spot",
        address=f"Central area, {place_city}",
        source_url=None,
        website_url=None,
        image_url=None,
        price_level=2,
        opens_at=None,
        open_now=None,
    )


def _generate_ai_summary(
    group_name: str,
    venue: VenueCandidate,
    interests: list[str],
    member_names: list[str],
) -> tuple[str, str]:
    default_summary = f"Meet at {venue.name} for a relaxed {', '.join(interests[:3])} hangout."
    default_rationale = "Chosen from shared interests, mock availability, and the group's preferred location signals."

    if not settings.gemini_api_key:
        logger.info("Gemini fallback: missing GEMINI_API_KEY")
        return default_summary, default_rationale

    members_line = ", ".join(member_names[:6]) if member_names else "friends from the group"
    interest_line = ", ".join(interests[:5]) if interests else "food and socializing"
    prompt = (
        "Write a fun venue description for a meetup plan.\n"
        f"Group name: {group_name}\n"
        f"Joined people ({len(member_names)}): {members_line}\n"
        f"Shared interests: {interest_line}\n"
        f"Venue: {venue.name} ({venue.address})\n"
        'Return valid JSON only with keys: "summary" and "rationale". '
        "Make both values short and lively."
    )
    try:
        text = _gemini_text(prompt)
        if not text:
            logger.warning("Gemini fallback: empty response text")
            return default_summary, default_rationale

        cleaned = text.strip().strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

        try:
            parsed = json.loads(cleaned)
            summary = str(parsed.get("summary", "")).strip()
            rationale = str(parsed.get("rationale", "")).strip()
            if summary:
                return summary, rationale or default_rationale
        except Exception:
            lines = [part.strip("- ").strip() for part in text.splitlines() if part.strip()]
            if lines:
                summary = lines[0]
                rationale = lines[1] if len(lines) > 1 else default_rationale
                return summary, rationale

        logger.warning("Gemini fallback: parse failure")
        return default_summary, default_rationale
    except httpx.HTTPError as error:
        logger.warning("Gemini fallback: HTTP error (%s)", error.__class__.__name__)
        return default_summary, default_rationale


def create_meeting_proposal(group_id: str) -> MeetingProposal:
    db = firestore_client()
    group_snapshot = group_ref(group_id).get()
    group = group_snapshot.to_dict() or {}
    members = group_members(group_id)
    member_preferences = [user_preferences(member.user.id) for member in members]

    interests: list[str] = []
    for prefs in member_preferences:
        for interest in prefs["interests"]:
            if interest not in interests:
                interests.append(interest)
    if not interests:
        interests = ["Cafe", "Bar", "Restaurant"]

    city = next((prefs["home_city"] for prefs in member_preferences if prefs["home_city"]), None)
    venue = search_place(city, interests) or _mock_venue(city, interests)
    starts_at, ends_at = _best_candidate_slot([member.user.id for member in members])
    member_names = [member.user.name for member in members if member.user.name]
    summary, rationale = _generate_ai_summary(group["name"], venue, interests, member_names)

    proposal_id = new_id("prp")
    current = now_iso()
    proposal = {
        "schema_version": 2,
        "title": f"{group['name']} meetup",
        "summary": summary,
        "starts_at": starts_at,
        "ends_at": ends_at,
        "venue": {
            "name": venue.name,
            "address": venue.address,
            "image_url": venue.image_url,
            "maps_url": venue.source_url,
            "website_url": venue.website_url,
            "price_level": venue.price_level,
            "opens_at": venue.opens_at,
            "opening_hours": venue.opens_at,
            "open_now": venue.open_now,
        },
        # Compatibility mirror for older readers/tools that still expect top-level fields.
        "location_name": venue.name,
        "address": venue.address,
        "image_url": venue.image_url,
        "source_url": venue.source_url,
        "website_url": venue.website_url,
        "price_level": venue.price_level,
        "opens_at": venue.opens_at,
        "opening_hours": venue.opens_at,
        "open_now": venue.open_now,
        "rationale": rationale,
        "status": "proposal_found",
        "created_at": current,
        "updated_at": current,
    }
    batch = db.batch()
    batch.set(proposal_ref(group_id, proposal_id), proposal)
    batch.set(
        group_ref(group_id),
        {
            "status": "proposal_found",
            "current_proposal_id": proposal_id,
            "updated_at": current,
        },
        merge=True,
    )
    batch.set(db.collection("proposal_index").document(proposal_id), {"group_id": group_id})
    batch.commit()

    from app.repositories import proposal_by_id

    saved = proposal_by_id(proposal_id)
    if saved is None:
        raise RuntimeError("Proposal was not saved")
    return saved
