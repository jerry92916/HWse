import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getPlayer, searchPlayers, validateRoster } from "../index.js";

const roster = JSON.parse(await readFile(new URL("../../fixtures/sample-roster.json", import.meta.url), "utf8"));

test("validates the shared sample roster", () => {
  assert.equal(validateRoster(roster), true);
});

test("searches case-insensitively and filters by position group", () => {
  assert.deepEqual(searchPlayers(roster, "LOS ANGELES", { group: "guard" }), []);
  assert.equal(searchPlayers(roster, "warriors", { group: "guard" })[0].id, "201939");
  assert.equal(searchPlayers(roster, "30")[0].name, "Stephen Curry");
});

test("looks up players and returns null for unknown IDs", () => {
  assert.equal(getPlayer(roster, "2544").name, "LeBron James");
  assert.equal(getPlayer(roster, "missing"), null);
});

test("rejects malformed roster data and duplicate IDs", () => {
  assert.throws(() => validateRoster({ ...roster, teamCount: 29 }), /teamCount/);
  assert.throws(() => validateRoster({ ...roster, players: [roster.players[0], roster.players[0]] }), /Duplicate/);
});
