import {
  getPlayer as getPlayerFromJavaScript,
  searchPlayers as searchPlayersFromJavaScript,
  validateRoster as validateRosterFromJavaScript,
} from "./index.js";

export type PlayerGroup = "guard" | "forward" | "center";

export interface Player {
  id: string;
  name: string;
  team: string;
  teamAbbreviation: string;
  teamLocal?: string;
  position?: string;
  group: PlayerGroup;
  number?: string;
  [key: string]: unknown;
}

export interface Roster {
  teamCount: number;
  playerCount?: number;
  players: Player[];
  [key: string]: unknown;
}

export interface SearchOptions {
  group?: PlayerGroup;
}

export function validateRoster(roster: Roster): true {
  validateRosterFromJavaScript(roster);
  return true;
}

export function searchPlayers(
  roster: Roster,
  query = "",
  options: SearchOptions = {},
): Player[] {
  return searchPlayersFromJavaScript(roster, query, options);
}

export function getPlayer(roster: Roster, id: string): Player | null {
  return getPlayerFromJavaScript(roster, id);
}
