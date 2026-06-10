import { App, Menu, Modal, Notice, TFile } from "obsidian";

import ShadowdarkEncountersPlugin from "../main";
import { EncounterIndex } from "../services/EncounterIndex";
import { EncounterSummary } from "../types/encounters";
import { CreateEncounterModal } from "./CreateEncounterModal";

export class EncounterBrowserModal extends Modal {
  plugin: ShadowdarkEncountersPlugin;
  encounterIndex: EncounterIndex;

  searchText = "";
  statusFilter = "";
  partyLevelFilter = "";
  sortMode = "name-asc";

  resultsEl!: HTMLDivElement;

  constructor(
    app: App,
    plugin: ShadowdarkEncountersPlugin,
    encounterIndex: EncounterIndex
  ) {
    super(app);

    this.plugin = plugin;
    this.encounterIndex = encounterIndex;
  }

  onOpen(): void {
    this.modalEl.addClass("sd-encounter-browser-modal");
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  render(): void {
    const { contentEl } = this;

    contentEl.empty();

    contentEl.createEl("h2", {
      text: "Shadowdark Encounters"
    });

    this.renderFilters(contentEl);

    this.resultsEl = contentEl.createDiv({
      cls: "sd-encounter-browser-results"
    });

    this.renderResults();
  }

  renderFilters(containerEl: HTMLElement): void {
    const filterRow = containerEl.createDiv({
      cls: "sd-encounter-browser-filter-row"
    });

    const searchField = filterRow.createDiv({
      cls: "sd-encounter-filter-field"
    });

    searchField.createEl("label", {
      text: "Search"
    });

    const searchInput = searchField.createEl("input", {
      type: "text",
      placeholder: "Search encounters..."
    });

    searchInput.value = this.searchText;

    searchInput.addEventListener("input", () => {
      this.searchText = searchInput.value;
      this.renderResults();
    });

    const statusField = filterRow.createDiv({
      cls: "sd-encounter-filter-field"
    });

    statusField.createEl("label", {
      text: "Status"
    });

    const statusSelect = statusField.createEl("select");

    statusSelect.createEl("option", {
      text: "Any",
      value: ""
    });

    for (const status of ["planned", "running", "completed", "archived"]) {
      statusSelect.createEl("option", {
        text: status,
        value: status
      });
    }

    statusSelect.value = this.statusFilter;

    statusSelect.addEventListener("change", () => {
      this.statusFilter = statusSelect.value;
      this.renderResults();
    });

    const levelField = filterRow.createDiv({
      cls: "sd-encounter-filter-field"
    });

    levelField.createEl("label", {
      text: "Party Level"
    });

    const levelSelect = levelField.createEl("select");

    levelSelect.createEl("option", {
      text: "Any",
      value: ""
    });

    for (let level = 1; level <= 10; level++) {
      levelSelect.createEl("option", {
        text: String(level),
        value: String(level)
      });
    }

    levelSelect.value = this.partyLevelFilter;

    levelSelect.addEventListener("change", () => {
      this.partyLevelFilter = levelSelect.value;
      this.renderResults();
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
      text: "Party Level Low-High",
      value: "level-asc"
    });

    sortSelect.createEl("option", {
      text: "Party Level High-Low",
      value: "level-desc"
    });

    sortSelect.createEl("option", {
      text: "Status",
      value: "status"
    });

    sortSelect.value = this.sortMode;

    sortSelect.addEventListener("change", () => {
      this.sortMode = sortSelect.value;
      this.renderResults();
    });
  }

    sortEncounters(
        encounters: EncounterSummary[]
    ): EncounterSummary[] {
        return [...encounters].sort((a, b) => {
            switch (this.sortMode) {
                case "name-desc":
                    return b.name.localeCompare(a.name);

                case "level-asc":
                    return (
                        Number(a.partyLevel ?? 999) -
                        Number(b.partyLevel ?? 999) ||
                        a.name.localeCompare(b.name)
                    );

                case "level-desc":
                    return (
                        Number(b.partyLevel ?? -1) -
                        Number(a.partyLevel ?? -1) ||
                        a.name.localeCompare(b.name)
                    );

                case "status":
                    return (
                        String(a.status ?? "").localeCompare(
                            String(b.status ?? "")
                        ) || a.name.localeCompare(b.name)
                    );

                case "name-asc":
                default:
                    return a.name.localeCompare(b.name);
            }
        });
    }  

  renderResults(): void {
    this.resultsEl.empty();

    let encounters =
      this.encounterIndex.searchEncounters(this.searchText);

    if (this.statusFilter) {
      encounters = encounters.filter(
        (encounter) => encounter.status === this.statusFilter
      );
    }

    if (this.partyLevelFilter) {
      encounters = encounters.filter(
        (encounter) =>
          String(encounter.partyLevel ?? "") === this.partyLevelFilter
      );
    }

    encounters = this.sortEncounters(encounters);

    const summaryEl = this.resultsEl.createDiv({
      cls: "sd-encounter-browser-summary"
    });

    summaryEl.setText(`${encounters.length} encounter(s)`);

    if (encounters.length === 0) {
      this.resultsEl.createDiv({
        cls: "sd-encounter-browser-empty",
        text: "No encounters match those filters."
      });

      return;
    }

    for (const encounter of encounters) {
      this.renderEncounterRow(encounter);
    }
  }

  renderEncounterRow(encounter: EncounterSummary): void {
    const rowEl = this.resultsEl.createDiv({
      cls: "sd-encounter-browser-row"
    });

    const infoEl = rowEl.createDiv({
      cls: "sd-encounter-browser-info"
    });

    infoEl.createDiv({
      cls: "sd-encounter-browser-name",
      text: encounter.name
    });

    infoEl.createDiv({
      cls: "sd-encounter-browser-meta",
      text:
        `PL ${encounter.partyLevel ?? "?"}` +
        ` • ${encounter.partySize ?? "?"} PCs` +
        ` • ${encounter.monsterCount} Monsters` +
        ` • Avg Lv ${encounter.averageMonsterLevel.toFixed(1)}`
    });

    if (encounter.status) {
      infoEl.createDiv({
        cls: `sd-encounter-status-badge is-${encounter.status}`,
        text: encounter.status.toUpperCase()
      });
    }

    const actionsEl = rowEl.createDiv({
      cls: "sd-encounter-browser-actions"
    });

    const openButton = actionsEl.createEl("button", {
      text: "Open"
    });

    openButton.addEventListener("click", async () => {
      await this.openEncounter(encounter, "current");
    });

    const editButton = actionsEl.createEl("button", {
      text: "Edit"
    });

    editButton.addEventListener("click", async () => {
      await this.editEncounter(encounter);
    });

    const duplicateButton = actionsEl.createEl("button", {
      text: "Duplicate"
    });

    duplicateButton.addEventListener("click", async () => {
      await this.duplicateEncounter(encounter);
    });

    rowEl.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.showContextMenu(event, encounter);
    });
  }

  async getEncounterFile(
    encounter: EncounterSummary
  ): Promise<TFile | null> {
    const file = this.app.vault.getAbstractFileByPath(encounter.path);

    if (!(file instanceof TFile)) {
      new Notice("Encounter file not found.");
      return null;
    }

    return file;
  }

  async openEncounter(
    encounter: EncounterSummary,
    mode: "current" | "new-tab" | "right"
  ): Promise<void> {
    const file = await this.getEncounterFile(encounter);

    if (!file) {
      return;
    }

    if (mode === "right") {
      await this.app.workspace
        .getLeaf("split", "vertical")
        .openFile(file);
      return;
    }

    if (mode === "new-tab") {
      await this.app.workspace
        .getLeaf(true)
        .openFile(file);
      return;
    }

    await this.app.workspace
      .getLeaf(false)
      .openFile(file);

    this.close();
  }

  async editEncounter(
    encounter: EncounterSummary
  ): Promise<void> {
    const file = await this.getEncounterFile(encounter);

    if (!file) {
      return;
    }

    this.close();

    new CreateEncounterModal(
      this.app,
      this.plugin,
      this.plugin.monsterIndex,
      this.plugin.encounterService,
      file,
      "edit"
    ).open();
  }

  async duplicateEncounter(
    encounter: EncounterSummary
  ): Promise<void> {
    const file = await this.getEncounterFile(encounter);

    if (!file) {
      return;
    }

    this.close();

    new CreateEncounterModal(
      this.app,
      this.plugin,
      this.plugin.monsterIndex,
      this.plugin.encounterService,
      file,
      "duplicate"
    ).open();
  }

  showContextMenu(
    event: MouseEvent,
    encounter: EncounterSummary
  ): void {
    const menu = new Menu();

    menu.addItem((item) =>
      item
        .setTitle("Open")
        .onClick(async () => {
          await this.openEncounter(encounter, "current");
        })
    );

    menu.addItem((item) =>
      item
        .setTitle("Open in New Tab")
        .onClick(async () => {
          await this.openEncounter(encounter, "new-tab");
        })
    );

    menu.addItem((item) =>
      item
        .setTitle("Open to the Right")
        .onClick(async () => {
          await this.openEncounter(encounter, "right");
        })
    );

    menu.addSeparator();

    menu.addItem((item) =>
      item
        .setTitle("Edit")
        .onClick(async () => {
          await this.editEncounter(encounter);
        })
    );

    menu.addItem((item) =>
      item
        .setTitle("Duplicate")
        .onClick(async () => {
          await this.duplicateEncounter(encounter);
        })
    );

    menu.showAtMouseEvent(event);
  }
}