import { App, TFile } from "obsidian";

import { EncounterSummary } from "../types/encounters";

export class EncounterIndex {
  app: App;

  constructor(app: App) {
    this.app = app;
  }

  getAllEncounters(): EncounterSummary[] {
    return this.app.vault
      .getMarkdownFiles()
      .map((file) => this.getEncounterFromFile(file))
      .filter((encounter): encounter is EncounterSummary => encounter !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getEncounterFromFile(file: TFile): EncounterSummary | null {
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter;

    if (frontmatter?.shadowdarkType !== "encounter") {
      return null;
    }

    const monsters = Array.isArray(frontmatter.monsters)
      ? frontmatter.monsters
      : [];

    const monsterCount = monsters.reduce(
      (sum: number, monster: Record<string, unknown>) =>
        sum + Number(monster.qty ?? 1),
      0
    );

    let totalLevels = 0;
    let countedMonsters = 0;

    for (const monster of monsters) {
      const level = Number(monster.level);
      const qty = Number(monster.qty ?? 1);

      if (Number.isFinite(level)) {
        totalLevels += level * qty;
        countedMonsters += qty;
      }
    }

    return {
      name: String(frontmatter.name ?? file.basename),
      path: file.path,
      status: String(frontmatter.status ?? "planned"),
      partyLevel: Number(frontmatter.partyLevel ?? 1),
      partySize: Number(frontmatter.partySize ?? 4),
      monsterCount,
      uniqueMonsterCount: monsters.length,
      averageMonsterLevel:
        countedMonsters > 0 ? totalLevels / countedMonsters : 0
    };
  }

  searchEncounters(query: string): EncounterSummary[] {
    const lower = query.toLowerCase().trim();

    if (!lower) {
      return this.getAllEncounters();
    }

    return this.getAllEncounters().filter((encounter) =>
      encounter.name.toLowerCase().includes(lower)
    );
  }
}