import httpx
import json
import urllib.parse
import urllib.request
from datetime import datetime

from app.schemas import VenueCandidate
from app.settings import settings

PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
PLACES_DETAILS_URL = "https://places.googleapis.com/v1"
PLACES_LEGACY_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACES_LEGACY_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
PLACES_FIELD_MASK = (
    "places.name,places.displayName,places.formattedAddress,places.googleMapsUri,places.photos,"
    "places.priceLevel,places.currentOpeningHours.openNow,places.currentOpeningHours.weekdayDescriptions,"
    "places.regularOpeningHours.openNow,places.regularOpeningHours.weekdayDescriptions,places.websiteUri"
)
PLACES_INTEREST_TERMS: dict[str, str] = {
    "Cafe": "cafe",
    "Bar": "bar",
    "Restaurant": "restaurant",
    "Brunch": "brunch",
    "Walk": "park",
    "Park": "park",
    "Club": "night club",
    "Bowling": "bowling alley",
}


def _interest_terms(interests: list[str]) -> str:
    terms: list[str] = []
    for interest in interests[:3]:
        mapped = PLACES_INTEREST_TERMS.get(interest, interest.lower())
        if mapped not in terms:
            terms.append(mapped)
    return " ".join(terms).strip()


def _build_text_query(city: str | None, interests: list[str]) -> str:
    terms = _interest_terms(interests)
    if city and terms:
        return f"best {terms} meetup in {city}"
    if city:
        return f"best meetup venue in {city}"
    if terms:
        return f"best {terms} meetup venue"
    return "best meetup venue"


def _photo_media_url(photo_name: str | None) -> str | None:
    if not photo_name or not settings.google_places_api_key:
        return None
    return (
        f"https://places.googleapis.com/v1/{photo_name}/media"
        f"?maxHeightPx=900&maxWidthPx=1200&key={settings.google_places_api_key}"
    )


def _legacy_photo_url(photo_reference: str | None) -> str | None:
    if not photo_reference or not settings.google_places_api_key:
        return None
    return (
        "https://maps.googleapis.com/maps/api/place/photo"
        f"?maxwidth=1200&photo_reference={photo_reference}&key={settings.google_places_api_key}"
    )


def _legacy_maps_url(place_id: str | None) -> str | None:
    if not place_id:
        return None
    return f"https://www.google.com/maps/place/?q=place_id:{place_id}"


def _normalize_price_level(value: str | int | None) -> int | None:
    if value is None:
        return None
    if isinstance(value, int):
        return value if 0 <= value <= 4 else None

    mapping = {
        "PRICE_LEVEL_FREE": 0,
        "PRICE_LEVEL_INEXPENSIVE": 1,
        "PRICE_LEVEL_MODERATE": 2,
        "PRICE_LEVEL_EXPENSIVE": 3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4,
    }
    mapped = mapping.get(value)
    if mapped is not None:
        return mapped

    if isinstance(value, str) and value.isdigit():
        as_int = int(value)
        return as_int if 0 <= as_int <= 4 else None
    return None


def _today_opening_text(weekday_descriptions: list[str]) -> str | None:
    if not weekday_descriptions:
        return None
    weekday_index = datetime.now().weekday()  # Monday=0 ... Sunday=6
    today_description = weekday_descriptions[weekday_index] if len(weekday_descriptions) > weekday_index else weekday_descriptions[0]
    parts = today_description.split(":", 1)
    if len(parts) == 2:
        return parts[1].strip()
    return today_description.strip()


def _extract_opens_at(place: dict) -> str | None:
    opening_hours = place.get("currentOpeningHours") or place.get("regularOpeningHours") or {}
    weekday_descriptions = opening_hours.get("weekdayDescriptions") or []
    if weekday_descriptions:
        return _today_opening_text(weekday_descriptions)

    open_now = opening_hours.get("openNow")
    if open_now is True:
        return "Open now"
    if open_now is False:
        return "Currently closed"
    return None


