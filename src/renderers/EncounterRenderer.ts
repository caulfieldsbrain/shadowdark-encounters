import {
  MarkdownPostProcessorContext,
  TFile
} from "obsidian";

import ShadowdarkEncountersPlugin from "../main";

export class EncounterRenderer {
  plugin: ShadowdarkEncountersPlugin;

  constructor(plugin: ShadowdarkEncountersPlugin) {
    this.plugin = plugin;
  }

  register(): void {
    this.plugin.registerMarkdownPostProcessor(
      (
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
      ) => {
        this.process(el, ctx);
      }
    );
  }

  process(
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): void {
    const sectionInfo = ctx.getSectionInfo(el);

    if (!sectionInfo || sectionInfo.lineStart !== 0) {
      return;
    }

    const file =
      this.plugin.app.vault.getAbstractFileByPath(
        ctx.sourcePath
      );

    if (!(file instanceof TFile)) {
      return;
    }

    const cache =
      this.plugin.app.metadataCache.getFileCache(file);

    const frontmatter = cache?.frontmatter;

    if (frontmatter?.shadowdarkType !== "encounter") {
      return;
    }

    if (el.querySelector(".sd-encounter-rendered")) {
      return;
    }

    const container = el.createDiv({
      cls: "sd-encounter-rendered"
    });

    container.createEl("h2", {
      text: frontmatter.name ?? file.basename
    });

    container.createEl("p", {
      cls: "sd-encounter-rendered-meta",
      text: [
        frontmatter.partyLevel
          ? `Party Level ${frontmatter.partyLevel}`
          : null,
        frontmatter.partySize
          ? `${frontmatter.partySize} PCs`
          : null,
        frontmatter.status
          ? `Status: ${frontmatter.status}`
          : null
      ]
        .filter(Boolean)
        .join(" • ")
    });

    this.renderDashboardStats(container, frontmatter);
    this.renderCompactMonsterRoster(container, frontmatter);
  }

  renderDashboardStats(
    container: HTMLElement,
    frontmatter: Record<string, any>
  ): void {
    const monsters = Array.isArray(frontmatter.monsters)
      ? frontmatter.monsters
      : [];

    const totalMonsters = monsters.reduce(
      (sum: number, monster: any) =>
        sum + Number(monster.qty ?? 1),
      0
    );

    const uniqueMonsters = monsters.length;

    let totalLevels = 0;
    let countedMonsters = 0;

    for (const monster of monsters) {
      const level = Number(monster.level);

      if (!Number.isNaN(level)) {
        const qty = Number(monster.qty ?? 1);

        totalLevels += level * qty;
        countedMonsters += qty;
      }
    }

    const averageLevel =
      countedMonsters > 0
        ? totalLevels / countedMonsters
        : 0;

    container.createEl("p", {
      cls: "sd-encounter-rendered-stats",
      text:
        `${totalMonsters} Monsters` +
        ` • ${uniqueMonsters} Unique` +
        ` • Avg Lv ${averageLevel.toFixed(1)}`
    });
  }

  renderCompactMonsterRoster(
    container: HTMLElement,
    frontmatter: Record<string, any>
  ): void {
    const monsters = Array.isArray(frontmatter.monsters)
        ? frontmatter.monsters
        : [];

    if (monsters.length === 0) {
        return;
    }

    const rosterEl = container.createDiv({
        cls: "sd-encounter-rendered-roster"
    });

    for (const monster of monsters) {
        const qty = monster.qty ?? 1;
        const name = monster.name ?? "Unknown Monster";
        const path = monster.path;

        const meta = [
        monster.level ? `LV ${monster.level}` : null,
        monster.ac ? `AC ${monster.ac}` : null,
        monster.hp ? `HP ${monster.hp}` : null
        ]
        .filter(Boolean)
        .join(" • ");

        const pillEl = rosterEl.createEl("button", {
        cls: "sd-encounter-rendered-monster",
        text: meta
            ? `${qty}x ${name} • ${meta}`
            : `${qty}x ${name}`
        });

        pillEl.addEventListener("click", async () => {
        if (typeof path !== "string" || path.length === 0) {
            return;
        }

        const file =
            this.plugin.app.vault.getAbstractFileByPath(path);

        if (file instanceof TFile) {
            await this.plugin.app.workspace
            .getLeaf(false)
            .openFile(file);
        }
        });
    }
  }
}