from collections.abc import Mapping
from typing import Any

_GROUPS = {"guard", "forward", "center"}
_SEARCH_FIELDS = (
    "name",
    "team",
    "teamLocal",
    "teamAbbreviation",
    "position",
    "number",
)


def _validate_roster(roster: Any) -> None:
    if not isinstance(roster, Mapping):
        raise TypeError("roster must be an object.")
    if type(roster.get("teamCount")) is not int or roster["teamCount"] != 30:
        raise ValueError("roster.teamCount must be 30.")

    players = roster.get("players")
    if not isinstance(players, list) or not players:
        raise ValueError("roster.players must be a non-empty array.")
    if "playerCount" in roster and (
        type(roster["playerCount"]) is not int
        or roster["playerCount"] != len(players)
    ):
        raise ValueError("roster.playerCount must match roster.players.length.")

    ids: set[str] = set()
    for index, player in enumerate(players):
        if not isinstance(player, Mapping):
            raise TypeError(f"roster.players[{index}] must be an object.")
        for field in ("id", "name", "teamAbbreviation"):
            value = player.get(field)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(
                    f"roster.players[{index}].{field} must be a non-empty string."
                )
        if player.get("group") not in _GROUPS:
            raise ValueError(
                f"roster.players[{index}].group must be guard, forward, or center."
            )
        if player["id"] in ids:
            raise ValueError(f"Duplicate player ID: {player['id']}.")
        ids.add(player["id"])


def validate_roster(roster: Any) -> bool:
    """Validate a COURTSIDE roster and return True when it is valid."""
    _validate_roster(roster)
    return True


def search_players(
    roster: Any, query: str = "", group: str | None = None
) -> list[Mapping[str, Any]]:
    """Search player and team fields, optionally limiting to a position group."""
    _validate_roster(roster)
    if not isinstance(query, str):
        raise TypeError("query must be a string.")
    if group is not None and group not in _GROUPS:
        raise ValueError("group must be guard, forward, or center.")

    normalized_query = query.strip().casefold()
    return [
        player
        for player in roster["players"]
        if (group is None or player["group"] == group)
        and (
            not normalized_query
            or any(
                isinstance(player.get(field), str)
                and normalized_query in player[field].casefold()
                for field in _SEARCH_FIELDS
            )
        )
    ]


def get_player(roster: Any, player_id: str) -> Mapping[str, Any] | None:
    """Return a player by ID, or None when the ID is not in the roster."""
    _validate_roster(roster)
    if not isinstance(player_id, str):
        raise TypeError("player_id must be a string.")
    return next(
        (player for player in roster["players"] if player["id"] == player_id),
        None,
    )


__all__ = ["get_player", "search_players", "validate_roster"]
