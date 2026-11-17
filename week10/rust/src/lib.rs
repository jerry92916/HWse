use serde_json::Value;
use std::collections::HashSet;
use std::fmt;

const GROUPS: [&str; 3] = ["guard", "forward", "center"];
const SEARCH_FIELDS: [&str; 6] = [
    "name",
    "team",
    "teamLocal",
    "teamAbbreviation",
    "position",
    "number",
];

#[derive(Debug, PartialEq, Eq)]
pub enum RosterError {
    Invalid(&'static str),
    DuplicatePlayerId(String),
}

impl fmt::Display for RosterError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Invalid(message) => formatter.write_str(message),
            Self::DuplicatePlayerId(id) => write!(formatter, "Duplicate player ID: {id}."),
        }
    }
}

impl std::error::Error for RosterError {}

pub fn validate_roster(roster: &Value) -> Result<(), RosterError> {
    let object = roster
        .as_object()
        .ok_or(RosterError::Invalid("roster must be an object."))?;
    if object.get("teamCount").and_then(Value::as_u64) != Some(30) {
        return Err(RosterError::Invalid("roster.teamCount must be 30."));
    }

    let players = object
        .get("players")
        .and_then(Value::as_array)
        .filter(|players| !players.is_empty())
        .ok_or(RosterError::Invalid(
            "roster.players must be a non-empty array.",
        ))?;
    if let Some(player_count) = object.get("playerCount") {
        if player_count.as_u64() != Some(players.len() as u64) {
            return Err(RosterError::Invalid(
                "roster.playerCount must match roster.players.length.",
            ));
        }
    }

    let mut ids = HashSet::with_capacity(players.len());
    for player in players {
        let player_object = player.as_object().ok_or(RosterError::Invalid(
            "roster.players entries must be objects.",
        ))?;
        for field in ["id", "name", "teamAbbreviation"] {
            let valid = player_object
                .get(field)
                .and_then(Value::as_str)
                .is_some_and(|value| !value.trim().is_empty());
            if !valid {
                return Err(RosterError::Invalid(match field {
                    "id" => "roster player id must be a non-empty string.",
                    "name" => "roster player name must be a non-empty string.",
                    _ => "roster player teamAbbreviation must be a non-empty string.",
                }));
            }
        }
        if !player_object
            .get("group")
            .and_then(Value::as_str)
            .is_some_and(|group| GROUPS.contains(&group))
        {
            return Err(RosterError::Invalid(
                "roster player group must be guard, forward, or center.",
            ));
        }
        let id = player_object["id"].as_str().expect("validated player id");
        if !ids.insert(id) {
            return Err(RosterError::DuplicatePlayerId(id.to_owned()));
        }
    }
    Ok(())
}

pub fn search_players<'a>(
    roster: &'a Value,
    query: &str,
    group: Option<&str>,
) -> Result<Vec<&'a Value>, RosterError> {
    validate_roster(roster)?;
    if group.is_some_and(|value| !GROUPS.contains(&value)) {
        return Err(RosterError::Invalid(
            "group must be guard, forward, or center.",
        ));
    }

    let normalized_query = query.trim().to_lowercase();
    let players = roster["players"].as_array().expect("validated players");
    Ok(players
        .iter()
        .filter(|player| {
            let player_group = player["group"].as_str().expect("validated group");
            if group.is_some_and(|selected| selected != player_group) {
                return false;
            }
            normalized_query.is_empty()
                || SEARCH_FIELDS.iter().any(|field| {
                    player
                        .get(field)
                        .and_then(Value::as_str)
                        .is_some_and(|value| value.to_lowercase().contains(&normalized_query))
                })
        })
        .collect())
}

pub fn get_player<'a>(roster: &'a Value, id: &str) -> Result<Option<&'a Value>, RosterError> {
    validate_roster(roster)?;
    Ok(roster["players"]
        .as_array()
        .expect("validated players")
        .iter()
        .find(|player| player["id"].as_str() == Some(id)))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_roster() -> Value {
        serde_json::from_str(include_str!("../tests/sample-roster.json")).unwrap()
    }

    #[test]
    fn validates_shared_sample_roster() {
        assert_eq!(validate_roster(&sample_roster()), Ok(()));
    }

    #[test]
    fn searches_and_filters_by_group() {
        let roster = sample_roster();
        assert!(search_players(&roster, "LOS ANGELES", Some("guard"))
            .unwrap()
            .is_empty());
        let result = search_players(&roster, "warriors", Some("guard")).unwrap();
        assert_eq!(result[0]["id"], "201939");
        assert_eq!(
            search_players(&roster, "30", None).unwrap()[0]["name"],
            "Stephen Curry"
        );
    }

    #[test]
    fn looks_up_player_and_returns_none_for_unknown_id() {
        let roster = sample_roster();
        assert_eq!(
            get_player(&roster, "2544").unwrap().unwrap()["name"],
            "LeBron James"
        );
        assert!(get_player(&roster, "missing").unwrap().is_none());
    }

    #[test]
    fn rejects_bad_team_count_and_duplicate_ids() {
        let mut bad_team_count = sample_roster();
        bad_team_count["teamCount"] = Value::from(29);
        assert!(validate_roster(&bad_team_count).is_err());

        let mut duplicate = sample_roster();
        duplicate["players"][1] = duplicate["players"][0].clone();
        assert!(matches!(
            validate_roster(&duplicate),
            Err(RosterError::DuplicatePlayerId(_))
        ));
    }
}
