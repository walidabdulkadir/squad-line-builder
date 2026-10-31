export type Position =
  | "GK" | "CB" | "LB" | "RB" | "LWB" | "RWB"
  | "CDM" | "CM" | "CAM" | "LM" | "RM"
  | "LW" | "RW" | "ST" | "CF";

export type PositionGroup = "GK" | "DEF" | "MID" | "FWD";

export interface Player {
  id: string;
  name: string;
  number: number;
  position: Position;
  secondaryPositions: Position[];
  isStarter: boolean;
  pitchCoordinates: { x: number; y: number };
  preferredFoot: "left" | "right" | "both";
  rating: number;
}

export interface FormationSlot {
  id: string;
  label: string;
  defaultX: number;
  defaultY: number;
  role: Position;
}

export interface Formation {
  id: string;
  name: string;
  slots: FormationSlot[];
}

export interface MatchResponsibilities {
  captainId: string | null;
  viceCaptainId: string | null;
  penaltyTakerId: string | null;
  freeKickTakerId: string | null;
  leftCornerTakerId: string | null;
  rightCornerTakerId: string | null;
}

export interface Substitution {
  id: string;
  offPlayerId: string;
  onPlayerId: string;
  minute: number;
  timestamp: number;
}

export interface TacticalSetup {
  teamName: string;
  kitColor: string;
  formationId: string;
  customPositions: Record<string, { x: number; y: number }>;
  starters: (string | null)[];
  substitutes: string[];
  responsibilities: MatchResponsibilities;
  substitutions: Substitution[];
}

export function positionGroup(pos: Position): PositionGroup {
  if (pos === "GK") return "GK";
  if (["CB", "LB", "RB", "LWB", "RWB"].includes(pos)) return "DEF";
  if (["CDM", "CM", "CAM", "LM", "RM"].includes(pos)) return "MID";
  return "FWD";
}
