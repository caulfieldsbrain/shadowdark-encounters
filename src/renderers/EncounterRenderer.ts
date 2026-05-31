import {
  MarkdownPostProcessorContext,
  Menu,
  Notice,
  TFile
} from "obsidian";

import ShadowdarkEncountersPlugin from "../main";

import { parseFrontmatter } from "../statblocksCompat/parseFrontMatter";
import { renderMonsterBlock } from "../statblocksCompat/renderMonsterBlock";
import { DEFAULT_STATBLOCK_RENDER_SETTINGS } from "../statblocksCompat/settings";

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
      (sum: number, monster: Record<string, any>) =>
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
      container.createEl("p", {
        cls: "sd-encounter-rendered-empty",
        text: "No monsters added."
      });

      return;
    }

    const rosterEl = container.createDiv({
      cls: "sd-encounter-rendered-roster"
    });

    for (const monster of monsters) {
      const qty = monster.qty ?? 1;
      const name = monster.name ?? "Unknown Monster";

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

      pillEl.addEventListener("click", (event) => {
        this.showMonsterPillMenu(event, monster);
      });
    }
  }

  showMonsterPillMenu(
    event: MouseEvent,
    monster: Record<string, any>
  ): void {
    const path = monster.path;
    const name = monster.name ?? "Unknown Monster";

    const menu = new Menu();

    menu.addItem((item) => {
      item
        .setTitle(`Open ${name}`)
        .onClick(async () => {
          await this.openMonster(path, "current");
        });
    });

    menu.addItem((item) => {
      item
        .setTitle("Open in New Tab")
        .onClick(async () => {
          await this.openMonster(path, "new-tab");
        });
    });

    menu.addItem((item) => {
      item
        .setTitle("Open to the Right")
        .onClick(async () => {
          await this.openMonster(path, "right");
        });
    });

    menu.addSeparator();

    menu.addItem((item) => {
      item
        .setTitle("Preview Statblock")
        .onClick(async () => {
          await this.showMonsterStatblockPreview(monster);
        });
    });

    menu.addSeparator();

    menu.addItem((item) => {
      item.setTitle(
        [
          monster.level ? `LV ${monster.level}` : null,
          monster.ac ? `AC ${monster.ac}` : null,
          monster.hp ? `HP ${monster.hp}` : null
        ]
          .filter(Boolean)
          .join(" • ") || "No stats available"
      );

      item.setDisabled(true);
    });

    menu.showAtMouseEvent(event);
  }

  async openMonster(
    path: unknown,
    mode: "current" | "new-tab" | "right"
  ): Promise<void> {
    if (typeof path !== "string" || path.length === 0) {
      new Notice("Monster file not found.");
      return;
    }

    const file =
      this.plugin.app.vault.getAbstractFileByPath(path);

    if (!(file instanceof TFile)) {
      new Notice("Monster file not found.");
      return;
    }

    if (mode === "right") {
      await this.plugin.app.workspace
        .getLeaf("split", "vertical")
        .openFile(file);

      return;
    }

    if (mode === "new-tab") {
      await this.plugin.app.workspace
        .getLeaf(true)
        .openFile(file);

      return;
    }

    await this.plugin.app.workspace
      .getLeaf(false)
      .openFile(file);
  }

  async showMonsterStatblockPreview(
    monster: Record<string, any>
  ): Promise<void> {
    const path = monster.path;

    if (typeof path !== "string" || path.length === 0) {
      new Notice("Monster file not found.");
      return;
    }

    const file =
      this.plugin.app.vault.getAbstractFileByPath(path);

    if (!(file instanceof TFile)) {
      new Notice("Monster file not found.");
      return;
    }

    const cache =
      this.plugin.app.metadataCache.getFileCache(file);

    const frontmatter = cache?.frontmatter;

    if (!frontmatter) {
      new Notice("Monster has no frontmatter.");
      return;
    }

    const result = parseFrontmatter(frontmatter);

    if (!result.success || !result.data) {
      new Notice("Could not parse monster.");
      return;
    }

    const previewEl = document.body.createDiv({
      cls: "sd-encounter-statblock-preview"
    });

    const innerEl = previewEl.createDiv({
      cls: "sd-encounter-statblock-preview-inner"
    });

    renderMonsterBlock(
      innerEl,
      result.data,
      DEFAULT_STATBLOCK_RENDER_SETTINGS,
      result.warnings
    );

    const closeButton = previewEl.createEl("button", {
      cls: "sd-encounter-statblock-preview-close",
      text: "×"
    });

    closeButton.addEventListener("click", () => {
      previewEl.remove();
    });

    previewEl.addEventListener("click", (event) => {
      if (event.target === previewEl) {
        previewEl.remove();
      }
    });
  }
}