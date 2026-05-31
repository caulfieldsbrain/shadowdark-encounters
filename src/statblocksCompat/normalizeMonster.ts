import { ShadowdarkAttack, ShadowdarkMonster } from "./types";

type LooseMonster = Record<string, unknown> & {
  name?: unknown;
  level?: unknown;
  alignment?: unknown;
  type?: unknown;
  ac?: unknown;
  hp?: unknown;
  mv?: unknown;
  atk?: unknown;
  stats?: unknown;
  str?: unknown;
  dex?: unknown;
  con?: unknown;
  int?: unknown;
  wis?: unknown;
  cha?: unknown;
  traits?: unknown;
  specials?: unknown;
  spells?: unknown;
  gear?: unknown;
  description?: unknown;
  source?: unknown;
  tags?: unknown;
};

function asString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim();
  }

  return fallback;
}

function normalizeModifier(value: unknown, fallback = "+0"): string {
  const raw = asString(value, fallback);
  if (!raw) return fallback;
  if (/^[+-]\d+$/.test(raw)) return raw;
  if (/^\d+$/.test(raw)) return `+${raw}`;
  if (/^-\d+$/.test(raw)) return raw;
  return raw;
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeAttack(item: unknown): ShadowdarkAttack | null {
  if (typeof item === "string") {
    return {
      name: item.trim(),
      raw: item.trim()
    };
  }

  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const name = asString(obj.name);
    if (!name) return null;

    return {
      name,
      bonus: asString(obj.bonus),
      damage: asString(obj.damage),
      range: asString(obj.range),
      notes: asString(obj.notes)
    };
  }

  return null;
}

function normalizeAttacks(value: unknown): ShadowdarkAttack[] {
  if (Array.isArray(value)) {
    return value
      .map(normalizeAttack)
      .filter((a): a is ShadowdarkAttack => a !== null);
  }

  if (typeof value === "string" && value.trim()) {
    return [{ name: value.trim(), raw: value.trim() }];
  }

  return [];
}

export function normalizeMonster(
  input: LooseMonster
): ShadowdarkMonster {
  const nestedStats = (input.stats as Record<string, unknown> | undefined) ?? {};

  const strValue = input.str ?? nestedStats.str;
  const dexValue = input.dex ?? nestedStats.dex;
  const conValue = input.con ?? nestedStats.con;
  const intValue = input.int ?? nestedStats.int;
  const wisValue = input.wis ?? nestedStats.wis;
  const chaValue = input.cha ?? nestedStats.cha;

  return {
    name: asString(input.name, "Unnamed Monster"),
    level: asString(input.level, "?"),
    alignment: asString(input.alignment, ""),
    type: asString(input.type, ""),
    ac: asString(input.ac, "?"),
    hp: asString(input.hp, "?"),
    mv: asString(input.mv, ""),
    atk: normalizeAttacks(input.atk),
    stats: {
      str: normalizeModifier(strValue, "+0"),
      dex: normalizeModifier(dexValue, "+0"),
      con: normalizeModifier(conValue, "+0"),
      int: normalizeModifier(intValue, "+0"),
      wis: normalizeModifier(wisValue, "+0"),
      cha: normalizeModifier(chaValue, "+0")
    },
    traits: normalizeStringArray(input.traits),
    specials: normalizeStringArray(input.specials),
    spells: normalizeStringArray(input.spells),
    gear: normalizeStringArray(input.gear),
    description: asString(input.description, ""),
    source: asString(input.source, ""),
    tags: normalizeStringArray(input.tags)
  };
}