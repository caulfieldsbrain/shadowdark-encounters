export interface MonsterReference {
  name: string;
  path: string;
  qty: number;

  level?: string;
  ac?: string;
  hp?: string;
}

export interface EncounterData {
  name: string;

  status?: string;

  partyLevel?: number;
  partySize?: number;

  terrain?: string;
  light?: string;

  monsters: MonsterReference[];

  setup?: string;
  readAloud?: string;
  tactics?: string;
  treasure?: string;
  notes?: string;

  tags?: string[];
}

export interface MonsterSummary {
  name: string;
  path: string;

  level?: string;
  ac?: string;
  hp?: string;

  atk?: string;

  traits?: string[];

  tags?: string[];
}