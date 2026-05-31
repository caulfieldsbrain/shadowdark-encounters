export interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

export interface ShadowdarkAttack {
  name: string;
  bonus?: string;
  damage?: string;
  range?: string;
  notes?: string;
  raw?: string;
}

export interface ShadowdarkMonster {
  name: string;
  level: string;
  alignment: string;
  type: string;
  ac: string;
  hp: string;
  mv: string;
  atk: ShadowdarkAttack[];
  stats: {
    str: string;
    dex: string;
    con: string;
    int: string;
    wis: string;
    cha: string;
  };
  traits: string[];
  specials: string[];
  spells: string[];
  gear: string[];
  description: string;
  source: string;
  tags: string[];
}