import { EncounterData } from "../types/encounters";

function yamlString(value: string | number | undefined): string {
  return JSON.stringify(value ?? "");
}

function section(title: string, content?: string): string {
  return `## ${title}

${content?.trim() || ""}
`;
}

export function generateEncounterMarkdown(
  encounter: EncounterData
): string {
  const monsterFrontmatter = encounter.monsters
    .map((monster) => {
      return `  - name: ${yamlString(monster.name)}
    qty: ${monster.qty}
    path: ${yamlString(monster.path)}
    level: ${yamlString(monster.level)}
    ac: ${yamlString(monster.ac)}
    hp: ${yamlString(monster.hp)}`;
    })
    .join("\n");

  return `---
shadowdarkType: encounter
name: ${yamlString(encounter.name)}
status: planned

partyLevel: ${encounter.partyLevel ?? 1}
partySize: ${encounter.partySize ?? 4}

terrain: ${yamlString(encounter.terrain)}
light: ${yamlString(encounter.light)}

monsters:
${monsterFrontmatter || "  []"}

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