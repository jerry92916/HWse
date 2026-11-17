import json
import unittest
from pathlib import Path

from courtside_roster import get_player, search_players, validate_roster

FIXTURE = Path(__file__).parents[2] / "fixtures" / "sample-roster.json"


class RosterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with FIXTURE.open(encoding="utf-8") as file:
            cls.roster = json.load(file)

    def test_validates_shared_sample_roster(self):
        self.assertTrue(validate_roster(self.roster))

    def test_searches_and_filters_by_group(self):
        self.assertEqual(search_players(self.roster, "LOS ANGELES", "guard"), [])
        results = search_players(self.roster, "warriors", "guard")
        self.assertEqual(results[0]["id"], "201939")
        self.assertEqual(search_players(self.roster, "30")[0]["name"], "Stephen Curry")

    def test_looks_up_player_and_returns_none_for_unknown_id(self):
        self.assertEqual(get_player(self.roster, "2544")["name"], "LeBron James")
        self.assertIsNone(get_player(self.roster, "missing"))

    def test_rejects_bad_team_count_and_duplicate_ids(self):
        with self.assertRaisesRegex(ValueError, "teamCount"):
            validate_roster({**self.roster, "teamCount": 29})
        with self.assertRaisesRegex(ValueError, "playerCount"):
            validate_roster({**self.roster, "playerCount": True})
        duplicate = {**self.roster, "players": [self.roster["players"][0]] * 2}
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            validate_roster(duplicate)


if __name__ == "__main__":
    unittest.main()
