import unittest
from unittest.mock import patch

import httpx

from app.services.places import _build_text_query, search_place


class _Response:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._payload


class PlacesSearchTests(unittest.TestCase):
    def test_build_text_query_city_and_interests(self) -> None:
        query = _build_text_query("Berlin", ["Cafe", "Bar", "Restaurant"])
        self.assertIn("Berlin", query)
        self.assertIn("cafe", query)

    @patch("app.services.places.settings.google_places_api_key", "test-key")
    @patch("app.services.places.httpx.post")
    def test_search_place_success(self, mocked_post) -> None:
        mocked_post.return_value = _Response(
            {
                "places": [
                    {
                        "displayName": {"text": "Cafe Zentral"},
                        "formattedAddress": "Rosenthaler Str. 1, Berlin",
                        "googleMapsUri": "https://maps.google.com/?q=Cafe+Zentral",
                        "photos": [{"name": "places/abc123/photos/photo-1"}],
                    }
                ]
            }
        )

        place = search_place("Berlin", ["Cafe"])
        self.assertIsNotNone(place)
        self.assertEqual(place.name, "Cafe Zentral")
        self.assertIn("Berlin", place.address)
        self.assertIn("maps.google.com", place.source_url or "")
        self.assertIn("/places/abc123/photos/photo-1/media", place.image_url or "")

    @patch("app.services.places.settings.google_places_api_key", None)
    @patch("app.services.places.httpx.post")
    def test_search_place_without_key(self, mocked_post) -> None:
        place = search_place("Berlin", ["Cafe"])
        self.assertIsNone(place)
        mocked_post.assert_not_called()

    @patch("app.services.places.settings.google_places_api_key", "test-key")
    @patch("app.services.places.httpx.post")
    def test_search_place_empty_results_returns_none(self, mocked_post) -> None:
        mocked_post.return_value = _Response({"places": []})
        place = search_place("Berlin", ["Cafe"])
        self.assertIsNone(place)

    @patch("app.services.places.settings.google_places_api_key", "test-key")
    @patch("app.services.places.httpx.post", side_effect=httpx.HTTPError("boom"))
    def test_search_place_http_error_returns_none(self, _mocked_post) -> None:
        place = search_place("Berlin", ["Cafe"])
        self.assertIsNone(place)


if __name__ == "__main__":
    unittest.main()
