import { App, Menu, Notice, TFile } from "obsidian";

import { MonsterSummary } from "../types/encounters";

export function showMonsterPreview(
  app: App,
  event: MouseEvent,
  monster: MonsterSummary
): void {

  const menu = new Menu();

  menu.addItem((item) => {
    item
        .setTitle(monster.name)
        .onClick(async () => {
        const file = app.vault.getAbstractFileByPath(monster.path);

        if (!(file instanceof TFile)) {
          new Notice("Monster file not found.");
          return;
        }

        await app.workspace.getLeaf(true).openFile(file);
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
        .join(" • ")
    );

    item.setDisabled(true);
  });

  if (monster.atk) {
    menu.addItem((item) => {
      item.setTitle(`ATK: ${monster.atk}`);
      item.setDisabled(true);
    });
  }

  for (const trait of monster.traits ?? []) {
    menu.addItem((item) => {
      item.setTitle(trait);
      item.setDisabled(true);
    });
  }

  menu.addSeparator();

  menu.addItem((item) => {
    item
      .setTitle("Copy Monster Path")
      .onClick(() => {
        navigator.clipboard.writeText(monster.path);

        new Notice("Monster path copied.");
      });
  });

  menu.addItem((item) => {
    item
      .setTitle("Open in New Tab")
      .onClick(async () => {
        const file = app.vault.getAbstractFileByPath(monster.path);
        if (!(file instanceof TFile)) {
          new Notice("Monster file not found.");
          return;
        }

        await app.workspace.getLeaf(true).openFile(file);
      });
  });

  menu.addItem((item) => {
    item
      .setTitle("Open to the Right")
      .onClick(async () => {

        const file =
          app.vault.getAbstractFileByPath(monster.path);

        if (!(file instanceof TFile)) {
          new Notice("Monster file not found.");
          return;
        }

        const leaf =
          app.workspace.getLeaf("split", "vertical");

        await leaf.openFile(file);
      });
  });

  menu.showAtMouseEvent(event);
}