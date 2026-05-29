import { App, TFile } from "obsidian";
import { MONSTER_TYPE } from "../constants/plugin";
import { MonsterSummary } from "../types/encounters";

export class MonsterIndex {
  app: App;

  constructor(app: App) {
    this.app = app;
  }

  searchMonsters(query: string): MonsterSummary[] {
    const lower = query.toLowerCase().trim();

    if (!lower) {
        return this.getAllMonsters();
    }

    return this.getAllMonsters().filter((monster) =>
        monster.name.toLowerCase().includes(lower)
    );
}

  getAllMonsters(): MonsterSummary[] {
    const files = this.app.vault.getMarkdownFiles();

    const monsters: MonsterSummary[] = [];

    for (const file of files) {
      const monster = this.getMonsterFromFile(file);

      if (monster) {
        monsters.push(monster);
      }
    }

    return monsters.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  getMonsterFromFile(file: TFile): MonsterSummary | null {
    const cache =
      this.app.metadataCache.getFileCache(file);

    const frontmatter = cache?.frontmatter;

    if (!frontmatter) {
      return null;
    }

    if (frontmatter.shadowdarkType !== MONSTER_TYPE) {
      return null;
    }

    return {
      name: frontmatter.name || file.basename,
      path: file.path,

      level: frontmatter.level,
      ac: frontmatter.ac,
      hp: frontmatter.hp,

      atk: Array.isArray(frontmatter.atk)
          ? frontmatter.atk[0]
          : frontmatter.atk,

      traits: Array.isArray(frontmatter.traits)
          ? frontmatter.traits.slice(0, 2)
          : [],

      tags: frontmatter.tags || []
    };
  }
}