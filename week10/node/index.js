const GROUPS = new Set(["guard", "forward", "center"]);
const SEARCH_FIELDS = ["name", "team", "teamLocal", "teamAbbreviation", "position", "number"];

function assertRoster(roster) {
  if (!roster || typeof roster !== "object" || Array.isArray(roster)) {
    throw new TypeError("roster must be an object.");
  }
  if (!Number.isInteger(roster.teamCount) || roster.teamCount !== 30) {
    throw new TypeError("roster.teamCount must be 30.");
  }
  if (!Array.isArray(roster.players) || roster.players.length === 0) {
    throw new TypeError("roster.players must be a non-empty array.");
  }
  if (roster.playerCount !== undefined && roster.playerCount !== roster.players.length) {
    throw new TypeError("roster.playerCount must match roster.players.length.");
  }

  const ids = new Set();
  roster.players.forEach((player, index) => {
    if (!player || typeof player !== "object" || Array.isArray(player)) {
      throw new TypeError(`roster.players[${index}] must be an object.`);
    }
    for (const field of ["id", "name", "teamAbbreviation"]) {
      if (typeof player[field] !== "string" || player[field].trim() === "") {
        throw new TypeError(`roster.players[${index}].${field} must be a non-empty string.`);
      }
    }
    if (!GROUPS.has(player.group)) {
      throw new TypeError(`roster.players[${index}].group must be guard, forward, or center.`);
    }
    if (ids.has(player.id)) {
      throw new TypeError(`Duplicate player ID: ${player.id}.`);
    }
    ids.add(player.id);
  });
}

function validateGroup(group) {
  if (group !== undefined && !GROUPS.has(group)) {
    throw new TypeError("group must be guard, forward, or center.");
  }
}

export function validateRoster(roster) {
  assertRoster(roster);
  return true;
}

export function searchPlayers(roster, query = "", options = {}) {
  assertRoster(roster);
  if (typeof query !== "string") {
    throw new TypeError("query must be a string.");
  }
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("options must be an object.");
  }
  validateGroup(options.group);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  return roster.players.filter((player) => {
    if (options.group && player.group !== options.group) return false;
    if (!normalizedQuery) return true;
    return SEARCH_FIELDS.some((field) =>
      typeof player[field] === "string" && player[field].toLocaleLowerCase().includes(normalizedQuery)
    );
  });
}

export function getPlayer(roster, id) {
  assertRoster(roster);
  if (typeof id !== "string") {
    throw new TypeError("id must be a string.");
  }
  return roster.players.find((player) => player.id === id) ?? null;
}
