# courtside-roster-111210529

Python library for validating and searching the JSON roster used by the COURTSIDE NBA site.

```python
import json
from courtside_roster import get_player, search_players

with open("players.json", encoding="utf-8") as file:
    roster = json.load(file)

print(search_players(roster, "洛杉磯"))
print(get_player(roster, "2544"))
```

`validate_roster(roster)` checks the 30-team roster, required player fields, unique IDs and position groups. `search_players(roster, query, group=None)` performs a case-insensitive search across names, teams, abbreviations, positions and jersey numbers. `get_player(roster, player_id)` returns a player or `None`.

Install the local package with `python -m pip install -e .`, then run tests with `python -m unittest discover -s tests -v`. Build with `python -m build` and publish with Twine after authenticating to PyPI.
