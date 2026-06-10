import { EncounterData } from "../types/encounters";

function yamlString(value: string | number | undefined): string {
  return JSON.stringify(value ?? "");
}

function section(title: string, content?: string): string {
  return `## ${title}

${content?.trim() || ""}
`;
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function parseModifier(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getHighestMonsterDex(encounter: EncounterData): number {
  return encounter.monsters.reduce((highest, monster) => {
    const dex = parseModifier(monster.dex);

    return Math.max(highest, dex);
  }, 0);
}

function generateInitiativeEntries(
  encounter: EncounterData
): { name: string; initiative: number }[] {
  const mode = encounter.initiativeMode ?? "individual_monsters";

  if (mode === "none") {
    return [];
  }

  if (mode === "shadowdark_raw") {
    const highestDex = getHighestMonsterDex(encounter);

    return [
      {
        name: "GM / Monsters",
        initiative: rollD20() + highestDex
      }
    ];
  }

  const entries: { name: string; initiative: number }[] = [];

  for (const monster of encounter.monsters) {
    const qty = Math.max(1, Number(monster.qty ?? 1));
    const dexMod = parseModifier(monster.dex);

    for (let i = 1; i <= qty; i++) {
      entries.push({
        name: qty > 1 ? `${monster.name} ${i}` : monster.name,
        initiative: rollD20() + dexMod
      });
    }
  }

  return entries.sort((a, b) => b.initiative - a.initiative);
}

export function generateEncounterMarkdown(
  encounter: EncounterData
): string {
  const initiativeEntries = generateInitiativeEntries(encounter);

  const initiativeFrontmatter = initiativeEntries
    .map((entry) => `  - name: ${yamlString(entry.name)}
    initiative: ${entry.initiative}`)
    .join("\n");

  const monsterFrontmatter = encounter.monsters
    .map((monster) => `  - name: ${yamlString(monster.name)}
    qty: ${monster.qty}
    path: ${yamlString(monster.path)}
    level: ${yamlString(monster.level)}
    ac: ${yamlString(monster.ac)}
    hp: ${yamlString(monster.hp)}
    dex: ${yamlString(monster.dex)}`)
    .join("\n");

  return `---
shadowdarkType: encounter
name: ${yamlString(encounter.name)}
status: ${yamlString(encounter.status ?? "planned")}

partyLevel: ${encounter.partyLevel ?? 1}
partySize: ${encounter.partySize ?? 4}

terrain: ${yamlString(encounter.terrain)}
light: ${yamlString(encounter.light)}

monsters:
${monsterFrontmatter || "  []"}

initiativeMode: ${encounter.initiativeMode ?? "individual_monsters"}
initiative:
${initiativeFrontmatter || "  []"}

tags:
  - shadowdark/encounter
---

${section("Setup", encounter.setup)}
${section("Read-Aloud", encounter.readAloud)}
${section("Tactics", encounter.tactics)}
${section("Treasure", encounter.treasure)}
${section("Notes", encounter.notes)}
`;
}