export interface EncounterConsumableUsage {
  fightId: number;
  encounterName: string;
  kill: boolean | null;
  used: boolean;
  count: number;
  uptimePercent: number | null;
}

export interface ConsumableEntry {
  name: string;
  category: string;
  icon: string;
  spellId: number;
  count: number;
  uptimePercent: number | null;
  encounterBreakdown?: EncounterConsumableUsage[];
}

export interface PlayerConsumables {
  playerName: string;
  class: string;
  spec: string;
  consumables: ConsumableEntry[];
}

export interface Encounter {
  id: number;
  name: string;
  kill: boolean | null;
  startTime: number;
  endTime: number;
  encounterId: number;
}

export interface ConsumableReport {
  reportTitle: string;
  encounters: Encounter[];
  players: PlayerConsumables[];
}
