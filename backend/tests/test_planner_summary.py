import unittest
from unittest.mock import patch

from app.services.planner import (
    CalendarAvailabilityError,
    _best_candidate_slot,
    _calendar_connected_member_ids,
    _coerce_single_sentence,
    _fallback_summary,
    _generate_ai_summary,
    _overlaps,
)
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

    def test_overlap_handles_google_zulu_timestamps(self) -> None:
        self.assertTrue(
            _overlaps(
                "2026-04-27T18:30:00+00:00",
                "2026-04-27T20:30:00+00:00",
                {"start": "2026-04-27T19:00:00Z", "end": "2026-04-27T20:00:00Z"},
            )
        )
        self.assertFalse(
            _overlaps(
                "2026-04-27T18:30:00+00:00",
                "2026-04-27T20:30:00+00:00",
                {"start": "2026-04-27T20:30:00Z", "end": "2026-04-27T21:00:00Z"},
            )
        )

    @patch("app.services.planner.has_calendar_connection")
    def test_calendar_matching_only_uses_connected_members(self, mocked_has_calendar_connection) -> None:
        mocked_has_calendar_connection.side_effect = lambda member_id: member_id in {"connected-a", "connected-b"}
        self.assertEqual(
            _calendar_connected_member_ids(["connected-a", "offline", "connected-b"]),
            ["connected-a", "connected-b"],
        )

    @patch("app.services.planner._candidate_slots")
    @patch("app.services.planner.get_busy_windows")
    @patch("app.services.planner.has_calendar_connection")
    def test_best_candidate_slot_skips_busy_connected_calendars(
        self,
        mocked_has_calendar_connection,
        mocked_get_busy_windows,
        mocked_candidate_slots,
    ) -> None:
        mocked_has_calendar_connection.side_effect = lambda member_id: member_id == "connected"
        mocked_candidate_slots.return_value = [
            ("2026-04-27T18:30:00+00:00", "2026-04-27T20:30:00+00:00"),
            ("2026-04-27T19:30:00+00:00", "2026-04-27T21:30:00+00:00"),
        ]
        mocked_get_busy_windows.side_effect = [
            [{"start": "2026-04-27T19:00:00Z", "end": "2026-04-27T20:00:00Z"}],
            [],
        ]

        self.assertEqual(
            _best_candidate_slot(["connected", "offline"]),
            ("2026-04-27T19:30:00+00:00", "2026-04-27T21:30:00+00:00"),
        )

    @patch("app.services.planner._candidate_slots")
    @patch("app.services.planner.get_busy_windows")
    @patch("app.services.planner.has_calendar_connection")
    def test_best_candidate_slot_raises_when_connected_calendars_are_all_busy(
        self,
        mocked_has_calendar_connection,
        mocked_get_busy_windows,
        mocked_candidate_slots,
    ) -> None:
        mocked_has_calendar_connection.return_value = True
        mocked_candidate_slots.return_value = [
            ("2026-04-27T18:30:00+00:00", "2026-04-27T20:30:00+00:00"),
        ]
        mocked_get_busy_windows.return_value = [
            {"start": "2026-04-27T18:30:00Z", "end": "2026-04-27T20:30:00Z"},
        ]

        with self.assertRaises(CalendarAvailabilityError):
            _best_candidate_slot(["connected"])


if __name__ == "__main__":
    unittest.main()