def _search_place_v1(city: str | None, interests: list[str]) -> VenueCandidate | None:
    body: dict[str, str] = {
        "textQuery": _build_text_query(city, interests),
        "languageCode": settings.google_places_language_code,
    }
    if settings.google_places_region:
        body["regionCode"] = settings.google_places_region

    response = httpx.post(
        PLACES_TEXT_SEARCH_URL,
        json=body,
        headers={
            "X-Goog-Api-Key": settings.google_places_api_key,
            "X-Goog-FieldMask": PLACES_FIELD_MASK,
        },
        timeout=8,
    )
    response.raise_for_status()
    places = response.json().get("places", [])
    if not places:
        return None
    top = places[0]
    top_name = top.get("name")
    if top_name and (
        top.get("priceLevel") is None
        or not ((top.get("currentOpeningHours") or top.get("regularOpeningHours") or {}).get("weekdayDescriptions"))
    ):
        details = _fetch_place_details_v1(top_name)
        if details:
            top = {**top, **details}
    display_name = (top.get("displayName") or {}).get("text")
    photos = top.get("photos") or []
    first_photo = photos[0].get("name") if photos else None
    return VenueCandidate(
        name=display_name or "Recommended venue",
        address=top.get("formattedAddress") or (city or "Address to confirm"),
        source_url=top.get("googleMapsUri"),
        website_url=top.get("websiteUri"),
        image_url=_photo_media_url(first_photo),
        price_level=_normalize_price_level(top.get("priceLevel")),
        opens_at=_extract_opens_at(top),
        open_now=(top.get("currentOpeningHours") or {}).get("openNow"),
    )


def _fetch_place_details_v1(place_resource_name: str) -> dict | None:
    response = httpx.get(
        f"{PLACES_DETAILS_URL}/{place_resource_name}",
        headers={
            "X-Goog-Api-Key": settings.google_places_api_key,
            "X-Goog-FieldMask": (
                "name,displayName,formattedAddress,googleMapsUri,websiteUri,photos,priceLevel,"
                "currentOpeningHours.openNow,currentOpeningHours.weekdayDescriptions,"
                "regularOpeningHours.openNow,regularOpeningHours.weekdayDescriptions"
            ),
        },
        timeout=8,
    )
    response.raise_for_status()
    payload = response.json()
    return payload if isinstance(payload, dict) else None


def _search_place_legacy(city: str | None, interests: list[str]) -> VenueCandidate | None:
    query = urllib.parse.urlencode(
        {
            "query": _build_text_query(city, interests),
            "region": settings.google_places_region or "",
            "language": settings.google_places_language_code,
            "key": settings.google_places_api_key or "",
        }
    )
    with urllib.request.urlopen(f"{PLACES_LEGACY_TEXT_SEARCH_URL}?{query}", timeout=8) as response:
        payload = json.loads(response.read().decode("utf-8"))
    results = payload.get("results", [])
    if not results:
        return None

    top = results[0]
    top_place_id = top.get("place_id")
    if top_place_id:
        details = _fetch_place_details_legacy(top_place_id)
        if details:
            top = {**top, **details}
    photos = top.get("photos") or []
    first_photo_ref = photos[0].get("photo_reference") if photos else None
    return VenueCandidate(
        name=top.get("name") or "Recommended venue",
        address=top.get("formatted_address") or (city or "Address to confirm"),
        source_url=_legacy_maps_url(top.get("place_id")),
        website_url=top.get("website"),
        image_url=_legacy_photo_url(first_photo_ref),
        price_level=_normalize_price_level(top.get("price_level")),
        opens_at=_today_opening_text((top.get("opening_hours") or {}).get("weekday_text") or []),
        open_now=(top.get("opening_hours") or {}).get("open_now"),
    )


def _fetch_place_details_legacy(place_id: str) -> dict | None:
    query = urllib.parse.urlencode(
        {
            "place_id": place_id,
            "fields": "name,formatted_address,place_id,photos,price_level,opening_hours,website,url",
            "language": settings.google_places_language_code,
            "key": settings.google_places_api_key or "",
        }
    )
    with urllib.request.urlopen(f"{PLACES_LEGACY_DETAILS_URL}?{query}", timeout=8) as response:
        payload = json.loads(response.read().decode("utf-8"))
    result = payload.get("result")
    return result if isinstance(result, dict) else None


def search_place(city: str | None, interests: list[str]) -> VenueCandidate | None:
    if not settings.google_places_api_key:
        return None

    try:
        place = _search_place_v1(city, interests)
        if place:
            return place
    except httpx.HTTPError:
        pass

    try:
        return _search_place_legacy(city, interests)
    except (httpx.HTTPError, OSError, ValueError, json.JSONDecodeError):
        return None
