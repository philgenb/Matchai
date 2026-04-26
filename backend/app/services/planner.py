from datetime import UTC, datetime, timedelta

import httpx

from app.firebase import firestore_client
from app.repositories import group_members, group_ref, proposal_ref, user_preferences
from app.schemas import MeetingProposal, VenueCandidate
from app.services.calendar import get_busy_windows
from app.settings import settings
from app.storage import new_id, now_iso


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
    )


def _search_tavily(city: str | None, interests: list[str]) -> VenueCandidate | None:
    if not settings.tavily_api_key:
        return None

    query = f"best meetup venue {' '.join(interests[:3])} {city or ''}".strip()
    try:
        response = httpx.post(
            "https://api.tavily.com/search",
            json={
                "api_key": settings.tavily_api_key,
                "query": query,
                "search_depth": "basic",
                "max_results": 3,
            },
            timeout=8,
        )
        response.raise_for_status()
        results = response.json().get("results", [])
        if not results:
            return None
        first = results[0]
        return VenueCandidate(
            name=first.get("title") or "Recommended venue",
            address=city or "Address to confirm",
            source_url=first.get("url"),
        )
    except httpx.HTTPError:
        return None


def _generate_ai_summary(group_name: str, venue: VenueCandidate, interests: list[str]) -> tuple[str, str]:
    default_summary = f"Meet at {venue.name} for a relaxed {', '.join(interests[:3])} hangout."
    default_rationale = "Chosen from shared interests, mock availability, and the group's preferred location signals."

    if not settings.gemini_api_key:
        return default_summary, default_rationale

    prompt = (
        "Create one concise meetup proposal for a friend group. "
        f"Group: {group_name}. Venue: {venue.name}, {venue.address}. "
        f"Shared interests: {', '.join(interests)}. "
        "Return two short sentences: one summary and one rationale."
    )
    try:
        response = httpx.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
            params={"key": settings.gemini_api_key},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=8,
        )
        response.raise_for_status()
        text = (
            response.json()
            .get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
            .strip()
        )
        if not text:
            return default_summary, default_rationale
        parts = [part.strip() for part in text.split("\n") if part.strip()]
        return parts[0], parts[1] if len(parts) > 1 else default_rationale
    except httpx.HTTPError:
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
    venue = _search_tavily(city, interests) or _mock_venue(city, interests)
    starts_at, ends_at = _best_candidate_slot([member.user.id for member in members])
    summary, rationale = _generate_ai_summary(group["name"], venue, interests)

    proposal_id = new_id("prp")
    current = now_iso()
    proposal = {
        "title": f"{group['name']} meetup",
        "summary": summary,
        "starts_at": starts_at,
        "ends_at": ends_at,
        "location_name": venue.name,
        "address": venue.address,
        "image_url": None,
        "source_url": venue.source_url,
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
