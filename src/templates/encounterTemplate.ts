import { EncounterData } from "../types/encounters";

function getEncounterSummary(encounter: EncounterData): {
  totalMonsters: number;
  uniqueMonsters: number;
  averageLevel: number;
} {
  const totalMonsters = encounter.monsters.reduce(
    (sum, monster) => sum + monster.qty,
    0
  );

  const uniqueMonsters = encounter.monsters.length;

  let totalLevels = 0;
  let countedMonsters = 0;

  for (const monster of encounter.monsters) {
    const level = Number(monster.level);

    if (!Number.isNaN(level)) {
      totalLevels += level * monster.qty;
      countedMonsters += monster.qty;
    }
  }

  return {
    totalMonsters,
    uniqueMonsters,
    averageLevel:
      countedMonsters > 0 ? totalLevels / countedMonsters : 0
  };
}

function section(title: string, content?: string): string {
  return `## ${title}

${content?.trim() || ""}
`;
}

export function generateEncounterMarkdown(
  encounter: EncounterData
): string {
  const monsterLines = encounter.monsters
    .map((monster) =>
      `- ${monster.qty}x [[${monster.path}|${monster.name}]]`
    )
    .join("\n");

  const summary = getEncounterSummary(encounter);

  return `---
shadowdarkType: encounter
name: ${encounter.name}
status: planned

partyLevel: ${encounter.partyLevel ?? 1}
partySize: ${encounter.partySize ?? 4}

terrain: ${encounter.terrain ?? ""}
light: ${encounter.light ?? ""}

tags:
  - shadowdark/encounter
---

# ${encounter.name}

## Encounter Summary

- Party Level: ${encounter.partyLevel ?? 1}
- Party Size: ${encounter.partySize ?? 4}
- Total Monsters: ${summary.totalMonsters}
- Unique Monsters: ${summary.uniqueMonsters}
- Average Monster Level: ${summary.averageLevel.toFixed(1)}


## Monsters

${monsterLines || "- None"}

${section("Setup", encounter.setup)}
${section("Read-Aloud", encounter.readAloud)}
${section("Tactics", encounter.tactics)}
${section("Treasure", encounter.treasure)}
${section("Notes", encounter.notes)}
`;
}