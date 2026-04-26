import unittest
from unittest.mock import patch

from app.services.planner import _coerce_single_sentence, _fallback_summary, _generate_ai_summary
from app.schemas import VenueCandidate


class _Response:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._payload


class PlannerSummaryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.venue = VenueCandidate(
            name="Canal Social Club",
            address="Kreuzberg, Berlin",
            source_url=None,
            website_url=None,
            image_url=None,
            price_level=2,
            opens_at=None,
            open_now=True,
        )

    def test_coerce_single_sentence_uses_first_sentence(self) -> None:
        text = "Alex and Sam should grab tacos tonight! Then check a bar."
        summary = _coerce_single_sentence(text)
        self.assertEqual(summary, "Alex and Sam should grab tacos tonight!")

    def test_fallback_summary_includes_vibe_and_interest(self) -> None:
        summary = _fallback_summary(
            self.venue,
            ["Tacos", "Live Music"],
            ["Alex", "Sam", "Jo"],
            "Kreuzberg",
        )
        self.assertIn("Canal Social Club", summary)
        self.assertIn("tacos", summary.lower())
        self.assertIn("Kreuzberg", summary)

    @patch("app.services.planner.settings.gemini_api_key", "test-key")
    @patch("app.services.planner.httpx.post")
    def test_generate_ai_summary_returns_single_sentence(self, mocked_post) -> None:
        mocked_post.return_value = _Response(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": "Alex and Sam should hit Canal Social Club for cozy food vibes in Kreuzberg.\nBecause it suits everyone."
                                }
                            ]
                        }
                    }
                ]
            }
        )

        summary, rationale = _generate_ai_summary(
            group_name="Weekend Crew",
            venue=self.venue,
            interests=["Food", "Music"],
            member_names=["Alex", "Sam"],
            location_vibe="Kreuzberg",
        )
        self.assertEqual(summary, "Alex and Sam should hit Canal Social Club for cozy food vibes in Kreuzberg.")
        self.assertIn("location vibe", rationale)


if __name__ == "__main__":
    unittest.main()
