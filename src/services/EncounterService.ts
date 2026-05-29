import { App, normalizePath, TFolder } from "obsidian";

import { EncounterData } from "../types/encounters";
import { generateEncounterMarkdown } from "../templates/encounterTemplate";

export class EncounterService {
  app: App;

  constructor(app: App) {
    this.app = app;
  }

  async createEncounterNote(encounter: EncounterData) {
    const content = generateEncounterMarkdown(encounter);

    const safeName = encounter.name
      .replace(/[\\/:*?"<>|]/g, "")
      .trim();

    const folderPath = "Encounters";
    const filePath = normalizePath(`${folderPath}/${safeName}.md`);

    await this.ensureFolder(folderPath);

    const file = await this.app.vault.create(filePath, content);

    await this.app.workspace.getLeaf(true).openFile(file);

    return file;
  }

  async ensureFolder(path: string): Promise<void> {
    const existing = this.app.vault.getAbstractFileByPath(path);

    if (existing instanceof TFolder) {
      return;
    }

    await this.app.vault.createFolder(path);
  }
}