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

export function validateRoster(roster: Roster): true;
export function searchPlayers(roster: Roster, query?: string, options?: SearchOptions): Player[];
export function getPlayer(roster: Roster, id: string): Player | null;
