import httpx
import json
import urllib.parse
import urllib.request

from app.schemas import VenueCandidate
from app.settings import settings

PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
PLACES_LEGACY_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACES_FIELD_MASK = "places.displayName,places.formattedAddress,places.googleMapsUri,places.photos"
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
    display_name = (top.get("displayName") or {}).get("text")
    photos = top.get("photos") or []
    first_photo = photos[0].get("name") if photos else None
    return VenueCandidate(
        name=display_name or "Recommended venue",
        address=top.get("formattedAddress") or (city or "Address to confirm"),
        source_url=top.get("googleMapsUri"),
        image_url=_photo_media_url(first_photo),
    )


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
    photos = top.get("photos") or []
    first_photo_ref = photos[0].get("photo_reference") if photos else None
    return VenueCandidate(
        name=top.get("name") or "Recommended venue",
        address=top.get("formatted_address") or (city or "Address to confirm"),
        source_url=_legacy_maps_url(top.get("place_id")),
        image_url=_legacy_photo_url(first_photo_ref),
    )


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
