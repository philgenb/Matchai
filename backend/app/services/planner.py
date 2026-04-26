from datetime import UTC, datetime, timedelta

import httpx

from app.firebase import firestore_client
from app.repositories import group_members, group_ref, proposal_ref, user_preferences
from app.schemas import MeetingProposal, VenueCandidate
from app.services.calendar import get_busy_windows, has_calendar_connection
from app.services.places import search_place
from app.settings import settings
from app.storage import new_id, now_iso


class CalendarAvailabilityError(RuntimeError):
    pass


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


def _parse_calendar_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _overlaps(slot_start: str, slot_end: str, busy_window: dict[str, str]) -> bool:
    busy_start = busy_window.get("start")
    busy_end = busy_window.get("end")
    if not busy_start or not busy_end:
        return False
    slot_start_at = _parse_calendar_datetime(slot_start)
    slot_end_at = _parse_calendar_datetime(slot_end)
    busy_start_at = _parse_calendar_datetime(busy_start)
    busy_end_at = _parse_calendar_datetime(busy_end)
    return slot_start_at < busy_end_at and busy_start_at < slot_end_at


def _calendar_connected_member_ids(member_ids: list[str]) -> list[str]:
    return [member_id for member_id in member_ids if has_calendar_connection(member_id)]


def _best_candidate_slot(member_ids: list[str]) -> tuple[str, str]:
    calendar_member_ids = _calendar_connected_member_ids(member_ids)
    if not calendar_member_ids:
        return _candidate_slots()[0]

    for slot_start, slot_end in _candidate_slots():
        has_conflict = False
        for member_id in calendar_member_ids:
            try:
                busy_windows = get_busy_windows(member_id, slot_start, slot_end)
            except Exception:
                busy_windows = []
            if any(_overlaps(slot_start, slot_end, busy) for busy in busy_windows):
                has_conflict = True
                break
        if not has_conflict:
            return slot_start, slot_end
    raise CalendarAvailabilityError("No shared free calendar slot found for connected group members")


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


def _summarize_members(member_names: list[str]) -> str:
    if not member_names:
        return "The crew"
    unique_names: list[str] = []
    for name in member_names:
        if name and name not in unique_names:
            unique_names.append(name)
    if len(unique_names) == 1:
        return unique_names[0]
    if len(unique_names) == 2:
        return f"{unique_names[0]} and {unique_names[1]}"
    return f"{unique_names[0]}, {unique_names[1]}, and the crew"


def _coerce_single_sentence(text: str) -> str:
    cleaned = " ".join(text.split()).strip()
    if not cleaned:
        return ""
    sentence_end_positions = [(cleaned.find(mark), mark) for mark in (".", "!", "?") if mark in cleaned]
    if sentence_end_positions:
        first_index, first_mark = min(sentence_end_positions, key=lambda item: item[0])
        first = cleaned[:first_index].strip()
        return f"{first}{first_mark}" if first else ""
    return f"{cleaned}."


def _fallback_summary(
    venue: VenueCandidate,
    interests: list[str],
    member_names: list[str],
    location_vibe: str | None,
) -> str:
    members_text = _summarize_members(member_names)
    top_interest = (interests[0] if interests else "hangout").lower()
    vibe_hint = location_vibe or venue.address.split(",")[0].strip() or "town"
    return f"{members_text} should hit {venue.name} for a fun {top_interest} vibe around {vibe_hint}."


def _generate_ai_summary(
    group_name: str,
    venue: VenueCandidate,
    interests: list[str],
    member_names: list[str],
    location_vibe: str | None,
) -> tuple[str, str]:
    default_summary = _fallback_summary(venue, interests, member_names, location_vibe)
    default_rationale = "Chosen from shared interests, availability windows, and the group's location vibe."

    if not settings.gemini_api_key:
        return default_summary, default_rationale

    members_context = ", ".join(member_names[:6]) if member_names else "the group"
    interests_context = ", ".join(interests[:5]) if interests else "general social plans"
    vibe_context = location_vibe or "their preferred area"
    prompt = (
        "Write exactly one short, lighthearted meetup sentence (max 20 words). "
        "No bullets, no quotes, and no second sentence. "
        f"Group name: {group_name}. Members: {members_context}. "
        f"Venue: {venue.name}, {venue.address}. "
        f"Location vibe: {vibe_context}. Shared interests: {interests_context}."
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
        summary = _coerce_single_sentence(text)
        if not summary:
            return default_summary, default_rationale
        return summary, default_rationale
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
    location_vibe = next((prefs["location_label"] for prefs in member_preferences if prefs["location_label"]), city)
    member_names = [member.user.name for member in members if member.user.name]
    venue = search_place(city, interests) or _mock_venue(city, interests)
    starts_at, ends_at = _best_candidate_slot([member.user.id for member in members])
    summary, rationale = _generate_ai_summary(group["name"], venue, interests, member_names, location_vibe)

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
