import { App, Modal, Notice, Setting, TFile } from "obsidian";

import { showMonsterPreview } from "../components/MonsterPreviewPopover";
import { EncounterService } from "../services/EncounterService";
import { MonsterIndex } from "../services/MonsterIndex";
import { generateEncounterMarkdown } from "../templates/encounterTemplate";
import { EncounterData, MonsterReference, MonsterSummary } from "../types/encounters";

type EncounterWizardStep = "monsters" | "details" | "preview";

export class CreateEncounterModal extends Modal {
  monsterIndex: MonsterIndex;
  encounterService: EncounterService;

  currentStep: EncounterWizardStep = "monsters";

  encounterName = "";

  selectedMonsters: MonsterReference[] = [];

  monsterSearch = "";
  levelFilter = "";
  tagFilter = "";
  sortMode = "name-asc";

  partyLevel = 1;
  partySize = 4;

  setup = "";
  readAloud = "";
  tactics = "";
  treasure = "";
  notes = "";

  private fileToEdit?: TFile;

  private get isEditing(): boolean {
    return !!this.fileToEdit;
  }

  constructor(
    app: App,
    monsterIndex: MonsterIndex,
    encounterService: EncounterService,
    fileToEdit?: TFile
  ) {
    super(app);

    this.monsterIndex = monsterIndex;
    this.encounterService = encounterService;
    this.fileToEdit = fileToEdit;
  }

  async onOpen(): Promise<void> {
    this.modalEl.addClass("sd-encounter-modal");

    if (this.fileToEdit) {
      await this.loadEncounterFromFile(this.fileToEdit);
    }

    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  render(): void {
    const { contentEl } = this;

    contentEl.empty();

    contentEl.createEl("h2", {
    text: this.isEditing
      ? "Edit Shadowdark Encounter"
      : "Create Shadowdark Encounter"
  });

    this.renderStepIndicator(contentEl);

    if (this.currentStep === "monsters") {
      this.renderMonsterStep(contentEl);
      return;
    }

    if (this.currentStep === "details") {
      this.renderDetailsStep(contentEl);
      return;
    }

    this.renderPreviewStep(contentEl);
  }

  renderStepIndicator(containerEl: HTMLElement): void {
    containerEl.createEl("p", {
      cls: "sd-encounter-step-indicator",
      text:
        this.currentStep === "monsters"
          ? "Step 1 of 3: Add Monsters"
          : this.currentStep === "details"
            ? "Step 2 of 3: Add Details"
            : "Step 3 of 3: Preview"
    });
  }

  renderMonsterStep(contentEl: HTMLElement): void {
    new Setting(contentEl)
      .setName("Encounter name")
      .addText((text) => {
        text.setPlaceholder("Goblin Ambush");
        text.setValue(this.encounterName);

        text.onChange((value) => {
          this.encounterName = value;
        });
      });

    const builderEl = contentEl.createDiv({
      cls: "sd-encounter-builder"
    });

    const browserEl = builderEl.createDiv({
      cls: "sd-encounter-browser"
    });

    const draftEl = builderEl.createDiv({
      cls: "sd-encounter-draft"
    });

    browserEl.createEl("h3", {
      text: "Monster Browser"
    });

    this.renderFilterRow(browserEl);

    const resultsEl = browserEl.createDiv({
      cls: "sd-encounter-monster-results"
    });

    resultsEl.dataset.role = "monster-results";

    draftEl.createEl("h3", {
      text: "Encounter Draft"
    });

    const selectedEl = draftEl.createDiv({
      cls: "sd-encounter-selected-monsters"
    });

    selectedEl.dataset.role = "selected-monsters";

    const summaryEl = draftEl.createDiv({
      cls: "sd-encounter-summary"
    });

    summaryEl.dataset.role = "encounter-summary";

    const buttonEl = draftEl.createDiv({
      cls: "sd-encounter-create-button"
    });

    new Setting(buttonEl)
      .addButton((button) => {
        button
          .setButtonText("Next")
          .setCta()
          .onClick(() => {
            if (!this.encounterName.trim()) {
              new Notice("Encounter name is required.");
              return;
            }

            this.currentStep = "details";
            this.render();
          });
      });

    this.renderMonsterResults();
    this.renderSelectedMonsters();
    this.renderEncounterSummary();
  }

  renderFilterRow(browserEl: HTMLElement): void {
    const filterRow = browserEl.createDiv({
      cls: "sd-encounter-filter-row"
    });

    const searchField = filterRow.createDiv({
      cls: "sd-encounter-filter-field"
    });

    searchField.createEl("label", {
      text: "Search"
    });

    const searchInput = searchField.createEl("input", {
      type: "text",
      placeholder: "Search monsters..."
    });

    searchInput.value = this.monsterSearch;

    searchInput.addEventListener("input", () => {
      this.monsterSearch = searchInput.value;
      this.renderMonsterResults();
    });

    const levelField = filterRow.createDiv({
      cls: "sd-encounter-filter-field"
    });

    levelField.createEl("label", {
      text: "Level"
    });

    const levelSelect = levelField.createEl("select");

    levelSelect.createEl("option", {
      text: "Any",
      value: ""
    });

    for (let level = 0; level <= 10; level++) {
      levelSelect.createEl("option", {
        text: String(level),
        value: String(level)
      });
    }

    levelSelect.value = this.levelFilter;

    levelSelect.addEventListener("change", () => {
      this.levelFilter = levelSelect.value;
      this.renderMonsterResults();
    });

    const tagField = filterRow.createDiv({
      cls: "sd-encounter-filter-field"
    });

    tagField.createEl("label", {
      text: "Tag"
    });

    const tagSelect = tagField.createEl("select");

    tagSelect.createEl("option", {
      text: "Any",
      value: ""
    });

    for (const tag of this.getAvailableTags()) {
      tagSelect.createEl("option", {
        text: tag,
        value: tag
      });
    }

    tagSelect.value = this.tagFilter;

    tagSelect.addEventListener("change", () => {
      this.tagFilter = tagSelect.value;
      this.renderMonsterResults();
    });

    const sortField = filterRow.createDiv({
      cls: "sd-encounter-filter-field"
    });

    sortField.createEl("label", {
      text: "Sort"
    });

    const sortSelect = sortField.createEl("select");

    sortSelect.createEl("option", {
      text: "Name A-Z",
      value: "name-asc"
    });

    sortSelect.createEl("option", {
      text: "Name Z-A",
      value: "name-desc"
    });

    sortSelect.createEl("option", {
      text: "Level Low-High",
      value: "level-asc"
    });

    sortSelect.createEl("option", {
      text: "Level High-Low",
      value: "level-desc"
    });

    sortSelect.value = this.sortMode;

    sortSelect.addEventListener("change", () => {
      this.sortMode = sortSelect.value;
      this.renderMonsterResults();
    });
  }

  renderDetailsStep(contentEl: HTMLElement): void {
    const detailsEl = contentEl.createDiv({
      cls: "sd-encounter-details-step"
    });

    const partyRow = detailsEl.createDiv({
      cls: "sd-encounter-party-row"
    });

    const levelField = partyRow.createDiv({
      cls: "sd-encounter-party-field"
    });

    levelField.createEl("label", {
      text: "Party Level"
    });

    const levelInput = levelField.createEl("input", {
      type: "number"
    });

    levelInput.value = String(this.partyLevel);

    levelInput.addEventListener("change", () => {
      const parsed = Number(levelInput.value);

      this.partyLevel =
        Number.isFinite(parsed) && parsed > 0
          ? Math.floor(parsed)
          : 1;
    });

    const sizeField = partyRow.createDiv({
      cls: "sd-encounter-party-field"
    });

    sizeField.createEl("label", {
      text: "Party Size"
    });

    const sizeInput = sizeField.createEl("input", {
      type: "number"
    });

    sizeInput.value = String(this.partySize);

    sizeInput.addEventListener("change", () => {
      const parsed = Number(sizeInput.value);

      this.partySize =
        Number.isFinite(parsed) && parsed > 0
          ? Math.floor(parsed)
          : 4;
    });

    detailsEl.createEl("p", {
      text: "Add optional GM-facing details for this encounter."
    });

    const detailsGrid = detailsEl.createDiv({
      cls: "sd-encounter-details-grid"
    });

    this.addTextAreaField(detailsGrid, "Setup", this.setup, (value) => {
      this.setup = value;
    });

    this.addTextAreaField(detailsGrid, "Read-Aloud", this.readAloud, (value) => {
      this.readAloud = value;
    });

    this.addTextAreaField(detailsGrid, "Tactics", this.tactics, (value) => {
      this.tactics = value;
    });

    this.addTextAreaField(detailsGrid, "Treasure", this.treasure, (value) => {
      this.treasure = value;
    });

    const notesField = detailsEl.createDiv({
      cls: "sd-encounter-details-field sd-encounter-notes-field"
    });

    notesField.createEl("label", {
      text: "Notes"
    });

    const notesArea = notesField.createEl("textarea");

    notesArea.value = this.notes;
    notesArea.rows = 4;

    notesArea.addEventListener("input", () => {
      this.notes = notesArea.value;
    });

    this.renderFooterButtons(contentEl, [
      {
        label: "Back",
        onClick: () => {
          this.currentStep = "monsters";
          this.render();
        }
      },
      {
        label: "Skip Details",
        onClick: () => {
          this.currentStep = "preview";
          this.render();
        }
      },
      {
        label: "Preview",
        cta: true,
        onClick: () => {
          this.currentStep = "preview";
          this.render();
        }
      }
    ]);
  }

  addTextAreaField(
    containerEl: HTMLElement,
    label: string,
    value: string,
    onChange: (value: string) => void
  ): void {
    const fieldEl = containerEl.createDiv({
      cls: "sd-encounter-details-field"
    });

    fieldEl.createEl("label", {
      text: label
    });

    const textarea = fieldEl.createEl("textarea");

    textarea.value = value;
    textarea.rows = 4;

    textarea.addEventListener("input", () => {
      onChange(textarea.value);
    });
  }

  renderPreviewStep(contentEl: HTMLElement): void {
    const encounter = this.getEncounterData();

    const previewEl = contentEl.createDiv({
      cls: "sd-encounter-preview-step"
    });

    previewEl.createEl("p", {
      text: "Preview the markdown that will be created."
    });

    const markdownPreview = previewEl.createEl("textarea", {
      cls: "sd-encounter-markdown-preview"
    });

    markdownPreview.value = generateEncounterMarkdown(encounter);
    markdownPreview.readOnly = true;

    this.renderFooterButtons(contentEl, [
      {
        label: "Back",
        onClick: () => {
          this.currentStep = "details";
          this.render();
        }
      },
      {
        label: this.isEditing
          ? "Save Encounter"
          : "Create Encounter",
        cta: true,
        onClick: async () => {
          await this.saveEncounter();
        }
      }
    ]);
  }

  renderFooterButtons(
    containerEl: HTMLElement,
    buttons: {
      label: string;
      cta?: boolean;
      onClick: () => void | Promise<void>;
    }[]
  ): void {

    const footerEl = containerEl.createDiv({
      cls: "sd-encounter-wizard-footer"
    });

    for (const buttonConfig of buttons) {

      const button = footerEl.createEl("button", {
        text: buttonConfig.label
      });

      if (buttonConfig.cta) {
        button.addClass("mod-cta");
      }

      button.addEventListener("click", () => {
        void buttonConfig.onClick();
      });
    }
  }

  getEncounterData(): EncounterData {
    return {
      name: this.encounterName.trim(),
      partyLevel: this.partyLevel,
      partySize: this.partySize,
      monsters: this.selectedMonsters,
      setup: this.setup,
      readAloud: this.readAloud,
      tactics: this.tactics,
      treasure: this.treasure,
      notes: this.notes
    };
  }

  getAvailableTags(): string[] {
    const tagSet = new Set<string>();

    for (const monster of this.monsterIndex.getAllMonsters()) {
      for (const tag of monster.tags ?? []) {
        tagSet.add(String(tag));
      }
    }

    return [...tagSet].sort((a, b) => a.localeCompare(b));
  }

  sortMonsters(monsters: MonsterSummary[]): MonsterSummary[] {
    return [...monsters].sort((a, b) => {
      const aLevel = Number(a.level ?? 999);
      const bLevel = Number(b.level ?? 999);

      switch (this.sortMode) {
        case "name-desc":
          return b.name.localeCompare(a.name);

        case "level-asc":
          return aLevel - bLevel || a.name.localeCompare(b.name);

        case "level-desc":
          return bLevel - aLevel || a.name.localeCompare(b.name);

        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }

  renderMonsterResults(): void {
    const resultsEl = this.contentEl.querySelector(
      '[data-role="monster-results"]'
    );

    if (!(resultsEl instanceof HTMLElement)) {
      return;
    }

    resultsEl.empty();

    let monsters = this.monsterIndex.searchMonsters(this.monsterSearch);

    if (this.levelFilter) {
      monsters = monsters.filter((monster) =>
        String(monster.level ?? "") === this.levelFilter
      );
    }

    if (this.tagFilter) {
      monsters = monsters.filter((monster) =>
        (monster.tags ?? []).includes(this.tagFilter)
      );
    }

    monsters = this.sortMonsters(monsters);
    monsters = monsters.slice(0, 100);

    for (const monster of monsters) {
      new Setting(resultsEl)
        .setName(monster.name)
        .setDesc(
          [
            monster.level ? `LV ${monster.level}` : null,
            monster.ac ? `AC ${monster.ac}` : null,
            monster.hp ? `HP ${monster.hp}` : null
          ]
            .filter(Boolean)
            .join(" • ") || monster.path
        )
        .addButton((button) => {
          button
            .setButtonText("Preview")
            .onClick((event) => {
              showMonsterPreview(this.app, event, monster);
            });
        })
        .addButton((button) => {
          button
            .setButtonText("Add")
            .setCta()
            .onClick(() => {
              this.addMonster(monster);
            });
        });
    }
  }

  renderSelectedMonsters(): void {
    const selectedEl = this.contentEl.querySelector(
      '[data-role="selected-monsters"]'
    );

    if (!(selectedEl instanceof HTMLElement)) {
      return;
    }

    selectedEl.empty();

    if (this.selectedMonsters.length === 0) {
      selectedEl.createEl("p", {
        text: "No monsters selected yet."
      });

      return;
    }

    for (const monster of this.selectedMonsters) {
      new Setting(selectedEl)
        .setName(monster.name)
        .setDesc(monster.path)
        .addText((text) => {
          text.setValue(String(monster.qty));

          text.onChange((value) => {
            const qty = Number(value);

            monster.qty =
              Number.isFinite(qty) && qty > 0
                ? Math.floor(qty)
                : 1;

            this.renderEncounterSummary();
          });
        })
        .addButton((button) => {
          button
            .setButtonText("Remove")
            .onClick(() => {
              this.selectedMonsters = this.selectedMonsters.filter(
                (selected) => selected.path !== monster.path
              );

              this.renderSelectedMonsters();
              this.renderEncounterSummary();
            });
        });
    }
  }

  renderEncounterSummary(): void {
    const summaryEl = this.contentEl.querySelector(
      '[data-role="encounter-summary"]'
    );

    if (!(summaryEl instanceof HTMLElement)) {
      return;
    }

    summaryEl.empty();

    const summary = this.getEncounterSummary();

    summaryEl.createEl("h4", {
      text: "Encounter Summary"
    });

    summaryEl.createEl("p", {
      text: `Total Monsters: ${summary.totalMonsters}`
    });

    summaryEl.createEl("p", {
      text: `Unique Monsters: ${summary.uniqueMonsters}`
    });

    summaryEl.createEl("p", {
      text: `Average Monster Level: ${summary.averageLevel.toFixed(1)}`
    });
  }

  getEncounterSummary(): {
    totalMonsters: number;
    uniqueMonsters: number;
    averageLevel: number;
  } {
    const totalMonsters = this.selectedMonsters.reduce(
      (sum, monster) => sum + monster.qty,
      0
    );

    const uniqueMonsters = this.selectedMonsters.length;

    let totalLevels = 0;
    let countedMonsters = 0;

    for (const monster of this.selectedMonsters) {
      const level = Number(monster.level);

      if (!Number.isNaN(level)) {
        totalLevels += level * monster.qty;
        countedMonsters += monster.qty;
      }
    }

    const averageLevel =
      countedMonsters > 0
        ? totalLevels / countedMonsters
        : 0;

    return {
      totalMonsters,
      uniqueMonsters,
      averageLevel
    };
  }

  addMonster(monster: MonsterSummary): void {
    const existing = this.selectedMonsters.find(
      (selected) => selected.path === monster.path
    );

    if (existing) {
      existing.qty += 1;
    } else {
      this.selectedMonsters.push({
        name: monster.name,
        path: monster.path,
        qty: 1,
        level: monster.level,
        ac: monster.ac,
        hp: monster.hp
      });
    }

    this.renderSelectedMonsters();
    this.renderEncounterSummary();
  }

  private async loadEncounterFromFile(file: TFile): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter;

    if (!frontmatter || frontmatter.shadowdarkType !== "encounter") {
      new Notice("This file is not a Shadowdark encounter.");
      return;
    }

    this.encounterName =
      String(frontmatter.name ?? file.basename);

    this.partyLevel =
      Number(frontmatter.partyLevel ?? 1);

    this.partySize =
      Number(frontmatter.partySize ?? 4);

    this.selectedMonsters = Array.isArray(frontmatter.monsters)
      ? frontmatter.monsters.map((monster: Record<string, unknown>) => ({
          name: String(monster.name ?? "Unknown Monster"),
          path: String(monster.path ?? ""),
          qty: Number(monster.qty ?? 1),
          level: String(monster.level ?? ""),
          ac: String(monster.ac ?? ""),
          hp: String(monster.hp ?? "")
        }))
      : [];

    const content = await this.app.vault.read(file);

    this.setup = this.extractSection(content, "Setup");
    this.readAloud = this.extractSection(content, "Read-Aloud");
    this.tactics = this.extractSection(content, "Tactics");
    this.treasure = this.extractSection(content, "Treasure");
    this.notes = this.extractSection(content, "Notes");
  }

  private extractSection(
    content: string,
    heading: string
  ): string {
    const lines = content.split(/\r?\n/);

    const startIndex = lines.findIndex(
      (line) => line.trim() === `## ${heading}`
    );

    if (startIndex === -1) {
      return "";
    }

    const sectionLines: string[] = [];

    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      if (/^##\s+/.test(line.trim())) {
        break;
      }

      sectionLines.push(line);
    }

    return sectionLines.join("\n").trim();
  }

  async saveEncounter(): Promise<void> {
    const name = this.encounterName.trim();

    if (!name) {
      new Notice("Encounter name is required.");
      return;
    }

    try {
      if (this.fileToEdit) {
        await this.encounterService.updateEncounterNote(
          this.fileToEdit,
          this.getEncounterData()
        );

        await new Promise((resolve) => window.setTimeout(resolve, 100));

        await this.app.workspace.getLeaf(false).openFile(this.fileToEdit);

        new Notice("Encounter saved.");
      } else {
        await this.encounterService.createEncounterNote(
          this.getEncounterData()
        );

        new Notice("Encounter created.");
      }

      this.close();
    } catch (error) {
      console.error("Failed to save encounter:", error);
      new Notice("Failed to save encounter. Check console.");
    }
  }
}