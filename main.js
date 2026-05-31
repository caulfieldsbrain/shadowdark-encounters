/* Shadowdark Encounters */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ShadowdarkEncountersPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/constants/plugin.ts
var MONSTER_TYPE = "monster";

// src/services/MonsterIndex.ts
var MonsterIndex = class {
  constructor(app) {
    this.app = app;
  }
  searchMonsters(query) {
    const lower = query.toLowerCase().trim();
    if (!lower) {
      return this.getAllMonsters();
    }
    return this.getAllMonsters().filter(
      (monster) => monster.name.toLowerCase().includes(lower)
    );
  }
  getAllMonsters() {
    const files = this.app.vault.getMarkdownFiles();
    const monsters = [];
    for (const file of files) {
      const monster = this.getMonsterFromFile(file);
      if (monster) {
        monsters.push(monster);
      }
    }
    return monsters.sort(
      (a, b) => a.name.localeCompare(b.name)
    );
  }
  getMonsterFromFile(file) {
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache == null ? void 0 : cache.frontmatter;
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
      atk: Array.isArray(frontmatter.atk) ? frontmatter.atk[0] : frontmatter.atk,
      traits: Array.isArray(frontmatter.traits) ? frontmatter.traits.slice(0, 2) : [],
      tags: frontmatter.tags || []
    };
  }
};

// src/services/EncounterService.ts
var import_obsidian = require("obsidian");

// src/templates/encounterTemplate.ts
function yamlString(value) {
  return JSON.stringify(value != null ? value : "");
}
function section(title, content) {
  return `## ${title}

${(content == null ? void 0 : content.trim()) || ""}
`;
}
function generateEncounterMarkdown(encounter) {
  var _a, _b;
  const monsterFrontmatter = encounter.monsters.map((monster) => {
    return `  - name: ${yamlString(monster.name)}
    qty: ${monster.qty}
    path: ${yamlString(monster.path)}
    level: ${yamlString(monster.level)}
    ac: ${yamlString(monster.ac)}
    hp: ${yamlString(monster.hp)}`;
  }).join("\n");
  return `---
shadowdarkType: encounter
name: ${yamlString(encounter.name)}
status: planned

partyLevel: ${(_a = encounter.partyLevel) != null ? _a : 1}
partySize: ${(_b = encounter.partySize) != null ? _b : 4}

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

// src/services/EncounterService.ts
var EncounterService = class {
  constructor(app) {
    this.app = app;
  }
  async createEncounterNote(encounter) {
    const content = generateEncounterMarkdown(encounter);
    const safeName = encounter.name.replace(/[\\/:*?"<>|]/g, "").trim();
    const folderPath = "Encounters";
    const filePath = (0, import_obsidian.normalizePath)(`${folderPath}/${safeName}.md`);
    await this.ensureFolder(folderPath);
    const file = await this.app.vault.create(filePath, content);
    await this.app.workspace.getLeaf(true).openFile(file);
    return file;
  }
  async ensureFolder(path) {
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian.TFolder) {
      return;
    }
    await this.app.vault.createFolder(path);
  }
  async updateEncounterNote(file, encounter) {
    const content = generateEncounterMarkdown(encounter);
    await this.app.vault.modify(file, content);
  }
};

// src/modals/CreateEncounterModal.ts
var import_obsidian3 = require("obsidian");

// src/components/MonsterPreviewPopover.ts
var import_obsidian2 = require("obsidian");
function showMonsterPreview(app, event, monster) {
  var _a;
  const menu = new import_obsidian2.Menu();
  menu.addItem((item) => {
    item.setTitle(monster.name).onClick(async () => {
      const file = app.vault.getAbstractFileByPath(monster.path);
      if (!(file instanceof import_obsidian2.TFile)) {
        new import_obsidian2.Notice("Monster file not found.");
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
      ].filter(Boolean).join(" \u2022 ")
    );
    item.setDisabled(true);
  });
  if (monster.atk) {
    menu.addItem((item) => {
      item.setTitle(`ATK: ${monster.atk}`);
      item.setDisabled(true);
    });
  }
  for (const trait of (_a = monster.traits) != null ? _a : []) {
    menu.addItem((item) => {
      item.setTitle(trait);
      item.setDisabled(true);
    });
  }
  menu.addSeparator();
  menu.addItem((item) => {
    item.setTitle("Copy Monster Path").onClick(() => {
      navigator.clipboard.writeText(monster.path);
      new import_obsidian2.Notice("Monster path copied.");
    });
  });
  menu.addItem((item) => {
    item.setTitle("Open in New Tab").onClick(async () => {
      const file = app.vault.getAbstractFileByPath(monster.path);
      if (!(file instanceof import_obsidian2.TFile)) {
        new import_obsidian2.Notice("Monster file not found.");
        return;
      }
      await app.workspace.getLeaf(true).openFile(file);
    });
  });
  menu.addItem((item) => {
    item.setTitle("Open to the Right").onClick(async () => {
      const file = app.vault.getAbstractFileByPath(monster.path);
      if (!(file instanceof import_obsidian2.TFile)) {
        new import_obsidian2.Notice("Monster file not found.");
        return;
      }
      const leaf = app.workspace.getLeaf("split", "vertical");
      await leaf.openFile(file);
    });
  });
  menu.showAtMouseEvent(event);
}

// src/modals/CreateEncounterModal.ts
var CreateEncounterModal = class extends import_obsidian3.Modal {
  constructor(app, monsterIndex, encounterService, fileToEdit) {
    super(app);
    this.currentStep = "monsters";
    this.encounterName = "";
    this.selectedMonsters = [];
    this.monsterSearch = "";
    this.levelFilter = "";
    this.tagFilter = "";
    this.sortMode = "name-asc";
    this.partyLevel = 1;
    this.partySize = 4;
    this.setup = "";
    this.readAloud = "";
    this.tactics = "";
    this.treasure = "";
    this.notes = "";
    this.monsterIndex = monsterIndex;
    this.encounterService = encounterService;
    this.fileToEdit = fileToEdit;
  }
  get isEditing() {
    return !!this.fileToEdit;
  }
  async onOpen() {
    this.modalEl.addClass("sd-encounter-modal");
    if (this.fileToEdit) {
      await this.loadEncounterFromFile(this.fileToEdit);
    }
    this.render();
  }
  onClose() {
    this.contentEl.empty();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", {
      text: this.isEditing ? "Edit Shadowdark Encounter" : "Create Shadowdark Encounter"
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
  renderStepIndicator(containerEl) {
    containerEl.createEl("p", {
      cls: "sd-encounter-step-indicator",
      text: this.currentStep === "monsters" ? "Step 1 of 3: Add Monsters" : this.currentStep === "details" ? "Step 2 of 3: Add Details" : "Step 3 of 3: Preview"
    });
  }
  renderMonsterStep(contentEl) {
    new import_obsidian3.Setting(contentEl).setName("Encounter name").addText((text) => {
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
    new import_obsidian3.Setting(buttonEl).addButton((button) => {
      button.setButtonText("Next").setCta().onClick(() => {
        if (!this.encounterName.trim()) {
          new import_obsidian3.Notice("Encounter name is required.");
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
  renderFilterRow(browserEl) {
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
  renderDetailsStep(contentEl) {
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
      this.partyLevel = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
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
      this.partySize = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 4;
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
  addTextAreaField(containerEl, label, value, onChange) {
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
  renderPreviewStep(contentEl) {
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
        label: this.isEditing ? "Save Encounter" : "Create Encounter",
        cta: true,
        onClick: async () => {
          await this.saveEncounter();
        }
      }
    ]);
  }
  renderFooterButtons(containerEl, buttons) {
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
  getEncounterData() {
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
  getAvailableTags() {
    var _a;
    const tagSet = /* @__PURE__ */ new Set();
    for (const monster of this.monsterIndex.getAllMonsters()) {
      for (const tag of (_a = monster.tags) != null ? _a : []) {
        tagSet.add(String(tag));
      }
    }
    return [...tagSet].sort((a, b) => a.localeCompare(b));
  }
  sortMonsters(monsters) {
    return [...monsters].sort((a, b) => {
      var _a, _b;
      const aLevel = Number((_a = a.level) != null ? _a : 999);
      const bLevel = Number((_b = b.level) != null ? _b : 999);
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
  renderMonsterResults() {
    const resultsEl = this.contentEl.querySelector(
      '[data-role="monster-results"]'
    );
    if (!(resultsEl instanceof HTMLElement)) {
      return;
    }
    resultsEl.empty();
    let monsters = this.monsterIndex.searchMonsters(this.monsterSearch);
    if (this.levelFilter) {
      monsters = monsters.filter(
        (monster) => {
          var _a;
          return String((_a = monster.level) != null ? _a : "") === this.levelFilter;
        }
      );
    }
    if (this.tagFilter) {
      monsters = monsters.filter(
        (monster) => {
          var _a;
          return ((_a = monster.tags) != null ? _a : []).includes(this.tagFilter);
        }
      );
    }
    monsters = this.sortMonsters(monsters);
    monsters = monsters.slice(0, 100);
    for (const monster of monsters) {
      new import_obsidian3.Setting(resultsEl).setName(monster.name).setDesc(
        [
          monster.level ? `LV ${monster.level}` : null,
          monster.ac ? `AC ${monster.ac}` : null,
          monster.hp ? `HP ${monster.hp}` : null
        ].filter(Boolean).join(" \u2022 ") || monster.path
      ).addButton((button) => {
        button.setButtonText("Preview").onClick((event) => {
          showMonsterPreview(this.app, event, monster);
        });
      }).addButton((button) => {
        button.setButtonText("Add").setCta().onClick(() => {
          this.addMonster(monster);
        });
      });
    }
  }
  renderSelectedMonsters() {
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
      new import_obsidian3.Setting(selectedEl).setName(monster.name).setDesc(monster.path).addText((text) => {
        text.setValue(String(monster.qty));
        text.onChange((value) => {
          const qty = Number(value);
          monster.qty = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;
          this.renderEncounterSummary();
        });
      }).addButton((button) => {
        button.setButtonText("Remove").onClick(() => {
          this.selectedMonsters = this.selectedMonsters.filter(
            (selected) => selected.path !== monster.path
          );
          this.renderSelectedMonsters();
          this.renderEncounterSummary();
        });
      });
    }
  }
  renderEncounterSummary() {
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
  getEncounterSummary() {
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
    const averageLevel = countedMonsters > 0 ? totalLevels / countedMonsters : 0;
    return {
      totalMonsters,
      uniqueMonsters,
      averageLevel
    };
  }
  addMonster(monster) {
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
  async loadEncounterFromFile(file) {
    var _a, _b, _c;
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache == null ? void 0 : cache.frontmatter;
    if (!frontmatter || frontmatter.shadowdarkType !== "encounter") {
      new import_obsidian3.Notice("This file is not a Shadowdark encounter.");
      return;
    }
    this.encounterName = String((_a = frontmatter.name) != null ? _a : file.basename);
    this.partyLevel = Number((_b = frontmatter.partyLevel) != null ? _b : 1);
    this.partySize = Number((_c = frontmatter.partySize) != null ? _c : 4);
    this.selectedMonsters = Array.isArray(frontmatter.monsters) ? frontmatter.monsters.map((monster) => {
      var _a2, _b2, _c2, _d, _e, _f;
      return {
        name: String((_a2 = monster.name) != null ? _a2 : "Unknown Monster"),
        path: String((_b2 = monster.path) != null ? _b2 : ""),
        qty: Number((_c2 = monster.qty) != null ? _c2 : 1),
        level: String((_d = monster.level) != null ? _d : ""),
        ac: String((_e = monster.ac) != null ? _e : ""),
        hp: String((_f = monster.hp) != null ? _f : "")
      };
    }) : [];
    const content = await this.app.vault.read(file);
    this.setup = this.extractSection(content, "Setup");
    this.readAloud = this.extractSection(content, "Read-Aloud");
    this.tactics = this.extractSection(content, "Tactics");
    this.treasure = this.extractSection(content, "Treasure");
    this.notes = this.extractSection(content, "Notes");
  }
  extractSection(content, heading) {
    const lines = content.split(/\r?\n/);
    const startIndex = lines.findIndex(
      (line) => line.trim() === `## ${heading}`
    );
    if (startIndex === -1) {
      return "";
    }
    const sectionLines = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^##\s+/.test(line.trim())) {
        break;
      }
      sectionLines.push(line);
    }
    return sectionLines.join("\n").trim();
  }
  async saveEncounter() {
    const name = this.encounterName.trim();
    if (!name) {
      new import_obsidian3.Notice("Encounter name is required.");
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
        new import_obsidian3.Notice("Encounter saved.");
      } else {
        await this.encounterService.createEncounterNote(
          this.getEncounterData()
        );
        new import_obsidian3.Notice("Encounter created.");
      }
      this.close();
    } catch (error) {
      console.error("Failed to save encounter:", error);
      new import_obsidian3.Notice("Failed to save encounter. Check console.");
    }
  }
};

// src/renderers/EncounterRenderer.ts
var import_obsidian4 = require("obsidian");

// src/statblocksCompat/normalizeMonster.ts
function asString(value, fallback = "") {
  if (value === null || value === void 0) {
    return fallback;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return fallback;
}
function normalizeModifier(value, fallback = "+0") {
  const raw = asString(value, fallback);
  if (!raw)
    return fallback;
  if (/^[+-]\d+$/.test(raw))
    return raw;
  if (/^\d+$/.test(raw))
    return `+${raw}`;
  if (/^-\d+$/.test(raw))
    return raw;
  return raw;
}
function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split("\n").map((line) => line.trim()).filter(Boolean);
  }
  return [];
}
function normalizeAttack(item) {
  if (typeof item === "string") {
    return {
      name: item.trim(),
      raw: item.trim()
    };
  }
  if (item && typeof item === "object") {
    const obj = item;
    const name = asString(obj.name);
    if (!name)
      return null;
    return {
      name,
      bonus: asString(obj.bonus),
      damage: asString(obj.damage),
      range: asString(obj.range),
      notes: asString(obj.notes)
    };
  }
  return null;
}
function normalizeAttacks(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeAttack).filter((a) => a !== null);
  }
  if (typeof value === "string" && value.trim()) {
    return [{ name: value.trim(), raw: value.trim() }];
  }
  return [];
}
function normalizeMonster(input) {
  var _a, _b, _c, _d, _e, _f, _g;
  const nestedStats = (_a = input.stats) != null ? _a : {};
  const strValue = (_b = input.str) != null ? _b : nestedStats.str;
  const dexValue = (_c = input.dex) != null ? _c : nestedStats.dex;
  const conValue = (_d = input.con) != null ? _d : nestedStats.con;
  const intValue = (_e = input.int) != null ? _e : nestedStats.int;
  const wisValue = (_f = input.wis) != null ? _f : nestedStats.wis;
  const chaValue = (_g = input.cha) != null ? _g : nestedStats.cha;
  return {
    name: asString(input.name, "Unnamed Monster"),
    level: asString(input.level, "?"),
    alignment: asString(input.alignment, ""),
    type: asString(input.type, ""),
    ac: asString(input.ac, "?"),
    hp: asString(input.hp, "?"),
    mv: asString(input.mv, ""),
    atk: normalizeAttacks(input.atk),
    stats: {
      str: normalizeModifier(strValue, "+0"),
      dex: normalizeModifier(dexValue, "+0"),
      con: normalizeModifier(conValue, "+0"),
      int: normalizeModifier(intValue, "+0"),
      wis: normalizeModifier(wisValue, "+0"),
      cha: normalizeModifier(chaValue, "+0")
    },
    traits: normalizeStringArray(input.traits),
    specials: normalizeStringArray(input.specials),
    spells: normalizeStringArray(input.spells),
    gear: normalizeStringArray(input.gear),
    description: asString(input.description, ""),
    source: asString(input.source, ""),
    tags: normalizeStringArray(input.tags)
  };
}

// src/statblocksCompat/parseFrontMatter.ts
function parseFrontmatter(frontmatter) {
  const errors = [];
  const warnings = [];
  if (!frontmatter || typeof frontmatter !== "object") {
    return {
      success: false,
      errors: ["No valid frontmatter found."],
      warnings
    };
  }
  const monster = normalizeMonster(frontmatter);
  if (!monster.name || monster.name === "Unnamed Monster") {
    warnings.push("Monster is missing a name.");
  }
  if (!monster.ac || monster.ac === "?") {
    warnings.push("Monster is missing AC.");
  }
  if (!monster.hp || monster.hp === "?") {
    warnings.push("Monster is missing HP.");
  }
  if (monster.atk.length === 0) {
    warnings.push("Monster has no attacks listed.");
  }
  return {
    success: true,
    data: monster,
    errors,
    warnings
  };
}

// src/statblocksCompat/renderMonsterBlock.ts
function createDiv(className, text) {
  const el = document.createElement("div");
  if (className)
    el.className = className;
  if (text !== void 0)
    el.textContent = text;
  return el;
}
function createSpan(className, text) {
  const el = document.createElement("span");
  if (className)
    el.className = className;
  if (text !== void 0)
    el.textContent = text;
  return el;
}
function createList(className) {
  const el = document.createElement("ul");
  if (className)
    el.className = className;
  return el;
}
function createListItem(className) {
  const el = document.createElement("li");
  if (className)
    el.className = className;
  return el;
}
function renderAttackText(attack) {
  if (attack.raw)
    return attack.raw;
  const parts = [attack.name];
  if (attack.bonus)
    parts.push(attack.bonus);
  if (attack.damage)
    parts.push(`(${attack.damage})`);
  if (attack.range)
    parts.push(`[${attack.range}]`);
  if (attack.notes)
    parts.push(`- ${attack.notes}`);
  return parts.join(" ").trim();
}
function getAlignmentLabel(alignment) {
  const normalized = alignment.trim().toUpperCase();
  switch (normalized) {
    case "L":
      return "Lawful";
    case "N":
      return "Neutral";
    case "C":
      return "Chaotic";
    default:
      return "";
  }
}
function splitAttackConnector(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^(AND|OR)\s+(.+)$/i);
  if (!match) {
    return { connector: null, body: trimmed };
  }
  return {
    connector: match[1].toUpperCase(),
    body: match[2].trim()
  };
}
function normalizeDiceFormula(formula) {
  return formula.replace(/\s+/g, "");
}
function attackBonusToFormula(bonus) {
  const normalized = bonus.trim();
  return `1d20${normalized}`;
}
function createDiceRollButton(text, formula, onRollDice) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sd-monster-dice-button";
  button.textContent = text;
  button.title = `Roll ${formula}`;
  button.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    onRollDice(formula);
  });
  return button;
}
function appendAttackBodyWithDiceButtons(parent, body, onRollDice) {
  const attackBonusRegex = /([+-]\d+)/;
  const damageRegex = /\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/i;
  const replacements = [];
  const bonusMatch = attackBonusRegex.exec(body);
  if ((bonusMatch == null ? void 0 : bonusMatch.index) !== void 0) {
    const text = bonusMatch[1];
    replacements.push({
      start: bonusMatch.index,
      end: bonusMatch.index + text.length,
      text,
      formula: attackBonusToFormula(text)
    });
  }
  const damageMatch = damageRegex.exec(body);
  if ((damageMatch == null ? void 0 : damageMatch.index) !== void 0) {
    const text = damageMatch[1];
    replacements.push({
      start: damageMatch.index,
      end: damageMatch.index + text.length,
      text,
      formula: normalizeDiceFormula(text)
    });
  }
  replacements.sort((a, b) => a.start - b.start);
  let cursor = 0;
  for (const replacement of replacements) {
    if (replacement.start < cursor) {
      continue;
    }
    if (replacement.start > cursor) {
      parent.appendChild(document.createTextNode(body.slice(cursor, replacement.start)));
    }
    parent.appendChild(
      createDiceRollButton(replacement.text, replacement.formula, onRollDice)
    );
    cursor = replacement.end;
  }
  if (cursor < body.length) {
    parent.appendChild(document.createTextNode(body.slice(cursor)));
  }
}
function appendTextWithDamageDiceButtons(parent, text, onRollDice) {
  const damageRegex = /\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/gi;
  let cursor = 0;
  let match;
  while ((match = damageRegex.exec(text)) !== null) {
    const diceText = match[0];
    const start = match.index;
    const end = start + diceText.length;
    if (start > cursor) {
      parent.appendChild(document.createTextNode(text.slice(cursor, start)));
    }
    parent.appendChild(
      createDiceRollButton(diceText, normalizeDiceFormula(diceText), onRollDice)
    );
    cursor = end;
  }
  if (cursor < text.length) {
    parent.appendChild(document.createTextNode(text.slice(cursor)));
  }
}
function appendRenderedAttack(li, attackText, settings, options) {
  const { connector, body } = splitAttackConnector(attackText);
  if (connector) {
    li.appendChild(createSpan("sd-monster-attack-connector", `${connector} `));
  }
  const attackTextEl = createSpan("sd-monster-attack-text");
  if (settings.enableDiceRollerIntegration && options.onRollDice) {
    appendAttackBodyWithDiceButtons(attackTextEl, body, options.onRollDice);
  } else {
    attackTextEl.textContent = body;
  }
  li.appendChild(attackTextEl);
}
function splitLabelAndBody(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { label: "", body: "" };
  }
  let match = null;
  match = trimmed.match(/^(.{1,100}?\([^)]{1,40}\)\.)\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }
  match = trimmed.match(/^([^.!?:]{1,80}[.!?])\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }
  match = trimmed.match(/^([^:]{1,80}:)\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }
  match = trimmed.match(/^(.{1,80}?\s[-—])\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }
  return { label: "", body: trimmed };
}
function addSection(parent, title, items, className, settings, options) {
  if (items.length === 0)
    return;
  const section2 = createDiv("sd-monster-section");
  section2.appendChild(createDiv("sd-monster-section-title", title));
  const list = createList(className);
  for (const item of items) {
    const li = createListItem();
    const { label, body } = splitLabelAndBody(item);
    if (label) {
      li.appendChild(createSpan("sd-monster-ability-label", label));
    }
    if (body) {
      if (label) {
        li.appendChild(document.createTextNode(" "));
      }
      const bodyEl = createSpan("sd-monster-ability-text");
      if (settings.enableDiceRollerIntegration && options.onRollDice) {
        appendTextWithDamageDiceButtons(bodyEl, body, options.onRollDice);
      } else {
        bodyEl.textContent = body;
      }
      li.appendChild(bodyEl);
    }
    if (!label) {
      if (settings.enableDiceRollerIntegration && options.onRollDice) {
        appendTextWithDamageDiceButtons(li, item, options.onRollDice);
      } else {
        li.textContent = item;
      }
    }
    list.appendChild(li);
  }
  section2.appendChild(list);
  parent.appendChild(section2);
}
function renderMonsterBlock(container, monster, settings, warnings = [], options = {}) {
  container.innerHTML = "";
  const card = createDiv(
    [
      "sd-monster-card",
      settings.compactMode ? "is-compact" : ""
    ].filter(Boolean).join(" ")
  );
  const header = createDiv("sd-monster-header");
  header.appendChild(createDiv("sd-monster-name", monster.name));
  const meta = createDiv("sd-monster-meta");
  const metaParts = [];
  if (monster.level) {
    metaParts.push(createSpan(void 0, `Level ${monster.level}`));
  }
  if (monster.alignment) {
    const alignmentSpan = createSpan(void 0, `AL ${monster.alignment}`);
    const tooltip = getAlignmentLabel(monster.alignment);
    if (tooltip) {
      alignmentSpan.title = tooltip;
    }
    metaParts.push(alignmentSpan);
  }
  metaParts.forEach((part, index) => {
    meta.appendChild(part);
    if (index < metaParts.length - 1) {
      meta.appendChild(createSpan(void 0, " \u2022 "));
    }
  });
  header.appendChild(meta);
  card.appendChild(header);
  const core = createDiv("sd-monster-core");
  core.appendChild(createDiv("sd-monster-core-item", `AC ${monster.ac}`));
  core.appendChild(createDiv("sd-monster-core-item", `HP ${monster.hp}`));
  if (monster.mv) {
    core.appendChild(createDiv("sd-monster-core-item", `MV ${monster.mv}`));
  }
  card.appendChild(core);
  if (monster.atk.length > 0) {
    const atkSection = createDiv("sd-monster-section");
    atkSection.appendChild(createDiv("sd-monster-section-title", "ATTACKS"));
    const atkList = createList("sd-monster-attacks");
    for (const attack of monster.atk) {
      const li = createListItem("sd-monster-attack");
      appendRenderedAttack(li, renderAttackText(attack), settings, options);
      atkList.appendChild(li);
    }
    atkSection.appendChild(atkList);
    card.appendChild(atkSection);
  }
  const abilities = createDiv("sd-monster-section");
  abilities.appendChild(createDiv("sd-monster-section-title", "ABILITIES"));
  const grid = createDiv("sd-monster-abilities");
  grid.appendChild(createDiv("sd-monster-ability", `STR ${monster.stats.str}`));
  grid.appendChild(createDiv("sd-monster-ability", `DEX ${monster.stats.dex}`));
  grid.appendChild(createDiv("sd-monster-ability", `CON ${monster.stats.con}`));
  grid.appendChild(createDiv("sd-monster-ability", `INT ${monster.stats.int}`));
  grid.appendChild(createDiv("sd-monster-ability", `WIS ${monster.stats.wis}`));
  grid.appendChild(createDiv("sd-monster-ability", `CHA ${monster.stats.cha}`));
  abilities.appendChild(grid);
  card.appendChild(abilities);
  addSection(card, "TRAITS", monster.traits, "sd-monster-list", settings, options);
  addSection(card, "SPECIALS", monster.specials, "sd-monster-list", settings, options);
  addSection(card, "SPELLS", monster.spells, "sd-monster-list", settings, options);
  addSection(card, "GEAR", monster.gear, "sd-monster-list", settings, options);
  if (monster.description) {
    const desc = createDiv("sd-monster-section");
    desc.appendChild(createDiv("sd-monster-description", monster.description));
    card.appendChild(desc);
  }
  if (settings.showSource && monster.source) {
    const source = createDiv("sd-monster-footer");
    source.appendChild(createSpan("sd-monster-source", `Source: ${monster.source}`));
    card.appendChild(source);
  }
  if (settings.showTags && monster.tags.length > 0) {
    const tags = createDiv("sd-monster-tags");
    for (const tag of monster.tags) {
      tags.appendChild(createSpan("sd-monster-tag", tag));
    }
    card.appendChild(tags);
  }
  if (warnings.length > 0) {
    const warningBox = createDiv("sd-monster-warning-box");
    for (const warning of warnings) {
      warningBox.appendChild(createDiv("sd-monster-warning", warning));
    }
    card.appendChild(warningBox);
  }
  container.appendChild(card);
}

// src/statblocksCompat/settings.ts
var DEFAULT_STATBLOCK_RENDER_SETTINGS = {
  compactMode: true,
  showSource: true,
  showTags: true,
  enableDiceRollerIntegration: false
};

// src/renderers/EncounterRenderer.ts
var EncounterRenderer = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  register() {
    this.plugin.registerMarkdownPostProcessor(
      (el, ctx) => {
        this.process(el, ctx);
      }
    );
  }
  process(el, ctx) {
    var _a;
    const sectionInfo = ctx.getSectionInfo(el);
    if (!sectionInfo || sectionInfo.lineStart !== 0) {
      return;
    }
    const file = this.plugin.app.vault.getAbstractFileByPath(
      ctx.sourcePath
    );
    if (!(file instanceof import_obsidian4.TFile)) {
      return;
    }
    const cache = this.plugin.app.metadataCache.getFileCache(file);
    const frontmatter = cache == null ? void 0 : cache.frontmatter;
    if ((frontmatter == null ? void 0 : frontmatter.shadowdarkType) !== "encounter") {
      return;
    }
    if (el.querySelector(".sd-encounter-rendered")) {
      return;
    }
    const container = el.createDiv({
      cls: "sd-encounter-rendered"
    });
    container.createEl("h2", {
      text: (_a = frontmatter.name) != null ? _a : file.basename
    });
    container.createEl("p", {
      cls: "sd-encounter-rendered-meta",
      text: [
        frontmatter.partyLevel ? `Party Level ${frontmatter.partyLevel}` : null,
        frontmatter.partySize ? `${frontmatter.partySize} PCs` : null,
        frontmatter.status ? `Status: ${frontmatter.status}` : null
      ].filter(Boolean).join(" \u2022 ")
    });
    this.renderDashboardStats(container, frontmatter);
    this.renderCompactMonsterRoster(container, frontmatter);
  }
  getEncounterDifficulty(frontmatter) {
    var _a, _b;
    const partyLevel = Number((_a = frontmatter.partyLevel) != null ? _a : 1);
    const partySize = Number((_b = frontmatter.partySize) != null ? _b : 4);
    const monsters = Array.isArray(frontmatter.monsters) ? frontmatter.monsters : [];
    const partyPower = partyLevel * partySize;
    const monsterPower = monsters.reduce(
      (sum, monster) => {
        var _a2, _b2;
        const qty = Number((_a2 = monster.qty) != null ? _a2 : 1);
        const level = Number((_b2 = monster.level) != null ? _b2 : 0);
        return sum + qty * level;
      },
      0
    );
    if (monsterPower <= 0) {
      return "None";
    }
    const ratio = monsterPower / partyPower;
    if (ratio < 0.5) {
      return "Easy";
    }
    if (ratio < 0.85) {
      return "Standard";
    }
    if (ratio < 1.25) {
      return "Hard";
    }
    return "Deadly";
  }
  renderDashboardStats(container, frontmatter) {
    var _a;
    const monsters = Array.isArray(frontmatter.monsters) ? frontmatter.monsters : [];
    const totalMonsters = monsters.reduce(
      (sum, monster) => {
        var _a2;
        return sum + Number((_a2 = monster.qty) != null ? _a2 : 1);
      },
      0
    );
    const uniqueMonsters = monsters.length;
    let totalLevels = 0;
    let countedMonsters = 0;
    for (const monster of monsters) {
      const level = Number(monster.level);
      if (!Number.isNaN(level)) {
        const qty = Number((_a = monster.qty) != null ? _a : 1);
        totalLevels += level * qty;
        countedMonsters += qty;
      }
    }
    const averageLevel = countedMonsters > 0 ? totalLevels / countedMonsters : 0;
    const difficulty = this.getEncounterDifficulty(frontmatter);
    container.createEl("p", {
      cls: "sd-encounter-rendered-stats",
      text: `${totalMonsters} Monsters \u2022 ${uniqueMonsters} Unique \u2022 Avg Lv ${averageLevel.toFixed(1)} \u2022 ${difficulty}`
    });
  }
  renderCompactMonsterRoster(container, frontmatter) {
    var _a, _b;
    const monsters = Array.isArray(frontmatter.monsters) ? frontmatter.monsters : [];
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
      const qty = (_a = monster.qty) != null ? _a : 1;
      const name = (_b = monster.name) != null ? _b : "Unknown Monster";
      const meta = [
        monster.level ? `LV ${monster.level}` : null,
        monster.ac ? `AC ${monster.ac}` : null,
        monster.hp ? `HP ${monster.hp}` : null
      ].filter(Boolean).join(" \u2022 ");
      const pillEl = rosterEl.createEl("button", {
        cls: "sd-encounter-rendered-monster",
        text: meta ? `${qty}x ${name} \u2022 ${meta}` : `${qty}x ${name}`
      });
      pillEl.addEventListener("click", (event) => {
        this.showMonsterPillMenu(event, monster);
      });
    }
  }
  showMonsterPillMenu(event, monster) {
    var _a;
    const path = monster.path;
    const name = (_a = monster.name) != null ? _a : "Unknown Monster";
    const menu = new import_obsidian4.Menu();
    menu.addItem((item) => {
      item.setTitle(`Open ${name}`).onClick(async () => {
        await this.openMonster(path, "current");
      });
    });
    menu.addItem((item) => {
      item.setTitle("Open in New Tab").onClick(async () => {
        await this.openMonster(path, "new-tab");
      });
    });
    menu.addItem((item) => {
      item.setTitle("Open to the Right").onClick(async () => {
        await this.openMonster(path, "right");
      });
    });
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle("Preview Statblock").onClick(async () => {
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
        ].filter(Boolean).join(" \u2022 ") || "No stats available"
      );
      item.setDisabled(true);
    });
    menu.showAtMouseEvent(event);
  }
  async openMonster(path, mode) {
    if (typeof path !== "string" || path.length === 0) {
      new import_obsidian4.Notice("Monster file not found.");
      return;
    }
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian4.TFile)) {
      new import_obsidian4.Notice("Monster file not found.");
      return;
    }
    if (mode === "right") {
      await this.plugin.app.workspace.getLeaf("split", "vertical").openFile(file);
      return;
    }
    if (mode === "new-tab") {
      await this.plugin.app.workspace.getLeaf(true).openFile(file);
      return;
    }
    await this.plugin.app.workspace.getLeaf(false).openFile(file);
  }
  async showMonsterStatblockPreview(monster) {
    const path = monster.path;
    if (typeof path !== "string" || path.length === 0) {
      new import_obsidian4.Notice("Monster file not found.");
      return;
    }
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian4.TFile)) {
      new import_obsidian4.Notice("Monster file not found.");
      return;
    }
    const cache = this.plugin.app.metadataCache.getFileCache(file);
    const frontmatter = cache == null ? void 0 : cache.frontmatter;
    if (!frontmatter) {
      new import_obsidian4.Notice("Monster has no frontmatter.");
      return;
    }
    const result = parseFrontmatter(frontmatter);
    if (!result.success || !result.data) {
      new import_obsidian4.Notice("Could not parse monster.");
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
      text: "\xD7"
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
};

// src/main.ts
var ShadowdarkEncountersPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    this.api = {
      getAllMonsters: () => this.monsterIndex.getAllMonsters()
    };
  }
  async onload() {
    console.log("Loading Shadowdark Encounters");
    this.monsterIndex = new MonsterIndex(this.app);
    this.encounterService = new EncounterService(this.app);
    this.encounterRenderer = new EncounterRenderer(this);
    this.encounterRenderer.register();
    this.addCommand({
      id: "create-shadowdark-encounter",
      name: "Create Shadowdark Encounter",
      callback: () => {
        new CreateEncounterModal(
          this.app,
          this.monsterIndex,
          this.encounterService
        ).open();
      }
    });
    this.addCommand({
      id: "edit-shadowdark-encounter",
      name: "Edit Current Shadowdark Encounter",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          return false;
        }
        const cache = this.app.metadataCache.getFileCache(file);
        const frontmatter = cache == null ? void 0 : cache.frontmatter;
        if ((frontmatter == null ? void 0 : frontmatter.shadowdarkType) !== "encounter") {
          return false;
        }
        if (!checking) {
          new CreateEncounterModal(
            this.app,
            this.monsterIndex,
            this.encounterService,
            file
          ).open();
        }
        return true;
      }
    });
  }
  onunload() {
    console.log("Unloading Shadowdark Encounters");
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL2NvbnN0YW50cy9wbHVnaW4udHMiLCAic3JjL3NlcnZpY2VzL01vbnN0ZXJJbmRleC50cyIsICJzcmMvc2VydmljZXMvRW5jb3VudGVyU2VydmljZS50cyIsICJzcmMvdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlLnRzIiwgInNyYy9tb2RhbHMvQ3JlYXRlRW5jb3VudGVyTW9kYWwudHMiLCAic3JjL2NvbXBvbmVudHMvTW9uc3RlclByZXZpZXdQb3BvdmVyLnRzIiwgInNyYy9yZW5kZXJlcnMvRW5jb3VudGVyUmVuZGVyZXIudHMiLCAic3JjL3N0YXRibG9ja3NDb21wYXQvbm9ybWFsaXplTW9uc3Rlci50cyIsICJzcmMvc3RhdGJsb2Nrc0NvbXBhdC9wYXJzZUZyb250TWF0dGVyLnRzIiwgInNyYy9zdGF0YmxvY2tzQ29tcGF0L3JlbmRlck1vbnN0ZXJCbG9jay50cyIsICJzcmMvc3RhdGJsb2Nrc0NvbXBhdC9zZXR0aW5ncy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgTm90aWNlLCBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgTW9uc3RlckluZGV4IH0gZnJvbSBcIi4vc2VydmljZXMvTW9uc3RlckluZGV4XCI7XG5pbXBvcnQgeyBFbmNvdW50ZXJTZXJ2aWNlIH0gZnJvbSBcIi4vc2VydmljZXMvRW5jb3VudGVyU2VydmljZVwiO1xuaW1wb3J0IHsgQ3JlYXRlRW5jb3VudGVyTW9kYWwgfSBmcm9tIFwiLi9tb2RhbHMvQ3JlYXRlRW5jb3VudGVyTW9kYWxcIjtcblxuaW1wb3J0IHsgRW5jb3VudGVyUmVuZGVyZXIgfSBmcm9tIFwiLi9yZW5kZXJlcnMvRW5jb3VudGVyUmVuZGVyZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXG4gIG1vbnN0ZXJJbmRleCE6IE1vbnN0ZXJJbmRleDtcblxuICBlbmNvdW50ZXJTZXJ2aWNlITogRW5jb3VudGVyU2VydmljZTtcblxuICBlbmNvdW50ZXJSZW5kZXJlciE6IEVuY291bnRlclJlbmRlcmVyO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgIGNvbnNvbGUubG9nKFwiTG9hZGluZyBTaGFkb3dkYXJrIEVuY291bnRlcnNcIik7XG5cbiAgICB0aGlzLm1vbnN0ZXJJbmRleCA9XG4gICAgICBuZXcgTW9uc3RlckluZGV4KHRoaXMuYXBwKTtcblxuICAgIHRoaXMuZW5jb3VudGVyU2VydmljZSA9XG4gICAgICBuZXcgRW5jb3VudGVyU2VydmljZSh0aGlzLmFwcCk7XG5cbiAgICB0aGlzLmVuY291bnRlclJlbmRlcmVyID0gbmV3IEVuY291bnRlclJlbmRlcmVyKHRoaXMpO1xuICAgIHRoaXMuZW5jb3VudGVyUmVuZGVyZXIucmVnaXN0ZXIoKTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJjcmVhdGUtc2hhZG93ZGFyay1lbmNvdW50ZXJcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlIFNoYWRvd2RhcmsgRW5jb3VudGVyXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICBuZXcgQ3JlYXRlRW5jb3VudGVyTW9kYWwoXG4gICAgICAgIHRoaXMuYXBwLFxuICAgICAgICB0aGlzLm1vbnN0ZXJJbmRleCxcbiAgICAgICAgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlXG4gICAgICApLm9wZW4oKTtcbiAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImVkaXQtc2hhZG93ZGFyay1lbmNvdW50ZXJcIixcbiAgICAgIG5hbWU6IFwiRWRpdCBDdXJyZW50IFNoYWRvd2RhcmsgRW5jb3VudGVyXCIsXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG5cbiAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICAgICAgY29uc3QgZnJvbnRtYXR0ZXIgPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG5cbiAgICAgICAgaWYgKGZyb250bWF0dGVyPy5zaGFkb3dkYXJrVHlwZSAhPT0gXCJlbmNvdW50ZXJcIikge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY2hlY2tpbmcpIHtcbiAgICAgICAgICBuZXcgQ3JlYXRlRW5jb3VudGVyTW9kYWwoXG4gICAgICAgICAgICB0aGlzLmFwcCxcbiAgICAgICAgICAgIHRoaXMubW9uc3RlckluZGV4LFxuICAgICAgICAgICAgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlLFxuICAgICAgICAgICAgZmlsZVxuICAgICAgICAgICkub3BlbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYXBpID0ge1xuICAgIGdldEFsbE1vbnN0ZXJzOiAoKSA9PlxuICAgICAgICB0aGlzLm1vbnN0ZXJJbmRleC5nZXRBbGxNb25zdGVycygpXG4gICAgfTtcblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICBjb25zb2xlLmxvZyhcIlVubG9hZGluZyBTaGFkb3dkYXJrIEVuY291bnRlcnNcIik7XG4gIH1cbn0iLCAiZXhwb3J0IGNvbnN0IFBMVUdJTl9JRCA9IFwic2hhZG93ZGFyay1lbmNvdW50ZXJzXCI7XG5cbmV4cG9ydCBjb25zdCBFTkNPVU5URVJfVFlQRSA9IFwiZW5jb3VudGVyXCI7XG5cbmV4cG9ydCBjb25zdCBNT05TVEVSX1RZUEUgPSBcIm1vbnN0ZXJcIjsiLCAiaW1wb3J0IHsgQXBwLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgTU9OU1RFUl9UWVBFIH0gZnJvbSBcIi4uL2NvbnN0YW50cy9wbHVnaW5cIjtcbmltcG9ydCB7IE1vbnN0ZXJTdW1tYXJ5IH0gZnJvbSBcIi4uL3R5cGVzL2VuY291bnRlcnNcIjtcblxuZXhwb3J0IGNsYXNzIE1vbnN0ZXJJbmRleCB7XG4gIGFwcDogQXBwO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gIH1cblxuICBzZWFyY2hNb25zdGVycyhxdWVyeTogc3RyaW5nKTogTW9uc3RlclN1bW1hcnlbXSB7XG4gICAgY29uc3QgbG93ZXIgPSBxdWVyeS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuICAgIGlmICghbG93ZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QWxsTW9uc3RlcnMoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5nZXRBbGxNb25zdGVycygpLmZpbHRlcigobW9uc3RlcikgPT5cbiAgICAgICAgbW9uc3Rlci5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMobG93ZXIpXG4gICAgKTtcbn1cblxuICBnZXRBbGxNb25zdGVycygpOiBNb25zdGVyU3VtbWFyeVtdIHtcbiAgICBjb25zdCBmaWxlcyA9IHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcblxuICAgIGNvbnN0IG1vbnN0ZXJzOiBNb25zdGVyU3VtbWFyeVtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgIGNvbnN0IG1vbnN0ZXIgPSB0aGlzLmdldE1vbnN0ZXJGcm9tRmlsZShmaWxlKTtcblxuICAgICAgaWYgKG1vbnN0ZXIpIHtcbiAgICAgICAgbW9uc3RlcnMucHVzaChtb25zdGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbW9uc3RlcnMuc29ydCgoYSwgYikgPT5cbiAgICAgIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSlcbiAgICApO1xuICB9XG5cbiAgZ2V0TW9uc3RlckZyb21GaWxlKGZpbGU6IFRGaWxlKTogTW9uc3RlclN1bW1hcnkgfCBudWxsIHtcbiAgICBjb25zdCBjYWNoZSA9XG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcblxuICAgIGNvbnN0IGZyb250bWF0dGVyID0gY2FjaGU/LmZyb250bWF0dGVyO1xuXG4gICAgaWYgKCFmcm9udG1hdHRlcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGZyb250bWF0dGVyLnNoYWRvd2RhcmtUeXBlICE9PSBNT05TVEVSX1RZUEUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBmcm9udG1hdHRlci5uYW1lIHx8IGZpbGUuYmFzZW5hbWUsXG4gICAgICBwYXRoOiBmaWxlLnBhdGgsXG5cbiAgICAgIGxldmVsOiBmcm9udG1hdHRlci5sZXZlbCxcbiAgICAgIGFjOiBmcm9udG1hdHRlci5hYyxcbiAgICAgIGhwOiBmcm9udG1hdHRlci5ocCxcblxuICAgICAgYXRrOiBBcnJheS5pc0FycmF5KGZyb250bWF0dGVyLmF0aylcbiAgICAgICAgICA/IGZyb250bWF0dGVyLmF0a1swXVxuICAgICAgICAgIDogZnJvbnRtYXR0ZXIuYXRrLFxuXG4gICAgICB0cmFpdHM6IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIudHJhaXRzKVxuICAgICAgICAgID8gZnJvbnRtYXR0ZXIudHJhaXRzLnNsaWNlKDAsIDIpXG4gICAgICAgICAgOiBbXSxcblxuICAgICAgdGFnczogZnJvbnRtYXR0ZXIudGFncyB8fCBbXVxuICAgIH07XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBub3JtYWxpemVQYXRoLCBURmlsZSwgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBFbmNvdW50ZXJEYXRhIH0gZnJvbSBcIi4uL3R5cGVzL2VuY291bnRlcnNcIjtcbmltcG9ydCB7IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24gfSBmcm9tIFwiLi4vdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBFbmNvdW50ZXJTZXJ2aWNlIHtcbiAgYXBwOiBBcHA7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUVuY291bnRlck5vdGUoZW5jb3VudGVyOiBFbmNvdW50ZXJEYXRhKSB7XG4gICAgY29uc3QgY29udGVudCA9IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24oZW5jb3VudGVyKTtcblxuICAgIGNvbnN0IHNhZmVOYW1lID0gZW5jb3VudGVyLm5hbWVcbiAgICAgIC5yZXBsYWNlKC9bXFxcXC86Kj9cIjw+fF0vZywgXCJcIilcbiAgICAgIC50cmltKCk7XG5cbiAgICBjb25zdCBmb2xkZXJQYXRoID0gXCJFbmNvdW50ZXJzXCI7XG4gICAgY29uc3QgZmlsZVBhdGggPSBub3JtYWxpemVQYXRoKGAke2ZvbGRlclBhdGh9LyR7c2FmZU5hbWV9Lm1kYCk7XG5cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihmb2xkZXJQYXRoKTtcblxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUoZmlsZVBhdGgsIGNvbnRlbnQpO1xuXG4gICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUoZmlsZSk7XG5cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlcihwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcblxuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIocGF0aCk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVFbmNvdW50ZXJOb3RlKFxuICAgIGZpbGU6IFRGaWxlLFxuICAgIGVuY291bnRlcjogRW5jb3VudGVyRGF0YVxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjb250ZW50ID0gZ2VuZXJhdGVFbmNvdW50ZXJNYXJrZG93bihlbmNvdW50ZXIpO1xuXG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGNvbnRlbnQpO1xuICB9XG5cbn0iLCAiaW1wb3J0IHsgRW5jb3VudGVyRGF0YSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmZ1bmN0aW9uIHlhbWxTdHJpbmcodmFsdWU6IHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSA/PyBcIlwiKTtcbn1cblxuZnVuY3Rpb24gc2VjdGlvbih0aXRsZTogc3RyaW5nLCBjb250ZW50Pzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAjIyAke3RpdGxlfVxuXG4ke2NvbnRlbnQ/LnRyaW0oKSB8fCBcIlwifVxuYDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24oXG4gIGVuY291bnRlcjogRW5jb3VudGVyRGF0YVxuKTogc3RyaW5nIHtcbiAgY29uc3QgbW9uc3RlckZyb250bWF0dGVyID0gZW5jb3VudGVyLm1vbnN0ZXJzXG4gICAgLm1hcCgobW9uc3RlcikgPT4ge1xuICAgICAgcmV0dXJuIGAgIC0gbmFtZTogJHt5YW1sU3RyaW5nKG1vbnN0ZXIubmFtZSl9XG4gICAgcXR5OiAke21vbnN0ZXIucXR5fVxuICAgIHBhdGg6ICR7eWFtbFN0cmluZyhtb25zdGVyLnBhdGgpfVxuICAgIGxldmVsOiAke3lhbWxTdHJpbmcobW9uc3Rlci5sZXZlbCl9XG4gICAgYWM6ICR7eWFtbFN0cmluZyhtb25zdGVyLmFjKX1cbiAgICBocDogJHt5YW1sU3RyaW5nKG1vbnN0ZXIuaHApfWA7XG4gICAgfSlcbiAgICAuam9pbihcIlxcblwiKTtcblxuICByZXR1cm4gYC0tLVxuc2hhZG93ZGFya1R5cGU6IGVuY291bnRlclxubmFtZTogJHt5YW1sU3RyaW5nKGVuY291bnRlci5uYW1lKX1cbnN0YXR1czogcGxhbm5lZFxuXG5wYXJ0eUxldmVsOiAke2VuY291bnRlci5wYXJ0eUxldmVsID8/IDF9XG5wYXJ0eVNpemU6ICR7ZW5jb3VudGVyLnBhcnR5U2l6ZSA/PyA0fVxuXG50ZXJyYWluOiAke3lhbWxTdHJpbmcoZW5jb3VudGVyLnRlcnJhaW4pfVxubGlnaHQ6ICR7eWFtbFN0cmluZyhlbmNvdW50ZXIubGlnaHQpfVxuXG5tb25zdGVyczpcbiR7bW9uc3RlckZyb250bWF0dGVyIHx8IFwiICBbXVwifVxuXG50YWdzOlxuICAtIHNoYWRvd2RhcmsvZW5jb3VudGVyXG4tLS1cblxuJHtzZWN0aW9uKFwiU2V0dXBcIiwgZW5jb3VudGVyLnNldHVwKX1cbiR7c2VjdGlvbihcIlJlYWQtQWxvdWRcIiwgZW5jb3VudGVyLnJlYWRBbG91ZCl9XG4ke3NlY3Rpb24oXCJUYWN0aWNzXCIsIGVuY291bnRlci50YWN0aWNzKX1cbiR7c2VjdGlvbihcIlRyZWFzdXJlXCIsIGVuY291bnRlci50cmVhc3VyZSl9XG4ke3NlY3Rpb24oXCJOb3Rlc1wiLCBlbmNvdW50ZXIubm90ZXMpfVxuYDtcbn0iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBTZXR0aW5nLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBzaG93TW9uc3RlclByZXZpZXcgfSBmcm9tIFwiLi4vY29tcG9uZW50cy9Nb25zdGVyUHJldmlld1BvcG92ZXJcIjtcbmltcG9ydCB7IEVuY291bnRlclNlcnZpY2UgfSBmcm9tIFwiLi4vc2VydmljZXMvRW5jb3VudGVyU2VydmljZVwiO1xuaW1wb3J0IHsgTW9uc3RlckluZGV4IH0gZnJvbSBcIi4uL3NlcnZpY2VzL01vbnN0ZXJJbmRleFwiO1xuaW1wb3J0IHsgZ2VuZXJhdGVFbmNvdW50ZXJNYXJrZG93biB9IGZyb20gXCIuLi90ZW1wbGF0ZXMvZW5jb3VudGVyVGVtcGxhdGVcIjtcbmltcG9ydCB7IEVuY291bnRlckRhdGEsIE1vbnN0ZXJSZWZlcmVuY2UsIE1vbnN0ZXJTdW1tYXJ5IH0gZnJvbSBcIi4uL3R5cGVzL2VuY291bnRlcnNcIjtcblxudHlwZSBFbmNvdW50ZXJXaXphcmRTdGVwID0gXCJtb25zdGVyc1wiIHwgXCJkZXRhaWxzXCIgfCBcInByZXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIENyZWF0ZUVuY291bnRlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBtb25zdGVySW5kZXg6IE1vbnN0ZXJJbmRleDtcbiAgZW5jb3VudGVyU2VydmljZTogRW5jb3VudGVyU2VydmljZTtcblxuICBjdXJyZW50U3RlcDogRW5jb3VudGVyV2l6YXJkU3RlcCA9IFwibW9uc3RlcnNcIjtcblxuICBlbmNvdW50ZXJOYW1lID0gXCJcIjtcblxuICBzZWxlY3RlZE1vbnN0ZXJzOiBNb25zdGVyUmVmZXJlbmNlW10gPSBbXTtcblxuICBtb25zdGVyU2VhcmNoID0gXCJcIjtcbiAgbGV2ZWxGaWx0ZXIgPSBcIlwiO1xuICB0YWdGaWx0ZXIgPSBcIlwiO1xuICBzb3J0TW9kZSA9IFwibmFtZS1hc2NcIjtcblxuICBwYXJ0eUxldmVsID0gMTtcbiAgcGFydHlTaXplID0gNDtcblxuICBzZXR1cCA9IFwiXCI7XG4gIHJlYWRBbG91ZCA9IFwiXCI7XG4gIHRhY3RpY3MgPSBcIlwiO1xuICB0cmVhc3VyZSA9IFwiXCI7XG4gIG5vdGVzID0gXCJcIjtcblxuICBwcml2YXRlIGZpbGVUb0VkaXQ/OiBURmlsZTtcblxuICBwcml2YXRlIGdldCBpc0VkaXRpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5maWxlVG9FZGl0O1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgbW9uc3RlckluZGV4OiBNb25zdGVySW5kZXgsXG4gICAgZW5jb3VudGVyU2VydmljZTogRW5jb3VudGVyU2VydmljZSxcbiAgICBmaWxlVG9FZGl0PzogVEZpbGVcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcblxuICAgIHRoaXMubW9uc3RlckluZGV4ID0gbW9uc3RlckluZGV4O1xuICAgIHRoaXMuZW5jb3VudGVyU2VydmljZSA9IGVuY291bnRlclNlcnZpY2U7XG4gICAgdGhpcy5maWxlVG9FZGl0ID0gZmlsZVRvRWRpdDtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLm1vZGFsRWwuYWRkQ2xhc3MoXCJzZC1lbmNvdW50ZXItbW9kYWxcIik7XG5cbiAgICBpZiAodGhpcy5maWxlVG9FZGl0KSB7XG4gICAgICBhd2FpdCB0aGlzLmxvYWRFbmNvdW50ZXJGcm9tRmlsZSh0aGlzLmZpbGVUb0VkaXQpO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICByZW5kZXIoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG5cbiAgICBjb250ZW50RWwuZW1wdHkoKTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHtcbiAgICB0ZXh0OiB0aGlzLmlzRWRpdGluZ1xuICAgICAgPyBcIkVkaXQgU2hhZG93ZGFyayBFbmNvdW50ZXJcIlxuICAgICAgOiBcIkNyZWF0ZSBTaGFkb3dkYXJrIEVuY291bnRlclwiXG4gIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJTdGVwSW5kaWNhdG9yKGNvbnRlbnRFbCk7XG5cbiAgICBpZiAodGhpcy5jdXJyZW50U3RlcCA9PT0gXCJtb25zdGVyc1wiKSB7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJTdGVwKGNvbnRlbnRFbCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY3VycmVudFN0ZXAgPT09IFwiZGV0YWlsc1wiKSB7XG4gICAgICB0aGlzLnJlbmRlckRldGFpbHNTdGVwKGNvbnRlbnRFbCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZW5kZXJQcmV2aWV3U3RlcChjb250ZW50RWwpO1xuICB9XG5cbiAgcmVuZGVyU3RlcEluZGljYXRvcihjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zdGVwLWluZGljYXRvclwiLFxuICAgICAgdGV4dDpcbiAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9PT0gXCJtb25zdGVyc1wiXG4gICAgICAgICAgPyBcIlN0ZXAgMSBvZiAzOiBBZGQgTW9uc3RlcnNcIlxuICAgICAgICAgIDogdGhpcy5jdXJyZW50U3RlcCA9PT0gXCJkZXRhaWxzXCJcbiAgICAgICAgICAgID8gXCJTdGVwIDIgb2YgMzogQWRkIERldGFpbHNcIlxuICAgICAgICAgICAgOiBcIlN0ZXAgMyBvZiAzOiBQcmV2aWV3XCJcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlck1vbnN0ZXJTdGVwKGNvbnRlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkVuY291bnRlciBuYW1lXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiR29ibGluIEFtYnVzaFwiKTtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZSh0aGlzLmVuY291bnRlck5hbWUpO1xuXG4gICAgICAgIHRleHQub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5lbmNvdW50ZXJOYW1lID0gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBjb25zdCBidWlsZGVyRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItYnVpbGRlclwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBicm93c2VyRWwgPSBidWlsZGVyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItYnJvd3NlclwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBkcmFmdEVsID0gYnVpbGRlckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRyYWZ0XCJcbiAgICB9KTtcblxuICAgIGJyb3dzZXJFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IFwiTW9uc3RlciBCcm93c2VyXCJcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyRmlsdGVyUm93KGJyb3dzZXJFbCk7XG5cbiAgICBjb25zdCByZXN1bHRzRWwgPSBicm93c2VyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItbW9uc3Rlci1yZXN1bHRzXCJcbiAgICB9KTtcblxuICAgIHJlc3VsdHNFbC5kYXRhc2V0LnJvbGUgPSBcIm1vbnN0ZXItcmVzdWx0c1wiO1xuXG4gICAgZHJhZnRFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IFwiRW5jb3VudGVyIERyYWZ0XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlbGVjdGVkRWwgPSBkcmFmdEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXNlbGVjdGVkLW1vbnN0ZXJzXCJcbiAgICB9KTtcblxuICAgIHNlbGVjdGVkRWwuZGF0YXNldC5yb2xlID0gXCJzZWxlY3RlZC1tb25zdGVyc1wiO1xuXG4gICAgY29uc3Qgc3VtbWFyeUVsID0gZHJhZnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zdW1tYXJ5XCJcbiAgICB9KTtcblxuICAgIHN1bW1hcnlFbC5kYXRhc2V0LnJvbGUgPSBcImVuY291bnRlci1zdW1tYXJ5XCI7XG5cbiAgICBjb25zdCBidXR0b25FbCA9IGRyYWZ0RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItY3JlYXRlLWJ1dHRvblwiXG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhidXR0b25FbClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT4ge1xuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIk5leHRcIilcbiAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZW5jb3VudGVyTmFtZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBuYW1lIGlzIHJlcXVpcmVkLlwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gXCJkZXRhaWxzXCI7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgdGhpcy5yZW5kZXJTZWxlY3RlZE1vbnN0ZXJzKCk7XG4gICAgdGhpcy5yZW5kZXJFbmNvdW50ZXJTdW1tYXJ5KCk7XG4gIH1cblxuICByZW5kZXJGaWx0ZXJSb3coYnJvd3NlckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IGZpbHRlclJvdyA9IGJyb3dzZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1maWx0ZXItcm93XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlYXJjaEZpZWxkID0gZmlsdGVyUm93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBzZWFyY2hGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiU2VhcmNoXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlYXJjaElucHV0ID0gc2VhcmNoRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlNlYXJjaCBtb25zdGVycy4uLlwiXG4gICAgfSk7XG5cbiAgICBzZWFyY2hJbnB1dC52YWx1ZSA9IHRoaXMubW9uc3RlclNlYXJjaDtcblxuICAgIHNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLm1vbnN0ZXJTZWFyY2ggPSBzZWFyY2hJbnB1dC52YWx1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9uc3RlclJlc3VsdHMoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGxldmVsRmllbGQgPSBmaWx0ZXJSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZmlsdGVyLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIGxldmVsRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIkxldmVsXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGxldmVsU2VsZWN0ID0gbGV2ZWxGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiKTtcblxuICAgIGxldmVsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiQW55XCIsXG4gICAgICB2YWx1ZTogXCJcIlxuICAgIH0pO1xuXG4gICAgZm9yIChsZXQgbGV2ZWwgPSAwOyBsZXZlbCA8PSAxMDsgbGV2ZWwrKykge1xuICAgICAgbGV2ZWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgICB0ZXh0OiBTdHJpbmcobGV2ZWwpLFxuICAgICAgICB2YWx1ZTogU3RyaW5nKGxldmVsKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbGV2ZWxTZWxlY3QudmFsdWUgPSB0aGlzLmxldmVsRmlsdGVyO1xuXG4gICAgbGV2ZWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmxldmVsRmlsdGVyID0gbGV2ZWxTZWxlY3QudmFsdWU7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0YWdGaWVsZCA9IGZpbHRlclJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1maWx0ZXItZmllbGRcIlxuICAgIH0pO1xuXG4gICAgdGFnRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIlRhZ1wiXG4gICAgfSk7XG5cbiAgICBjb25zdCB0YWdTZWxlY3QgPSB0YWdGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiKTtcblxuICAgIHRhZ1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIkFueVwiLFxuICAgICAgdmFsdWU6IFwiXCJcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgdGFnIG9mIHRoaXMuZ2V0QXZhaWxhYmxlVGFncygpKSB7XG4gICAgICB0YWdTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgICB0ZXh0OiB0YWcsXG4gICAgICAgIHZhbHVlOiB0YWdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRhZ1NlbGVjdC52YWx1ZSA9IHRoaXMudGFnRmlsdGVyO1xuXG4gICAgdGFnU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgdGhpcy50YWdGaWx0ZXIgPSB0YWdTZWxlY3QudmFsdWU7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3J0RmllbGQgPSBmaWx0ZXJSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZmlsdGVyLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIHNvcnRGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiU29ydFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3J0U2VsZWN0ID0gc29ydEZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuXG4gICAgc29ydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIk5hbWUgQS1aXCIsXG4gICAgICB2YWx1ZTogXCJuYW1lLWFzY1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTmFtZSBaLUFcIixcbiAgICAgIHZhbHVlOiBcIm5hbWUtZGVzY1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTGV2ZWwgTG93LUhpZ2hcIixcbiAgICAgIHZhbHVlOiBcImxldmVsLWFzY1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTGV2ZWwgSGlnaC1Mb3dcIixcbiAgICAgIHZhbHVlOiBcImxldmVsLWRlc2NcIlxuICAgIH0pO1xuXG4gICAgc29ydFNlbGVjdC52YWx1ZSA9IHRoaXMuc29ydE1vZGU7XG5cbiAgICBzb3J0U2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5zb3J0TW9kZSA9IHNvcnRTZWxlY3QudmFsdWU7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJEZXRhaWxzU3RlcChjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgZGV0YWlsc0VsID0gY29udGVudEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRldGFpbHMtc3RlcFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBwYXJ0eVJvdyA9IGRldGFpbHNFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1wYXJ0eS1yb3dcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgbGV2ZWxGaWVsZCA9IHBhcnR5Um93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXBhcnR5LWZpZWxkXCJcbiAgICB9KTtcblxuICAgIGxldmVsRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIlBhcnR5IExldmVsXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGxldmVsSW5wdXQgPSBsZXZlbEZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJudW1iZXJcIlxuICAgIH0pO1xuXG4gICAgbGV2ZWxJbnB1dC52YWx1ZSA9IFN0cmluZyh0aGlzLnBhcnR5TGV2ZWwpO1xuXG4gICAgbGV2ZWxJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlcihsZXZlbElucHV0LnZhbHVlKTtcblxuICAgICAgdGhpcy5wYXJ0eUxldmVsID1cbiAgICAgICAgTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgJiYgcGFyc2VkID4gMFxuICAgICAgICAgID8gTWF0aC5mbG9vcihwYXJzZWQpXG4gICAgICAgICAgOiAxO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgc2l6ZUZpZWxkID0gcGFydHlSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcGFydHktZmllbGRcIlxuICAgIH0pO1xuXG4gICAgc2l6ZUZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJQYXJ0eSBTaXplXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNpemVJbnB1dCA9IHNpemVGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwibnVtYmVyXCJcbiAgICB9KTtcblxuICAgIHNpemVJbnB1dC52YWx1ZSA9IFN0cmluZyh0aGlzLnBhcnR5U2l6ZSk7XG5cbiAgICBzaXplSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIoc2l6ZUlucHV0LnZhbHVlKTtcblxuICAgICAgdGhpcy5wYXJ0eVNpemUgPVxuICAgICAgICBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPiAwXG4gICAgICAgICAgPyBNYXRoLmZsb29yKHBhcnNlZClcbiAgICAgICAgICA6IDQ7XG4gICAgfSk7XG5cbiAgICBkZXRhaWxzRWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQWRkIG9wdGlvbmFsIEdNLWZhY2luZyBkZXRhaWxzIGZvciB0aGlzIGVuY291bnRlci5cIlxuICAgIH0pO1xuXG4gICAgY29uc3QgZGV0YWlsc0dyaWQgPSBkZXRhaWxzRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZGV0YWlscy1ncmlkXCJcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkVGV4dEFyZWFGaWVsZChkZXRhaWxzR3JpZCwgXCJTZXR1cFwiLCB0aGlzLnNldHVwLCAodmFsdWUpID0+IHtcbiAgICAgIHRoaXMuc2V0dXAgPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkVGV4dEFyZWFGaWVsZChkZXRhaWxzR3JpZCwgXCJSZWFkLUFsb3VkXCIsIHRoaXMucmVhZEFsb3VkLCAodmFsdWUpID0+IHtcbiAgICAgIHRoaXMucmVhZEFsb3VkID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFRleHRBcmVhRmllbGQoZGV0YWlsc0dyaWQsIFwiVGFjdGljc1wiLCB0aGlzLnRhY3RpY3MsICh2YWx1ZSkgPT4ge1xuICAgICAgdGhpcy50YWN0aWNzID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFRleHRBcmVhRmllbGQoZGV0YWlsc0dyaWQsIFwiVHJlYXN1cmVcIiwgdGhpcy50cmVhc3VyZSwgKHZhbHVlKSA9PiB7XG4gICAgICB0aGlzLnRyZWFzdXJlID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICBjb25zdCBub3Rlc0ZpZWxkID0gZGV0YWlsc0VsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRldGFpbHMtZmllbGQgc2QtZW5jb3VudGVyLW5vdGVzLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIG5vdGVzRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIk5vdGVzXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IG5vdGVzQXJlYSA9IG5vdGVzRmllbGQuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiKTtcblxuICAgIG5vdGVzQXJlYS52YWx1ZSA9IHRoaXMubm90ZXM7XG4gICAgbm90ZXNBcmVhLnJvd3MgPSA0O1xuXG4gICAgbm90ZXNBcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLm5vdGVzID0gbm90ZXNBcmVhLnZhbHVlO1xuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJGb290ZXJCdXR0b25zKGNvbnRlbnRFbCwgW1xuICAgICAge1xuICAgICAgICBsYWJlbDogXCJCYWNrXCIsXG4gICAgICAgIG9uQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gXCJtb25zdGVyc1wiO1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIlNraXAgRGV0YWlsc1wiLFxuICAgICAgICBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IFwicHJldmlld1wiO1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIlByZXZpZXdcIixcbiAgICAgICAgY3RhOiB0cnVlLFxuICAgICAgICBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IFwicHJldmlld1wiO1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdKTtcbiAgfVxuXG4gIGFkZFRleHRBcmVhRmllbGQoXG4gICAgY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LFxuICAgIGxhYmVsOiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZyxcbiAgICBvbkNoYW5nZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWRcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgZmllbGRFbCA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRldGFpbHMtZmllbGRcIlxuICAgIH0pO1xuXG4gICAgZmllbGRFbC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IGxhYmVsXG4gICAgfSk7XG5cbiAgICBjb25zdCB0ZXh0YXJlYSA9IGZpZWxkRWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiKTtcblxuICAgIHRleHRhcmVhLnZhbHVlID0gdmFsdWU7XG4gICAgdGV4dGFyZWEucm93cyA9IDQ7XG5cbiAgICB0ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgb25DaGFuZ2UodGV4dGFyZWEudmFsdWUpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyUHJldmlld1N0ZXAoY29udGVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IGVuY291bnRlciA9IHRoaXMuZ2V0RW5jb3VudGVyRGF0YSgpO1xuXG4gICAgY29uc3QgcHJldmlld0VsID0gY29udGVudEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXByZXZpZXctc3RlcFwiXG4gICAgfSk7XG5cbiAgICBwcmV2aWV3RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiUHJldmlldyB0aGUgbWFya2Rvd24gdGhhdCB3aWxsIGJlIGNyZWF0ZWQuXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IG1hcmtkb3duUHJldmlldyA9IHByZXZpZXdFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItbWFya2Rvd24tcHJldmlld1wiXG4gICAgfSk7XG5cbiAgICBtYXJrZG93blByZXZpZXcudmFsdWUgPSBnZW5lcmF0ZUVuY291bnRlck1hcmtkb3duKGVuY291bnRlcik7XG4gICAgbWFya2Rvd25QcmV2aWV3LnJlYWRPbmx5ID0gdHJ1ZTtcblxuICAgIHRoaXMucmVuZGVyRm9vdGVyQnV0dG9ucyhjb250ZW50RWwsIFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiQmFja1wiLFxuICAgICAgICBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IFwiZGV0YWlsc1wiO1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiB0aGlzLmlzRWRpdGluZ1xuICAgICAgICAgID8gXCJTYXZlIEVuY291bnRlclwiXG4gICAgICAgICAgOiBcIkNyZWF0ZSBFbmNvdW50ZXJcIixcbiAgICAgICAgY3RhOiB0cnVlLFxuICAgICAgICBvbkNsaWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlRW5jb3VudGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdKTtcbiAgfVxuXG4gIHJlbmRlckZvb3RlckJ1dHRvbnMoXG4gICAgY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LFxuICAgIGJ1dHRvbnM6IHtcbiAgICAgIGxhYmVsOiBzdHJpbmc7XG4gICAgICBjdGE/OiBib29sZWFuO1xuICAgICAgb25DbGljazogKCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gICAgfVtdXG4gICk6IHZvaWQge1xuXG4gICAgY29uc3QgZm9vdGVyRWwgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci13aXphcmQtZm9vdGVyXCJcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgYnV0dG9uQ29uZmlnIG9mIGJ1dHRvbnMpIHtcblxuICAgICAgY29uc3QgYnV0dG9uID0gZm9vdGVyRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICB0ZXh0OiBidXR0b25Db25maWcubGFiZWxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoYnV0dG9uQ29uZmlnLmN0YSkge1xuICAgICAgICBidXR0b24uYWRkQ2xhc3MoXCJtb2QtY3RhXCIpO1xuICAgICAgfVxuXG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCBidXR0b25Db25maWcub25DbGljaygpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RW5jb3VudGVyRGF0YSgpOiBFbmNvdW50ZXJEYXRhIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogdGhpcy5lbmNvdW50ZXJOYW1lLnRyaW0oKSxcbiAgICAgIHBhcnR5TGV2ZWw6IHRoaXMucGFydHlMZXZlbCxcbiAgICAgIHBhcnR5U2l6ZTogdGhpcy5wYXJ0eVNpemUsXG4gICAgICBtb25zdGVyczogdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLFxuICAgICAgc2V0dXA6IHRoaXMuc2V0dXAsXG4gICAgICByZWFkQWxvdWQ6IHRoaXMucmVhZEFsb3VkLFxuICAgICAgdGFjdGljczogdGhpcy50YWN0aWNzLFxuICAgICAgdHJlYXN1cmU6IHRoaXMudHJlYXN1cmUsXG4gICAgICBub3RlczogdGhpcy5ub3Rlc1xuICAgIH07XG4gIH1cblxuICBnZXRBdmFpbGFibGVUYWdzKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCB0YWdTZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiB0aGlzLm1vbnN0ZXJJbmRleC5nZXRBbGxNb25zdGVycygpKSB7XG4gICAgICBmb3IgKGNvbnN0IHRhZyBvZiBtb25zdGVyLnRhZ3MgPz8gW10pIHtcbiAgICAgICAgdGFnU2V0LmFkZChTdHJpbmcodGFnKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFsuLi50YWdTZXRdLnNvcnQoKGEsIGIpID0+IGEubG9jYWxlQ29tcGFyZShiKSk7XG4gIH1cblxuICBzb3J0TW9uc3RlcnMobW9uc3RlcnM6IE1vbnN0ZXJTdW1tYXJ5W10pOiBNb25zdGVyU3VtbWFyeVtdIHtcbiAgICByZXR1cm4gWy4uLm1vbnN0ZXJzXS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICBjb25zdCBhTGV2ZWwgPSBOdW1iZXIoYS5sZXZlbCA/PyA5OTkpO1xuICAgICAgY29uc3QgYkxldmVsID0gTnVtYmVyKGIubGV2ZWwgPz8gOTk5KTtcblxuICAgICAgc3dpdGNoICh0aGlzLnNvcnRNb2RlKSB7XG4gICAgICAgIGNhc2UgXCJuYW1lLWRlc2NcIjpcbiAgICAgICAgICByZXR1cm4gYi5uYW1lLmxvY2FsZUNvbXBhcmUoYS5uYW1lKTtcblxuICAgICAgICBjYXNlIFwibGV2ZWwtYXNjXCI6XG4gICAgICAgICAgcmV0dXJuIGFMZXZlbCAtIGJMZXZlbCB8fCBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuXG4gICAgICAgIGNhc2UgXCJsZXZlbC1kZXNjXCI6XG4gICAgICAgICAgcmV0dXJuIGJMZXZlbCAtIGFMZXZlbCB8fCBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuXG4gICAgICAgIGNhc2UgXCJuYW1lLWFzY1wiOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyTW9uc3RlclJlc3VsdHMoKTogdm9pZCB7XG4gICAgY29uc3QgcmVzdWx0c0VsID0gdGhpcy5jb250ZW50RWwucXVlcnlTZWxlY3RvcihcbiAgICAgICdbZGF0YS1yb2xlPVwibW9uc3Rlci1yZXN1bHRzXCJdJ1xuICAgICk7XG5cbiAgICBpZiAoIShyZXN1bHRzRWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXN1bHRzRWwuZW1wdHkoKTtcblxuICAgIGxldCBtb25zdGVycyA9IHRoaXMubW9uc3RlckluZGV4LnNlYXJjaE1vbnN0ZXJzKHRoaXMubW9uc3RlclNlYXJjaCk7XG5cbiAgICBpZiAodGhpcy5sZXZlbEZpbHRlcikge1xuICAgICAgbW9uc3RlcnMgPSBtb25zdGVycy5maWx0ZXIoKG1vbnN0ZXIpID0+XG4gICAgICAgIFN0cmluZyhtb25zdGVyLmxldmVsID8/IFwiXCIpID09PSB0aGlzLmxldmVsRmlsdGVyXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnRhZ0ZpbHRlcikge1xuICAgICAgbW9uc3RlcnMgPSBtb25zdGVycy5maWx0ZXIoKG1vbnN0ZXIpID0+XG4gICAgICAgIChtb25zdGVyLnRhZ3MgPz8gW10pLmluY2x1ZGVzKHRoaXMudGFnRmlsdGVyKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBtb25zdGVycyA9IHRoaXMuc29ydE1vbnN0ZXJzKG1vbnN0ZXJzKTtcbiAgICBtb25zdGVycyA9IG1vbnN0ZXJzLnNsaWNlKDAsIDEwMCk7XG5cbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgbW9uc3RlcnMpIHtcbiAgICAgIG5ldyBTZXR0aW5nKHJlc3VsdHNFbClcbiAgICAgICAgLnNldE5hbWUobW9uc3Rlci5uYW1lKVxuICAgICAgICAuc2V0RGVzYyhcbiAgICAgICAgICBbXG4gICAgICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgICAgIG1vbnN0ZXIuYWMgPyBgQUMgJHttb25zdGVyLmFjfWAgOiBudWxsLFxuICAgICAgICAgICAgbW9uc3Rlci5ocCA/IGBIUCAke21vbnN0ZXIuaHB9YCA6IG51bGxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIiBcdTIwMjIgXCIpIHx8IG1vbnN0ZXIucGF0aFxuICAgICAgICApXG4gICAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT4ge1xuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJQcmV2aWV3XCIpXG4gICAgICAgICAgICAub25DbGljaygoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgc2hvd01vbnN0ZXJQcmV2aWV3KHRoaXMuYXBwLCBldmVudCwgbW9uc3Rlcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIkFkZFwiKVxuICAgICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuYWRkTW9uc3Rlcihtb25zdGVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZW5kZXJTZWxlY3RlZE1vbnN0ZXJzKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkRWwgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFxuICAgICAgJ1tkYXRhLXJvbGU9XCJzZWxlY3RlZC1tb25zdGVyc1wiXSdcbiAgICApO1xuXG4gICAgaWYgKCEoc2VsZWN0ZWRFbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGVjdGVkRWwuZW1wdHkoKTtcblxuICAgIGlmICh0aGlzLnNlbGVjdGVkTW9uc3RlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBzZWxlY3RlZEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IFwiTm8gbW9uc3RlcnMgc2VsZWN0ZWQgeWV0LlwiXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiB0aGlzLnNlbGVjdGVkTW9uc3RlcnMpIHtcbiAgICAgIG5ldyBTZXR0aW5nKHNlbGVjdGVkRWwpXG4gICAgICAgIC5zZXROYW1lKG1vbnN0ZXIubmFtZSlcbiAgICAgICAgLnNldERlc2MobW9uc3Rlci5wYXRoKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKG1vbnN0ZXIucXR5KSk7XG5cbiAgICAgICAgICB0ZXh0Lm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcXR5ID0gTnVtYmVyKHZhbHVlKTtcblxuICAgICAgICAgICAgbW9uc3Rlci5xdHkgPVxuICAgICAgICAgICAgICBOdW1iZXIuaXNGaW5pdGUocXR5KSAmJiBxdHkgPiAwXG4gICAgICAgICAgICAgICAgPyBNYXRoLmZsb29yKHF0eSlcbiAgICAgICAgICAgICAgICA6IDE7XG5cbiAgICAgICAgICAgIHRoaXMucmVuZGVyRW5jb3VudGVyU3VtbWFyeSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+IHtcbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiUmVtb3ZlXCIpXG4gICAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRNb25zdGVycyA9IHRoaXMuc2VsZWN0ZWRNb25zdGVycy5maWx0ZXIoXG4gICAgICAgICAgICAgICAgKHNlbGVjdGVkKSA9PiBzZWxlY3RlZC5wYXRoICE9PSBtb25zdGVyLnBhdGhcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICB0aGlzLnJlbmRlclNlbGVjdGVkTW9uc3RlcnMoKTtcbiAgICAgICAgICAgICAgdGhpcy5yZW5kZXJFbmNvdW50ZXJTdW1tYXJ5KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmVuZGVyRW5jb3VudGVyU3VtbWFyeSgpOiB2b2lkIHtcbiAgICBjb25zdCBzdW1tYXJ5RWwgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFxuICAgICAgJ1tkYXRhLXJvbGU9XCJlbmNvdW50ZXItc3VtbWFyeVwiXSdcbiAgICApO1xuXG4gICAgaWYgKCEoc3VtbWFyeUVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3VtbWFyeUVsLmVtcHR5KCk7XG5cbiAgICBjb25zdCBzdW1tYXJ5ID0gdGhpcy5nZXRFbmNvdW50ZXJTdW1tYXJ5KCk7XG5cbiAgICBzdW1tYXJ5RWwuY3JlYXRlRWwoXCJoNFwiLCB7XG4gICAgICB0ZXh0OiBcIkVuY291bnRlciBTdW1tYXJ5XCJcbiAgICB9KTtcblxuICAgIHN1bW1hcnlFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYFRvdGFsIE1vbnN0ZXJzOiAke3N1bW1hcnkudG90YWxNb25zdGVyc31gXG4gICAgfSk7XG5cbiAgICBzdW1tYXJ5RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBVbmlxdWUgTW9uc3RlcnM6ICR7c3VtbWFyeS51bmlxdWVNb25zdGVyc31gXG4gICAgfSk7XG5cbiAgICBzdW1tYXJ5RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBBdmVyYWdlIE1vbnN0ZXIgTGV2ZWw6ICR7c3VtbWFyeS5hdmVyYWdlTGV2ZWwudG9GaXhlZCgxKX1gXG4gICAgfSk7XG4gIH1cblxuICBnZXRFbmNvdW50ZXJTdW1tYXJ5KCk6IHtcbiAgICB0b3RhbE1vbnN0ZXJzOiBudW1iZXI7XG4gICAgdW5pcXVlTW9uc3RlcnM6IG51bWJlcjtcbiAgICBhdmVyYWdlTGV2ZWw6IG51bWJlcjtcbiAgfSB7XG4gICAgY29uc3QgdG90YWxNb25zdGVycyA9IHRoaXMuc2VsZWN0ZWRNb25zdGVycy5yZWR1Y2UoXG4gICAgICAoc3VtLCBtb25zdGVyKSA9PiBzdW0gKyBtb25zdGVyLnF0eSxcbiAgICAgIDBcbiAgICApO1xuXG4gICAgY29uc3QgdW5pcXVlTW9uc3RlcnMgPSB0aGlzLnNlbGVjdGVkTW9uc3RlcnMubGVuZ3RoO1xuXG4gICAgbGV0IHRvdGFsTGV2ZWxzID0gMDtcbiAgICBsZXQgY291bnRlZE1vbnN0ZXJzID0gMDtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiB0aGlzLnNlbGVjdGVkTW9uc3RlcnMpIHtcbiAgICAgIGNvbnN0IGxldmVsID0gTnVtYmVyKG1vbnN0ZXIubGV2ZWwpO1xuXG4gICAgICBpZiAoIU51bWJlci5pc05hTihsZXZlbCkpIHtcbiAgICAgICAgdG90YWxMZXZlbHMgKz0gbGV2ZWwgKiBtb25zdGVyLnF0eTtcbiAgICAgICAgY291bnRlZE1vbnN0ZXJzICs9IG1vbnN0ZXIucXR5O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGF2ZXJhZ2VMZXZlbCA9XG4gICAgICBjb3VudGVkTW9uc3RlcnMgPiAwXG4gICAgICAgID8gdG90YWxMZXZlbHMgLyBjb3VudGVkTW9uc3RlcnNcbiAgICAgICAgOiAwO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvdGFsTW9uc3RlcnMsXG4gICAgICB1bmlxdWVNb25zdGVycyxcbiAgICAgIGF2ZXJhZ2VMZXZlbFxuICAgIH07XG4gIH1cblxuICBhZGRNb25zdGVyKG1vbnN0ZXI6IE1vbnN0ZXJTdW1tYXJ5KTogdm9pZCB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnNlbGVjdGVkTW9uc3RlcnMuZmluZChcbiAgICAgIChzZWxlY3RlZCkgPT4gc2VsZWN0ZWQucGF0aCA9PT0gbW9uc3Rlci5wYXRoXG4gICAgKTtcblxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgZXhpc3RpbmcucXR5ICs9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRNb25zdGVycy5wdXNoKHtcbiAgICAgICAgbmFtZTogbW9uc3Rlci5uYW1lLFxuICAgICAgICBwYXRoOiBtb25zdGVyLnBhdGgsXG4gICAgICAgIHF0eTogMSxcbiAgICAgICAgbGV2ZWw6IG1vbnN0ZXIubGV2ZWwsXG4gICAgICAgIGFjOiBtb25zdGVyLmFjLFxuICAgICAgICBocDogbW9uc3Rlci5ocFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5yZW5kZXJTZWxlY3RlZE1vbnN0ZXJzKCk7XG4gICAgdGhpcy5yZW5kZXJFbmNvdW50ZXJTdW1tYXJ5KCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGxvYWRFbmNvdW50ZXJGcm9tRmlsZShmaWxlOiBURmlsZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgY29uc3QgZnJvbnRtYXR0ZXIgPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG5cbiAgICBpZiAoIWZyb250bWF0dGVyIHx8IGZyb250bWF0dGVyLnNoYWRvd2RhcmtUeXBlICE9PSBcImVuY291bnRlclwiKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVGhpcyBmaWxlIGlzIG5vdCBhIFNoYWRvd2RhcmsgZW5jb3VudGVyLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmVuY291bnRlck5hbWUgPVxuICAgICAgU3RyaW5nKGZyb250bWF0dGVyLm5hbWUgPz8gZmlsZS5iYXNlbmFtZSk7XG5cbiAgICB0aGlzLnBhcnR5TGV2ZWwgPVxuICAgICAgTnVtYmVyKGZyb250bWF0dGVyLnBhcnR5TGV2ZWwgPz8gMSk7XG5cbiAgICB0aGlzLnBhcnR5U2l6ZSA9XG4gICAgICBOdW1iZXIoZnJvbnRtYXR0ZXIucGFydHlTaXplID8/IDQpO1xuXG4gICAgdGhpcy5zZWxlY3RlZE1vbnN0ZXJzID0gQXJyYXkuaXNBcnJheShmcm9udG1hdHRlci5tb25zdGVycylcbiAgICAgID8gZnJvbnRtYXR0ZXIubW9uc3RlcnMubWFwKChtb25zdGVyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gKHtcbiAgICAgICAgICBuYW1lOiBTdHJpbmcobW9uc3Rlci5uYW1lID8/IFwiVW5rbm93biBNb25zdGVyXCIpLFxuICAgICAgICAgIHBhdGg6IFN0cmluZyhtb25zdGVyLnBhdGggPz8gXCJcIiksXG4gICAgICAgICAgcXR5OiBOdW1iZXIobW9uc3Rlci5xdHkgPz8gMSksXG4gICAgICAgICAgbGV2ZWw6IFN0cmluZyhtb25zdGVyLmxldmVsID8/IFwiXCIpLFxuICAgICAgICAgIGFjOiBTdHJpbmcobW9uc3Rlci5hYyA/PyBcIlwiKSxcbiAgICAgICAgICBocDogU3RyaW5nKG1vbnN0ZXIuaHAgPz8gXCJcIilcbiAgICAgICAgfSkpXG4gICAgICA6IFtdO1xuXG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG5cbiAgICB0aGlzLnNldHVwID0gdGhpcy5leHRyYWN0U2VjdGlvbihjb250ZW50LCBcIlNldHVwXCIpO1xuICAgIHRoaXMucmVhZEFsb3VkID0gdGhpcy5leHRyYWN0U2VjdGlvbihjb250ZW50LCBcIlJlYWQtQWxvdWRcIik7XG4gICAgdGhpcy50YWN0aWNzID0gdGhpcy5leHRyYWN0U2VjdGlvbihjb250ZW50LCBcIlRhY3RpY3NcIik7XG4gICAgdGhpcy50cmVhc3VyZSA9IHRoaXMuZXh0cmFjdFNlY3Rpb24oY29udGVudCwgXCJUcmVhc3VyZVwiKTtcbiAgICB0aGlzLm5vdGVzID0gdGhpcy5leHRyYWN0U2VjdGlvbihjb250ZW50LCBcIk5vdGVzXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0U2VjdGlvbihcbiAgICBjb250ZW50OiBzdHJpbmcsXG4gICAgaGVhZGluZzogc3RyaW5nXG4gICk6IHN0cmluZyB7XG4gICAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgICBjb25zdCBzdGFydEluZGV4ID0gbGluZXMuZmluZEluZGV4KFxuICAgICAgKGxpbmUpID0+IGxpbmUudHJpbSgpID09PSBgIyMgJHtoZWFkaW5nfWBcbiAgICApO1xuXG4gICAgaWYgKHN0YXJ0SW5kZXggPT09IC0xKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWN0aW9uTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gc3RhcnRJbmRleCArIDE7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbGluZSA9IGxpbmVzW2ldO1xuXG4gICAgICBpZiAoL14jI1xccysvLnRlc3QobGluZS50cmltKCkpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBzZWN0aW9uTGluZXMucHVzaChsaW5lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VjdGlvbkxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZUVuY291bnRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5lbmNvdW50ZXJOYW1lLnRyaW0oKTtcblxuICAgIGlmICghbmFtZSkge1xuICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBuYW1lIGlzIHJlcXVpcmVkLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMuZmlsZVRvRWRpdCkge1xuICAgICAgICBhd2FpdCB0aGlzLmVuY291bnRlclNlcnZpY2UudXBkYXRlRW5jb3VudGVyTm90ZShcbiAgICAgICAgICB0aGlzLmZpbGVUb0VkaXQsXG4gICAgICAgICAgdGhpcy5nZXRFbmNvdW50ZXJEYXRhKClcbiAgICAgICAgKTtcblxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gd2luZG93LnNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpLm9wZW5GaWxlKHRoaXMuZmlsZVRvRWRpdCk7XG5cbiAgICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBzYXZlZC5cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLmVuY291bnRlclNlcnZpY2UuY3JlYXRlRW5jb3VudGVyTm90ZShcbiAgICAgICAgICB0aGlzLmdldEVuY291bnRlckRhdGEoKVxuICAgICAgICApO1xuXG4gICAgICAgIG5ldyBOb3RpY2UoXCJFbmNvdW50ZXIgY3JlYXRlZC5cIik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBzYXZlIGVuY291bnRlcjpcIiwgZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcIkZhaWxlZCB0byBzYXZlIGVuY291bnRlci4gQ2hlY2sgY29uc29sZS5cIik7XG4gICAgfVxuICB9XG59IiwgImltcG9ydCB7IEFwcCwgTWVudSwgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBNb25zdGVyU3VtbWFyeSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93TW9uc3RlclByZXZpZXcoXG4gIGFwcDogQXBwLFxuICBldmVudDogTW91c2VFdmVudCxcbiAgbW9uc3RlcjogTW9uc3RlclN1bW1hcnlcbik6IHZvaWQge1xuXG4gIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKG1vbnN0ZXIubmFtZSlcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChtb25zdGVyLnBhdGgpO1xuXG4gICAgICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgYXBwLndvcmtzcGFjZS5nZXRMZWFmKHRydWUpLm9wZW5GaWxlKGZpbGUpO1xuICAgICB9KTtcbiAgfSk7XG5cbiAgbWVudS5hZGRTZXBhcmF0b3IoKTtcblxuICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICBpdGVtLnNldFRpdGxlKFxuICAgICAgW1xuICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgbW9uc3Rlci5hYyA/IGBBQyAke21vbnN0ZXIuYWN9YCA6IG51bGwsXG4gICAgICAgIG1vbnN0ZXIuaHAgPyBgSFAgJHttb25zdGVyLmhwfWAgOiBudWxsXG4gICAgICBdXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLmpvaW4oXCIgXHUyMDIyIFwiKVxuICAgICk7XG5cbiAgICBpdGVtLnNldERpc2FibGVkKHRydWUpO1xuICB9KTtcblxuICBpZiAobW9uc3Rlci5hdGspIHtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uc2V0VGl0bGUoYEFUSzogJHttb25zdGVyLmF0a31gKTtcbiAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgfSk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHRyYWl0IG9mIG1vbnN0ZXIudHJhaXRzID8/IFtdKSB7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLnNldFRpdGxlKHRyYWl0KTtcbiAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgfSk7XG4gIH1cblxuICBtZW51LmFkZFNlcGFyYXRvcigpO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgIC5zZXRUaXRsZShcIkNvcHkgTW9uc3RlciBQYXRoXCIpXG4gICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KG1vbnN0ZXIucGF0aCk7XG5cbiAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgcGF0aCBjb3BpZWQuXCIpO1xuICAgICAgfSk7XG4gIH0pO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgIC5zZXRUaXRsZShcIk9wZW4gaW4gTmV3IFRhYlwiKVxuICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChtb25zdGVyLnBhdGgpO1xuICAgICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKS5vcGVuRmlsZShmaWxlKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICBpdGVtXG4gICAgICAuc2V0VGl0bGUoXCJPcGVuIHRvIHRoZSBSaWdodFwiKVxuICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuXG4gICAgICAgIGNvbnN0IGZpbGUgPVxuICAgICAgICAgIGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobW9uc3Rlci5wYXRoKTtcblxuICAgICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxlYWYgPVxuICAgICAgICAgIGFwcC53b3Jrc3BhY2UuZ2V0TGVhZihcInNwbGl0XCIsIFwidmVydGljYWxcIik7XG5cbiAgICAgICAgYXdhaXQgbGVhZi5vcGVuRmlsZShmaWxlKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZXZlbnQpO1xufSIsICJpbXBvcnQge1xuICBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0LFxuICBNZW51LFxuICBOb3RpY2UsXG4gIFRGaWxlXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBwYXJzZUZyb250bWF0dGVyIH0gZnJvbSBcIi4uL3N0YXRibG9ja3NDb21wYXQvcGFyc2VGcm9udE1hdHRlclwiO1xuaW1wb3J0IHsgcmVuZGVyTW9uc3RlckJsb2NrIH0gZnJvbSBcIi4uL3N0YXRibG9ja3NDb21wYXQvcmVuZGVyTW9uc3RlckJsb2NrXCI7XG5pbXBvcnQgeyBERUZBVUxUX1NUQVRCTE9DS19SRU5ERVJfU0VUVElOR1MgfSBmcm9tIFwiLi4vc3RhdGJsb2Nrc0NvbXBhdC9zZXR0aW5nc1wiO1xuXG5leHBvcnQgY2xhc3MgRW5jb3VudGVyUmVuZGVyZXIge1xuICBwbHVnaW46IFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKHBsdWdpbjogU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW4pIHtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIHJlZ2lzdGVyKCk6IHZvaWQge1xuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyTWFya2Rvd25Qb3N0UHJvY2Vzc29yKFxuICAgICAgKFxuICAgICAgICBlbDogSFRNTEVsZW1lbnQsXG4gICAgICAgIGN0eDogTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dFxuICAgICAgKSA9PiB7XG4gICAgICAgIHRoaXMucHJvY2VzcyhlbCwgY3R4KTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgcHJvY2VzcyhcbiAgICBlbDogSFRNTEVsZW1lbnQsXG4gICAgY3R4OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0XG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHNlY3Rpb25JbmZvID0gY3R4LmdldFNlY3Rpb25JbmZvKGVsKTtcblxuICAgIGlmICghc2VjdGlvbkluZm8gfHwgc2VjdGlvbkluZm8ubGluZVN0YXJ0ICE9PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9XG4gICAgICB0aGlzLnBsdWdpbi5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKFxuICAgICAgICBjdHguc291cmNlUGF0aFxuICAgICAgKTtcblxuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjYWNoZSA9XG4gICAgICB0aGlzLnBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG5cbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlcjtcblxuICAgIGlmIChmcm9udG1hdHRlcj8uc2hhZG93ZGFya1R5cGUgIT09IFwiZW5jb3VudGVyXCIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZWwucXVlcnlTZWxlY3RvcihcIi5zZC1lbmNvdW50ZXItcmVuZGVyZWRcIikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb250YWluZXIgPSBlbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1yZW5kZXJlZFwiXG4gICAgfSk7XG5cbiAgICBjb250YWluZXIuY3JlYXRlRWwoXCJoMlwiLCB7XG4gICAgICB0ZXh0OiBmcm9udG1hdHRlci5uYW1lID8/IGZpbGUuYmFzZW5hbWVcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwge1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1yZW5kZXJlZC1tZXRhXCIsXG4gICAgICB0ZXh0OiBbXG4gICAgICAgIGZyb250bWF0dGVyLnBhcnR5TGV2ZWxcbiAgICAgICAgICA/IGBQYXJ0eSBMZXZlbCAke2Zyb250bWF0dGVyLnBhcnR5TGV2ZWx9YFxuICAgICAgICAgIDogbnVsbCxcbiAgICAgICAgZnJvbnRtYXR0ZXIucGFydHlTaXplXG4gICAgICAgICAgPyBgJHtmcm9udG1hdHRlci5wYXJ0eVNpemV9IFBDc2BcbiAgICAgICAgICA6IG51bGwsXG4gICAgICAgIGZyb250bWF0dGVyLnN0YXR1c1xuICAgICAgICAgID8gYFN0YXR1czogJHtmcm9udG1hdHRlci5zdGF0dXN9YFxuICAgICAgICAgIDogbnVsbFxuICAgICAgXVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5qb2luKFwiIFx1MjAyMiBcIilcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyRGFzaGJvYXJkU3RhdHMoY29udGFpbmVyLCBmcm9udG1hdHRlcik7XG4gICAgdGhpcy5yZW5kZXJDb21wYWN0TW9uc3RlclJvc3Rlcihjb250YWluZXIsIGZyb250bWF0dGVyKTtcbiAgfVxuXG4gIGdldEVuY291bnRlckRpZmZpY3VsdHkoXG4gICAgZnJvbnRtYXR0ZXI6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXJ0eUxldmVsID0gTnVtYmVyKGZyb250bWF0dGVyLnBhcnR5TGV2ZWwgPz8gMSk7XG4gICAgY29uc3QgcGFydHlTaXplID0gTnVtYmVyKGZyb250bWF0dGVyLnBhcnR5U2l6ZSA/PyA0KTtcblxuICAgIGNvbnN0IG1vbnN0ZXJzID0gQXJyYXkuaXNBcnJheShmcm9udG1hdHRlci5tb25zdGVycylcbiAgICAgID8gZnJvbnRtYXR0ZXIubW9uc3RlcnNcbiAgICAgIDogW107XG5cbiAgICBjb25zdCBwYXJ0eVBvd2VyID0gcGFydHlMZXZlbCAqIHBhcnR5U2l6ZTtcblxuICAgIGNvbnN0IG1vbnN0ZXJQb3dlciA9IG1vbnN0ZXJzLnJlZHVjZShcbiAgICAgIChzdW06IG51bWJlciwgbW9uc3RlcjogUmVjb3JkPHN0cmluZywgYW55PikgPT4ge1xuICAgICAgICBjb25zdCBxdHkgPSBOdW1iZXIobW9uc3Rlci5xdHkgPz8gMSk7XG4gICAgICAgIGNvbnN0IGxldmVsID0gTnVtYmVyKG1vbnN0ZXIubGV2ZWwgPz8gMCk7XG5cbiAgICAgICAgcmV0dXJuIHN1bSArIHF0eSAqIGxldmVsO1xuICAgICAgfSxcbiAgICAgIDBcbiAgICApO1xuXG4gICAgaWYgKG1vbnN0ZXJQb3dlciA8PSAwKSB7XG4gICAgICByZXR1cm4gXCJOb25lXCI7XG4gICAgfVxuXG4gICAgY29uc3QgcmF0aW8gPSBtb25zdGVyUG93ZXIgLyBwYXJ0eVBvd2VyO1xuXG4gICAgaWYgKHJhdGlvIDwgMC41KSB7XG4gICAgICByZXR1cm4gXCJFYXN5XCI7XG4gICAgfVxuXG4gICAgaWYgKHJhdGlvIDwgMC44NSkge1xuICAgICAgcmV0dXJuIFwiU3RhbmRhcmRcIjtcbiAgICB9XG5cbiAgICBpZiAocmF0aW8gPCAxLjI1KSB7XG4gICAgICByZXR1cm4gXCJIYXJkXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiRGVhZGx5XCI7XG4gIH1cblxuICByZW5kZXJEYXNoYm9hcmRTdGF0cyhcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIGZyb250bWF0dGVyOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4gICk6IHZvaWQge1xuICAgIGNvbnN0IG1vbnN0ZXJzID0gQXJyYXkuaXNBcnJheShmcm9udG1hdHRlci5tb25zdGVycylcbiAgICAgID8gZnJvbnRtYXR0ZXIubW9uc3RlcnNcbiAgICAgIDogW107XG5cbiAgICBjb25zdCB0b3RhbE1vbnN0ZXJzID0gbW9uc3RlcnMucmVkdWNlKFxuICAgICAgKHN1bTogbnVtYmVyLCBtb25zdGVyOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSA9PlxuICAgICAgICBzdW0gKyBOdW1iZXIobW9uc3Rlci5xdHkgPz8gMSksXG4gICAgICAwXG4gICAgKTtcblxuICAgIGNvbnN0IHVuaXF1ZU1vbnN0ZXJzID0gbW9uc3RlcnMubGVuZ3RoO1xuXG4gICAgbGV0IHRvdGFsTGV2ZWxzID0gMDtcbiAgICBsZXQgY291bnRlZE1vbnN0ZXJzID0gMDtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiBtb25zdGVycykge1xuICAgICAgY29uc3QgbGV2ZWwgPSBOdW1iZXIobW9uc3Rlci5sZXZlbCk7XG5cbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKGxldmVsKSkge1xuICAgICAgICBjb25zdCBxdHkgPSBOdW1iZXIobW9uc3Rlci5xdHkgPz8gMSk7XG5cbiAgICAgICAgdG90YWxMZXZlbHMgKz0gbGV2ZWwgKiBxdHk7XG4gICAgICAgIGNvdW50ZWRNb25zdGVycyArPSBxdHk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYXZlcmFnZUxldmVsID1cbiAgICAgIGNvdW50ZWRNb25zdGVycyA+IDBcbiAgICAgICAgPyB0b3RhbExldmVscyAvIGNvdW50ZWRNb25zdGVyc1xuICAgICAgICA6IDA7XG5cbiAgICBjb25zdCBkaWZmaWN1bHR5ID1cbiAgICAgIHRoaXMuZ2V0RW5jb3VudGVyRGlmZmljdWx0eShmcm9udG1hdHRlcik7XG5cbiAgICBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcmVuZGVyZWQtc3RhdHNcIixcbiAgICAgIHRleHQ6XG4gICAgICAgIGAke3RvdGFsTW9uc3RlcnN9IE1vbnN0ZXJzYCArXG4gICAgICAgIGAgXHUyMDIyICR7dW5pcXVlTW9uc3RlcnN9IFVuaXF1ZWAgK1xuICAgICAgICBgIFx1MjAyMiBBdmcgTHYgJHthdmVyYWdlTGV2ZWwudG9GaXhlZCgxKX1gICtcbiAgICAgICAgYCBcdTIwMjIgJHtkaWZmaWN1bHR5fWBcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlckNvbXBhY3RNb25zdGVyUm9zdGVyKFxuICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gICAgZnJvbnRtYXR0ZXI6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogdm9pZCB7XG4gICAgY29uc3QgbW9uc3RlcnMgPSBBcnJheS5pc0FycmF5KGZyb250bWF0dGVyLm1vbnN0ZXJzKVxuICAgICAgPyBmcm9udG1hdHRlci5tb25zdGVyc1xuICAgICAgOiBbXTtcblxuICAgIGlmIChtb25zdGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkLWVtcHR5XCIsXG4gICAgICAgIHRleHQ6IFwiTm8gbW9uc3RlcnMgYWRkZWQuXCJcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgcm9zdGVyRWwgPSBjb250YWluZXIuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcmVuZGVyZWQtcm9zdGVyXCJcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiBtb25zdGVycykge1xuICAgICAgY29uc3QgcXR5ID0gbW9uc3Rlci5xdHkgPz8gMTtcbiAgICAgIGNvbnN0IG5hbWUgPSBtb25zdGVyLm5hbWUgPz8gXCJVbmtub3duIE1vbnN0ZXJcIjtcblxuICAgICAgY29uc3QgbWV0YSA9IFtcbiAgICAgICAgbW9uc3Rlci5sZXZlbCA/IGBMViAke21vbnN0ZXIubGV2ZWx9YCA6IG51bGwsXG4gICAgICAgIG1vbnN0ZXIuYWMgPyBgQUMgJHttb25zdGVyLmFjfWAgOiBudWxsLFxuICAgICAgICBtb25zdGVyLmhwID8gYEhQICR7bW9uc3Rlci5ocH1gIDogbnVsbFxuICAgICAgXVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5qb2luKFwiIFx1MjAyMiBcIik7XG5cbiAgICAgIGNvbnN0IHBpbGxFbCA9IHJvc3RlckVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcInNkLWVuY291bnRlci1yZW5kZXJlZC1tb25zdGVyXCIsXG4gICAgICAgIHRleHQ6IG1ldGFcbiAgICAgICAgICA/IGAke3F0eX14ICR7bmFtZX0gXHUyMDIyICR7bWV0YX1gXG4gICAgICAgICAgOiBgJHtxdHl9eCAke25hbWV9YFxuICAgICAgfSk7XG5cbiAgICAgIHBpbGxFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuc2hvd01vbnN0ZXJQaWxsTWVudShldmVudCwgbW9uc3Rlcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzaG93TW9uc3RlclBpbGxNZW51KFxuICAgIGV2ZW50OiBNb3VzZUV2ZW50LFxuICAgIG1vbnN0ZXI6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogdm9pZCB7XG4gICAgY29uc3QgcGF0aCA9IG1vbnN0ZXIucGF0aDtcbiAgICBjb25zdCBuYW1lID0gbW9uc3Rlci5uYW1lID8/IFwiVW5rbm93biBNb25zdGVyXCI7XG5cbiAgICBjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbVxuICAgICAgICAuc2V0VGl0bGUoYE9wZW4gJHtuYW1lfWApXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLm9wZW5Nb25zdGVyKHBhdGgsIFwiY3VycmVudFwiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKFwiT3BlbiBpbiBOZXcgVGFiXCIpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLm9wZW5Nb25zdGVyKHBhdGgsIFwibmV3LXRhYlwiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKFwiT3BlbiB0byB0aGUgUmlnaHRcIilcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMub3Blbk1vbnN0ZXIocGF0aCwgXCJyaWdodFwiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZShcIlByZXZpZXcgU3RhdGJsb2NrXCIpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNob3dNb25zdGVyU3RhdGJsb2NrUHJldmlldyhtb25zdGVyKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLnNldFRpdGxlKFxuICAgICAgICBbXG4gICAgICAgICAgbW9uc3Rlci5sZXZlbCA/IGBMViAke21vbnN0ZXIubGV2ZWx9YCA6IG51bGwsXG4gICAgICAgICAgbW9uc3Rlci5hYyA/IGBBQyAke21vbnN0ZXIuYWN9YCA6IG51bGwsXG4gICAgICAgICAgbW9uc3Rlci5ocCA/IGBIUCAke21vbnN0ZXIuaHB9YCA6IG51bGxcbiAgICAgICAgXVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAuam9pbihcIiBcdTIwMjIgXCIpIHx8IFwiTm8gc3RhdHMgYXZhaWxhYmxlXCJcbiAgICAgICk7XG5cbiAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgYXN5bmMgb3Blbk1vbnN0ZXIoXG4gICAgcGF0aDogdW5rbm93bixcbiAgICBtb2RlOiBcImN1cnJlbnRcIiB8IFwibmV3LXRhYlwiIHwgXCJyaWdodFwiXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gXCJzdHJpbmdcIiB8fCBwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPVxuICAgICAgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcblxuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJNb25zdGVyIGZpbGUgbm90IGZvdW5kLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobW9kZSA9PT0gXCJyaWdodFwiKSB7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlXG4gICAgICAgIC5nZXRMZWFmKFwic3BsaXRcIiwgXCJ2ZXJ0aWNhbFwiKVxuICAgICAgICAub3BlbkZpbGUoZmlsZSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobW9kZSA9PT0gXCJuZXctdGFiXCIpIHtcbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2VcbiAgICAgICAgLmdldExlYWYodHJ1ZSlcbiAgICAgICAgLm9wZW5GaWxlKGZpbGUpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZVxuICAgICAgLmdldExlYWYoZmFsc2UpXG4gICAgICAub3BlbkZpbGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBzaG93TW9uc3RlclN0YXRibG9ja1ByZXZpZXcoXG4gICAgbW9uc3RlcjogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwYXRoID0gbW9uc3Rlci5wYXRoO1xuXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiIHx8IHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9XG4gICAgICB0aGlzLnBsdWdpbi5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuXG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNhY2hlID1cbiAgICAgIHRoaXMucGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcblxuICAgIGNvbnN0IGZyb250bWF0dGVyID0gY2FjaGU/LmZyb250bWF0dGVyO1xuXG4gICAgaWYgKCFmcm9udG1hdHRlcikge1xuICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgaGFzIG5vIGZyb250bWF0dGVyLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBwYXJzZUZyb250bWF0dGVyKGZyb250bWF0dGVyKTtcblxuICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MgfHwgIXJlc3VsdC5kYXRhKSB7XG4gICAgICBuZXcgTm90aWNlKFwiQ291bGQgbm90IHBhcnNlIG1vbnN0ZXIuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpZXdFbCA9IGRvY3VtZW50LmJvZHkuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItc3RhdGJsb2NrLXByZXZpZXdcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgaW5uZXJFbCA9IHByZXZpZXdFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zdGF0YmxvY2stcHJldmlldy1pbm5lclwiXG4gICAgfSk7XG5cbiAgICByZW5kZXJNb25zdGVyQmxvY2soXG4gICAgICBpbm5lckVsLFxuICAgICAgcmVzdWx0LmRhdGEsXG4gICAgICBERUZBVUxUX1NUQVRCTE9DS19SRU5ERVJfU0VUVElOR1MsXG4gICAgICByZXN1bHQud2FybmluZ3NcbiAgICApO1xuXG4gICAgY29uc3QgY2xvc2VCdXR0b24gPSBwcmV2aWV3RWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zdGF0YmxvY2stcHJldmlldy1jbG9zZVwiLFxuICAgICAgdGV4dDogXCJcdTAwRDdcIlxuICAgIH0pO1xuXG4gICAgY2xvc2VCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHByZXZpZXdFbC5yZW1vdmUoKTtcbiAgICB9KTtcblxuICAgIHByZXZpZXdFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSBwcmV2aWV3RWwpIHtcbiAgICAgICAgcHJldmlld0VsLnJlbW92ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59IiwgImltcG9ydCB7IFNoYWRvd2RhcmtBdHRhY2ssIFNoYWRvd2RhcmtNb25zdGVyIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxudHlwZSBMb29zZU1vbnN0ZXIgPSBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiAmIHtcbiAgbmFtZT86IHVua25vd247XG4gIGxldmVsPzogdW5rbm93bjtcbiAgYWxpZ25tZW50PzogdW5rbm93bjtcbiAgdHlwZT86IHVua25vd247XG4gIGFjPzogdW5rbm93bjtcbiAgaHA/OiB1bmtub3duO1xuICBtdj86IHVua25vd247XG4gIGF0az86IHVua25vd247XG4gIHN0YXRzPzogdW5rbm93bjtcbiAgc3RyPzogdW5rbm93bjtcbiAgZGV4PzogdW5rbm93bjtcbiAgY29uPzogdW5rbm93bjtcbiAgaW50PzogdW5rbm93bjtcbiAgd2lzPzogdW5rbm93bjtcbiAgY2hhPzogdW5rbm93bjtcbiAgdHJhaXRzPzogdW5rbm93bjtcbiAgc3BlY2lhbHM/OiB1bmtub3duO1xuICBzcGVsbHM/OiB1bmtub3duO1xuICBnZWFyPzogdW5rbm93bjtcbiAgZGVzY3JpcHRpb24/OiB1bmtub3duO1xuICBzb3VyY2U/OiB1bmtub3duO1xuICB0YWdzPzogdW5rbm93bjtcbn07XG5cbmZ1bmN0aW9uIGFzU3RyaW5nKHZhbHVlOiB1bmtub3duLCBmYWxsYmFjayA9IFwiXCIpOiBzdHJpbmcge1xuICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmYWxsYmFjaztcbiAgfVxuXG4gIGlmIChcbiAgICB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgfHxcbiAgICB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgfHxcbiAgICB0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiXG4gICkge1xuICAgIHJldHVybiBTdHJpbmcodmFsdWUpLnRyaW0oKTtcbiAgfVxuXG4gIHJldHVybiBmYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTW9kaWZpZXIodmFsdWU6IHVua25vd24sIGZhbGxiYWNrID0gXCIrMFwiKTogc3RyaW5nIHtcbiAgY29uc3QgcmF3ID0gYXNTdHJpbmcodmFsdWUsIGZhbGxiYWNrKTtcbiAgaWYgKCFyYXcpIHJldHVybiBmYWxsYmFjaztcbiAgaWYgKC9eWystXVxcZCskLy50ZXN0KHJhdykpIHJldHVybiByYXc7XG4gIGlmICgvXlxcZCskLy50ZXN0KHJhdykpIHJldHVybiBgKyR7cmF3fWA7XG4gIGlmICgvXi1cXGQrJC8udGVzdChyYXcpKSByZXR1cm4gcmF3O1xuICByZXR1cm4gcmF3O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTdHJpbmdBcnJheSh2YWx1ZTogdW5rbm93bik6IHN0cmluZ1tdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLm1hcCgoaXRlbSkgPT4gYXNTdHJpbmcoaXRlbSkpLmZpbHRlcihCb29sZWFuKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gdmFsdWVcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG5cbiAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVBdHRhY2soaXRlbTogdW5rbm93bik6IFNoYWRvd2RhcmtBdHRhY2sgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiBpdGVtID09PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IGl0ZW0udHJpbSgpLFxuICAgICAgcmF3OiBpdGVtLnRyaW0oKVxuICAgIH07XG4gIH1cblxuICBpZiAoaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gXCJvYmplY3RcIikge1xuICAgIGNvbnN0IG9iaiA9IGl0ZW0gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgY29uc3QgbmFtZSA9IGFzU3RyaW5nKG9iai5uYW1lKTtcbiAgICBpZiAoIW5hbWUpIHJldHVybiBudWxsO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWUsXG4gICAgICBib251czogYXNTdHJpbmcob2JqLmJvbnVzKSxcbiAgICAgIGRhbWFnZTogYXNTdHJpbmcob2JqLmRhbWFnZSksXG4gICAgICByYW5nZTogYXNTdHJpbmcob2JqLnJhbmdlKSxcbiAgICAgIG5vdGVzOiBhc1N0cmluZyhvYmoubm90ZXMpXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVBdHRhY2tzKHZhbHVlOiB1bmtub3duKTogU2hhZG93ZGFya0F0dGFja1tdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlXG4gICAgICAubWFwKG5vcm1hbGl6ZUF0dGFjaylcbiAgICAgIC5maWx0ZXIoKGEpOiBhIGlzIFNoYWRvd2RhcmtBdHRhY2sgPT4gYSAhPT0gbnVsbCk7XG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHZhbHVlLnRyaW0oKSkge1xuICAgIHJldHVybiBbeyBuYW1lOiB2YWx1ZS50cmltKCksIHJhdzogdmFsdWUudHJpbSgpIH1dO1xuICB9XG5cbiAgcmV0dXJuIFtdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplTW9uc3RlcihcbiAgaW5wdXQ6IExvb3NlTW9uc3RlclxuKTogU2hhZG93ZGFya01vbnN0ZXIge1xuICBjb25zdCBuZXN0ZWRTdGF0cyA9IChpbnB1dC5zdGF0cyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCkgPz8ge307XG5cbiAgY29uc3Qgc3RyVmFsdWUgPSBpbnB1dC5zdHIgPz8gbmVzdGVkU3RhdHMuc3RyO1xuICBjb25zdCBkZXhWYWx1ZSA9IGlucHV0LmRleCA/PyBuZXN0ZWRTdGF0cy5kZXg7XG4gIGNvbnN0IGNvblZhbHVlID0gaW5wdXQuY29uID8/IG5lc3RlZFN0YXRzLmNvbjtcbiAgY29uc3QgaW50VmFsdWUgPSBpbnB1dC5pbnQgPz8gbmVzdGVkU3RhdHMuaW50O1xuICBjb25zdCB3aXNWYWx1ZSA9IGlucHV0LndpcyA/PyBuZXN0ZWRTdGF0cy53aXM7XG4gIGNvbnN0IGNoYVZhbHVlID0gaW5wdXQuY2hhID8/IG5lc3RlZFN0YXRzLmNoYTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IGFzU3RyaW5nKGlucHV0Lm5hbWUsIFwiVW5uYW1lZCBNb25zdGVyXCIpLFxuICAgIGxldmVsOiBhc1N0cmluZyhpbnB1dC5sZXZlbCwgXCI/XCIpLFxuICAgIGFsaWdubWVudDogYXNTdHJpbmcoaW5wdXQuYWxpZ25tZW50LCBcIlwiKSxcbiAgICB0eXBlOiBhc1N0cmluZyhpbnB1dC50eXBlLCBcIlwiKSxcbiAgICBhYzogYXNTdHJpbmcoaW5wdXQuYWMsIFwiP1wiKSxcbiAgICBocDogYXNTdHJpbmcoaW5wdXQuaHAsIFwiP1wiKSxcbiAgICBtdjogYXNTdHJpbmcoaW5wdXQubXYsIFwiXCIpLFxuICAgIGF0azogbm9ybWFsaXplQXR0YWNrcyhpbnB1dC5hdGspLFxuICAgIHN0YXRzOiB7XG4gICAgICBzdHI6IG5vcm1hbGl6ZU1vZGlmaWVyKHN0clZhbHVlLCBcIiswXCIpLFxuICAgICAgZGV4OiBub3JtYWxpemVNb2RpZmllcihkZXhWYWx1ZSwgXCIrMFwiKSxcbiAgICAgIGNvbjogbm9ybWFsaXplTW9kaWZpZXIoY29uVmFsdWUsIFwiKzBcIiksXG4gICAgICBpbnQ6IG5vcm1hbGl6ZU1vZGlmaWVyKGludFZhbHVlLCBcIiswXCIpLFxuICAgICAgd2lzOiBub3JtYWxpemVNb2RpZmllcih3aXNWYWx1ZSwgXCIrMFwiKSxcbiAgICAgIGNoYTogbm9ybWFsaXplTW9kaWZpZXIoY2hhVmFsdWUsIFwiKzBcIilcbiAgICB9LFxuICAgIHRyYWl0czogbm9ybWFsaXplU3RyaW5nQXJyYXkoaW5wdXQudHJhaXRzKSxcbiAgICBzcGVjaWFsczogbm9ybWFsaXplU3RyaW5nQXJyYXkoaW5wdXQuc3BlY2lhbHMpLFxuICAgIHNwZWxsczogbm9ybWFsaXplU3RyaW5nQXJyYXkoaW5wdXQuc3BlbGxzKSxcbiAgICBnZWFyOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC5nZWFyKSxcbiAgICBkZXNjcmlwdGlvbjogYXNTdHJpbmcoaW5wdXQuZGVzY3JpcHRpb24sIFwiXCIpLFxuICAgIHNvdXJjZTogYXNTdHJpbmcoaW5wdXQuc291cmNlLCBcIlwiKSxcbiAgICB0YWdzOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC50YWdzKVxuICB9O1xufSIsICJpbXBvcnQgeyBQYXJzZVJlc3VsdCwgU2hhZG93ZGFya01vbnN0ZXIgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplTW9uc3RlciB9IGZyb20gXCIuL25vcm1hbGl6ZU1vbnN0ZXJcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRnJvbnRtYXR0ZXIoXG4gIGZyb250bWF0dGVyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuKTogUGFyc2VSZXN1bHQ8U2hhZG93ZGFya01vbnN0ZXI+IHtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcblxuICBpZiAoIWZyb250bWF0dGVyIHx8IHR5cGVvZiBmcm9udG1hdHRlciAhPT0gXCJvYmplY3RcIikge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yczogW1wiTm8gdmFsaWQgZnJvbnRtYXR0ZXIgZm91bmQuXCJdLFxuICAgICAgd2FybmluZ3NcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgbW9uc3RlciA9IG5vcm1hbGl6ZU1vbnN0ZXIoZnJvbnRtYXR0ZXIgYXMgUGFydGlhbDxTaGFkb3dkYXJrTW9uc3Rlcj4pO1xuXG4gIGlmICghbW9uc3Rlci5uYW1lIHx8IG1vbnN0ZXIubmFtZSA9PT0gXCJVbm5hbWVkIE1vbnN0ZXJcIikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJNb25zdGVyIGlzIG1pc3NpbmcgYSBuYW1lLlwiKTtcbiAgfVxuXG4gIGlmICghbW9uc3Rlci5hYyB8fCBtb25zdGVyLmFjID09PSBcIj9cIikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJNb25zdGVyIGlzIG1pc3NpbmcgQUMuXCIpO1xuICB9XG5cbiAgaWYgKCFtb25zdGVyLmhwIHx8IG1vbnN0ZXIuaHAgPT09IFwiP1wiKSB7XG4gICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaXMgbWlzc2luZyBIUC5cIik7XG4gIH1cblxuICBpZiAobW9uc3Rlci5hdGsubGVuZ3RoID09PSAwKSB7XG4gICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaGFzIG5vIGF0dGFja3MgbGlzdGVkLlwiKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBkYXRhOiBtb25zdGVyLFxuICAgIGVycm9ycyxcbiAgICB3YXJuaW5nc1xuICB9O1xufSIsICJpbXBvcnQgeyBTaGFkb3dkYXJrTW9uc3RlciwgU2hhZG93ZGFya0F0dGFjayB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdzIH0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcblxudHlwZSBNb25zdGVyUmVuZGVyT3B0aW9ucyA9IHtcbiAgb25Sb2xsRGljZT86IChmb3JtdWxhOiBzdHJpbmcpID0+IHZvaWQ7XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVEaXYoY2xhc3NOYW1lPzogc3RyaW5nLCB0ZXh0Pzogc3RyaW5nKTogSFRNTERpdkVsZW1lbnQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgaWYgKHRleHQgIT09IHVuZGVmaW5lZCkgZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNwYW4oY2xhc3NOYW1lPzogc3RyaW5nLCB0ZXh0Pzogc3RyaW5nKTogSFRNTFNwYW5FbGVtZW50IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICBpZiAodGV4dCAhPT0gdW5kZWZpbmVkKSBlbC50ZXh0Q29udGVudCA9IHRleHQ7XG4gIHJldHVybiBlbDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTGlzdChjbGFzc05hbWU/OiBzdHJpbmcpOiBIVE1MVUxpc3RFbGVtZW50IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XG4gIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgcmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMaXN0SXRlbShjbGFzc05hbWU/OiBzdHJpbmcpOiBIVE1MTElFbGVtZW50IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgcmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiByZW5kZXJBdHRhY2tUZXh0KGF0dGFjazogU2hhZG93ZGFya0F0dGFjayk6IHN0cmluZyB7XG4gIGlmIChhdHRhY2sucmF3KSByZXR1cm4gYXR0YWNrLnJhdztcblxuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbYXR0YWNrLm5hbWVdO1xuXG4gIGlmIChhdHRhY2suYm9udXMpIHBhcnRzLnB1c2goYXR0YWNrLmJvbnVzKTtcbiAgaWYgKGF0dGFjay5kYW1hZ2UpIHBhcnRzLnB1c2goYCgke2F0dGFjay5kYW1hZ2V9KWApO1xuICBpZiAoYXR0YWNrLnJhbmdlKSBwYXJ0cy5wdXNoKGBbJHthdHRhY2sucmFuZ2V9XWApO1xuICBpZiAoYXR0YWNrLm5vdGVzKSBwYXJ0cy5wdXNoKGAtICR7YXR0YWNrLm5vdGVzfWApO1xuXG4gIHJldHVybiBwYXJ0cy5qb2luKFwiIFwiKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGdldEFsaWdubWVudExhYmVsKGFsaWdubWVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IGFsaWdubWVudC50cmltKCkudG9VcHBlckNhc2UoKTtcblxuICBzd2l0Y2ggKG5vcm1hbGl6ZWQpIHtcbiAgICBjYXNlIFwiTFwiOlxuICAgICAgcmV0dXJuIFwiTGF3ZnVsXCI7XG4gICAgY2FzZSBcIk5cIjpcbiAgICAgIHJldHVybiBcIk5ldXRyYWxcIjtcbiAgICBjYXNlIFwiQ1wiOlxuICAgICAgcmV0dXJuIFwiQ2hhb3RpY1wiO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG5mdW5jdGlvbiBzcGxpdEF0dGFja0Nvbm5lY3Rvcih0ZXh0OiBzdHJpbmcpOiB7IGNvbm5lY3Rvcjogc3RyaW5nIHwgbnVsbDsgYm9keTogc3RyaW5nIH0ge1xuICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCk7XG4gIGNvbnN0IG1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXihBTkR8T1IpXFxzKyguKykkL2kpO1xuXG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm4geyBjb25uZWN0b3I6IG51bGwsIGJvZHk6IHRyaW1tZWQgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY29ubmVjdG9yOiBtYXRjaFsxXS50b1VwcGVyQ2FzZSgpLFxuICAgIGJvZHk6IG1hdGNoWzJdLnRyaW0oKVxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVEaWNlRm9ybXVsYShmb3JtdWxhOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZm9ybXVsYS5yZXBsYWNlKC9cXHMrL2csIFwiXCIpO1xufVxuXG5mdW5jdGlvbiBhdHRhY2tCb251c1RvRm9ybXVsYShib251czogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IGJvbnVzLnRyaW0oKTtcbiAgcmV0dXJuIGAxZDIwJHtub3JtYWxpemVkfWA7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURpY2VSb2xsQnV0dG9uKFxuICB0ZXh0OiBzdHJpbmcsXG4gIGZvcm11bGE6IHN0cmluZyxcbiAgb25Sb2xsRGljZTogKGZvcm11bGE6IHN0cmluZykgPT4gdm9pZFxuKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidXR0b24udHlwZSA9IFwiYnV0dG9uXCI7XG4gIGJ1dHRvbi5jbGFzc05hbWUgPSBcInNkLW1vbnN0ZXItZGljZS1idXR0b25cIjtcbiAgYnV0dG9uLnRleHRDb250ZW50ID0gdGV4dDtcbiAgYnV0dG9uLnRpdGxlID0gYFJvbGwgJHtmb3JtdWxhfWA7XG5cbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZ0KSA9PiB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIG9uUm9sbERpY2UoZm9ybXVsYSk7XG4gIH0pO1xuXG4gIHJldHVybiBidXR0b247XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEF0dGFja0JvZHlXaXRoRGljZUJ1dHRvbnMoXG4gIHBhcmVudDogSFRNTEVsZW1lbnQsXG4gIGJvZHk6IHN0cmluZyxcbiAgb25Sb2xsRGljZTogKGZvcm11bGE6IHN0cmluZykgPT4gdm9pZFxuKTogdm9pZCB7XG4gIGNvbnN0IGF0dGFja0JvbnVzUmVnZXggPSAvKFsrLV1cXGQrKS87XG4gIGNvbnN0IGRhbWFnZVJlZ2V4ID0gL1xcYihcXGQrZFxcZCsoPzpcXHMqWystXVxccypcXGQrKT8pXFxiL2k7XG5cbiAgY29uc3QgcmVwbGFjZW1lbnRzOiBBcnJheTx7XG4gICAgc3RhcnQ6IG51bWJlcjtcbiAgICBlbmQ6IG51bWJlcjtcbiAgICB0ZXh0OiBzdHJpbmc7XG4gICAgZm9ybXVsYTogc3RyaW5nO1xuICB9PiA9IFtdO1xuXG4gIGNvbnN0IGJvbnVzTWF0Y2ggPSBhdHRhY2tCb251c1JlZ2V4LmV4ZWMoYm9keSk7XG4gIGlmIChib251c01hdGNoPy5pbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgdGV4dCA9IGJvbnVzTWF0Y2hbMV07XG4gICAgcmVwbGFjZW1lbnRzLnB1c2goe1xuICAgICAgc3RhcnQ6IGJvbnVzTWF0Y2guaW5kZXgsXG4gICAgICBlbmQ6IGJvbnVzTWF0Y2guaW5kZXggKyB0ZXh0Lmxlbmd0aCxcbiAgICAgIHRleHQsXG4gICAgICBmb3JtdWxhOiBhdHRhY2tCb251c1RvRm9ybXVsYSh0ZXh0KVxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgZGFtYWdlTWF0Y2ggPSBkYW1hZ2VSZWdleC5leGVjKGJvZHkpO1xuICBpZiAoZGFtYWdlTWF0Y2g/LmluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCB0ZXh0ID0gZGFtYWdlTWF0Y2hbMV07XG4gICAgcmVwbGFjZW1lbnRzLnB1c2goe1xuICAgICAgc3RhcnQ6IGRhbWFnZU1hdGNoLmluZGV4LFxuICAgICAgZW5kOiBkYW1hZ2VNYXRjaC5pbmRleCArIHRleHQubGVuZ3RoLFxuICAgICAgdGV4dCxcbiAgICAgIGZvcm11bGE6IG5vcm1hbGl6ZURpY2VGb3JtdWxhKHRleHQpXG4gICAgfSk7XG4gIH1cblxuICByZXBsYWNlbWVudHMuc29ydCgoYSwgYikgPT4gYS5zdGFydCAtIGIuc3RhcnQpO1xuXG4gIGxldCBjdXJzb3IgPSAwO1xuXG4gIGZvciAoY29uc3QgcmVwbGFjZW1lbnQgb2YgcmVwbGFjZW1lbnRzKSB7XG4gICAgaWYgKHJlcGxhY2VtZW50LnN0YXJ0IDwgY3Vyc29yKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAocmVwbGFjZW1lbnQuc3RhcnQgPiBjdXJzb3IpIHtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShib2R5LnNsaWNlKGN1cnNvciwgcmVwbGFjZW1lbnQuc3RhcnQpKSk7XG4gICAgfVxuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKFxuICAgICAgY3JlYXRlRGljZVJvbGxCdXR0b24ocmVwbGFjZW1lbnQudGV4dCwgcmVwbGFjZW1lbnQuZm9ybXVsYSwgb25Sb2xsRGljZSlcbiAgICApO1xuXG4gICAgY3Vyc29yID0gcmVwbGFjZW1lbnQuZW5kO1xuICB9XG5cbiAgaWYgKGN1cnNvciA8IGJvZHkubGVuZ3RoKSB7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGJvZHkuc2xpY2UoY3Vyc29yKSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFRleHRXaXRoRGFtYWdlRGljZUJ1dHRvbnMoXG4gIHBhcmVudDogSFRNTEVsZW1lbnQsXG4gIHRleHQ6IHN0cmluZyxcbiAgb25Sb2xsRGljZTogKGZvcm11bGE6IHN0cmluZykgPT4gdm9pZFxuKTogdm9pZCB7XG4gIGNvbnN0IGRhbWFnZVJlZ2V4ID0gL1xcYlxcZCtkXFxkKyg/OlxccypbKy1dXFxzKlxcZCspP1xcYi9naTtcblxuICBsZXQgY3Vyc29yID0gMDtcbiAgbGV0IG1hdGNoOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBkYW1hZ2VSZWdleC5leGVjKHRleHQpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGRpY2VUZXh0ID0gbWF0Y2hbMF07XG4gICAgY29uc3Qgc3RhcnQgPSBtYXRjaC5pbmRleDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGRpY2VUZXh0Lmxlbmd0aDtcblxuICAgIGlmIChzdGFydCA+IGN1cnNvcikge1xuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQuc2xpY2UoY3Vyc29yLCBzdGFydCkpKTtcbiAgICB9XG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoXG4gICAgICBjcmVhdGVEaWNlUm9sbEJ1dHRvbihkaWNlVGV4dCwgbm9ybWFsaXplRGljZUZvcm11bGEoZGljZVRleHQpLCBvblJvbGxEaWNlKVxuICAgICk7XG5cbiAgICBjdXJzb3IgPSBlbmQ7XG4gIH1cblxuICBpZiAoY3Vyc29yIDwgdGV4dC5sZW5ndGgpIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dC5zbGljZShjdXJzb3IpKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwZW5kUmVuZGVyZWRBdHRhY2soXG4gIGxpOiBIVE1MTElFbGVtZW50LFxuICBhdHRhY2tUZXh0OiBzdHJpbmcsXG4gIHNldHRpbmdzOiBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdzLFxuICBvcHRpb25zOiBNb25zdGVyUmVuZGVyT3B0aW9uc1xuKTogdm9pZCB7XG4gIGNvbnN0IHsgY29ubmVjdG9yLCBib2R5IH0gPSBzcGxpdEF0dGFja0Nvbm5lY3RvcihhdHRhY2tUZXh0KTtcblxuICBpZiAoY29ubmVjdG9yKSB7XG4gICAgbGkuYXBwZW5kQ2hpbGQoY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItYXR0YWNrLWNvbm5lY3RvclwiLCBgJHtjb25uZWN0b3J9IGApKTtcbiAgfVxuXG4gIGNvbnN0IGF0dGFja1RleHRFbCA9IGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLWF0dGFjay10ZXh0XCIpO1xuXG4gIGlmIChzZXR0aW5ncy5lbmFibGVEaWNlUm9sbGVySW50ZWdyYXRpb24gJiYgb3B0aW9ucy5vblJvbGxEaWNlKSB7XG4gICAgYXBwZW5kQXR0YWNrQm9keVdpdGhEaWNlQnV0dG9ucyhhdHRhY2tUZXh0RWwsIGJvZHksIG9wdGlvbnMub25Sb2xsRGljZSk7XG4gIH0gZWxzZSB7XG4gICAgYXR0YWNrVGV4dEVsLnRleHRDb250ZW50ID0gYm9keTtcbiAgfVxuXG4gIGxpLmFwcGVuZENoaWxkKGF0dGFja1RleHRFbCk7XG59XG5cbmZ1bmN0aW9uIHNwbGl0TGFiZWxBbmRCb2R5KHRleHQ6IHN0cmluZyk6IHsgbGFiZWw6IHN0cmluZzsgYm9keTogc3RyaW5nIH0ge1xuICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiB7IGxhYmVsOiBcIlwiLCBib2R5OiBcIlwiIH07XG4gIH1cblxuICBsZXQgbWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXkgfCBudWxsID0gbnVsbDtcblxuICAvLyAxKSBQYXJlbnRoZXRpY2FsIHNwZWxsLXN0eWxlIGxhYmVsIHVwIHRvIGZpcnN0IHBlcmlvZFxuICAvLyBFeGFtcGxlOiBcIlJheSBvZiBGcm9zdCAoSU5UIDE1KS4gVGFyZ2V0IHRha2VzLi4uXCJcbiAgbWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKC57MSwxMDB9P1xcKFteKV17MSw0MH1cXClcXC4pXFxzKiguKykkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbDogbWF0Y2hbMV0udHJpbSgpLFxuICAgICAgYm9keTogbWF0Y2hbMl0udHJpbSgpXG4gICAgfTtcbiAgfVxuXG4gIC8vIDIpIFN0YW5kYXJkIHNlbnRlbmNlIGxhYmVsXG4gIC8vIEV4YW1wbGU6IFwiRGV2b3VyLiBVc2UgdHVybiB0byBkZXZvdXIuLi5cIlxuICBtYXRjaCA9IHRyaW1tZWQubWF0Y2goL14oW14uIT86XXsxLDgwfVsuIT9dKVxccyooLispJC8pO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGFiZWw6IG1hdGNoWzFdLnRyaW0oKSxcbiAgICAgIGJvZHk6IG1hdGNoWzJdLnRyaW0oKVxuICAgIH07XG4gIH1cblxuICAvLyAzKSBDb2xvbiBsYWJlbFxuICAvLyBFeGFtcGxlOiBcIkRldm91cjogVXNlIHR1cm4gdG8gZGV2b3VyLi4uXCJcbiAgbWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKFteOl17MSw4MH06KVxccyooLispJC8pO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGFiZWw6IG1hdGNoWzFdLnRyaW0oKSxcbiAgICAgIGJvZHk6IG1hdGNoWzJdLnRyaW0oKVxuICAgIH07XG4gIH1cblxuICAvLyA0KSBEYXNoIC8gZW0gZGFzaCBsYWJlbFxuICAvLyBFeGFtcGxlOiBcIlN0b3JtYmxvb2QgLSBFbGVjdHJpY2l0eSBpbW11bmUuXCJcbiAgLy8gRXhhbXBsZTogXCJTdG9ybWJsb29kIFx1MjAxNCBFbGVjdHJpY2l0eSBpbW11bmUuXCJcbiAgbWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKC57MSw4MH0/XFxzWy1cdTIwMTRdKVxccyooLispJC8pO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGFiZWw6IG1hdGNoWzFdLnRyaW0oKSxcbiAgICAgIGJvZHk6IG1hdGNoWzJdLnRyaW0oKVxuICAgIH07XG4gIH1cblxuICByZXR1cm4geyBsYWJlbDogXCJcIiwgYm9keTogdHJpbW1lZCB9O1xufVxuXG5mdW5jdGlvbiBhZGRTZWN0aW9uKFxuICBwYXJlbnQ6IEhUTUxFbGVtZW50LFxuICB0aXRsZTogc3RyaW5nLFxuICBpdGVtczogc3RyaW5nW10sXG4gIGNsYXNzTmFtZTogc3RyaW5nLFxuICBzZXR0aW5nczogU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyxcbiAgb3B0aW9uczogTW9uc3RlclJlbmRlck9wdGlvbnNcbik6IHZvaWQge1xuICBpZiAoaXRlbXMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgY29uc3Qgc2VjdGlvbiA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvblwiKTtcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb24tdGl0bGVcIiwgdGl0bGUpKTtcblxuICBjb25zdCBsaXN0ID0gY3JlYXRlTGlzdChjbGFzc05hbWUpO1xuXG4gIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgIGNvbnN0IGxpID0gY3JlYXRlTGlzdEl0ZW0oKTtcblxuICAgIGNvbnN0IHsgbGFiZWwsIGJvZHkgfSA9IHNwbGl0TGFiZWxBbmRCb2R5KGl0ZW0pO1xuXG4gICAgaWYgKGxhYmVsKSB7XG4gICAgICBsaS5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci1hYmlsaXR5LWxhYmVsXCIsIGxhYmVsKSk7XG4gICAgfVxuXG4gICAgaWYgKGJvZHkpIHtcbiAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICBsaS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIiBcIikpO1xuICAgICAgfVxuICAgICAgY29uc3QgYm9keUVsID0gY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItYWJpbGl0eS10ZXh0XCIpO1xuXG4gICAgICBpZiAoc2V0dGluZ3MuZW5hYmxlRGljZVJvbGxlckludGVncmF0aW9uICYmIG9wdGlvbnMub25Sb2xsRGljZSkge1xuXG4gICAgICAgIGFwcGVuZFRleHRXaXRoRGFtYWdlRGljZUJ1dHRvbnMoYm9keUVsLCBib2R5LCBvcHRpb25zLm9uUm9sbERpY2UpO1xuXG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIGJvZHlFbC50ZXh0Q29udGVudCA9IGJvZHk7XG5cbiAgICAgIH1cblxuICAgICAgbGkuYXBwZW5kQ2hpbGQoYm9keUVsKTtcbiAgICB9XG5cbiAgICBpZiAoIWxhYmVsKSB7XG4gICAgICBpZiAoc2V0dGluZ3MuZW5hYmxlRGljZVJvbGxlckludGVncmF0aW9uICYmIG9wdGlvbnMub25Sb2xsRGljZSkge1xuICAgICAgICBhcHBlbmRUZXh0V2l0aERhbWFnZURpY2VCdXR0b25zKGxpLCBpdGVtLCBvcHRpb25zLm9uUm9sbERpY2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGkudGV4dENvbnRlbnQgPSBpdGVtO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxpc3QuYXBwZW5kQ2hpbGQobGkpO1xuICB9XG5cbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChsaXN0KTtcbiAgcGFyZW50LmFwcGVuZENoaWxkKHNlY3Rpb24pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyTW9uc3RlckJsb2NrKFxuICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICBtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3RlcixcbiAgc2V0dGluZ3M6IFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3MsXG4gIHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdLFxuICBvcHRpb25zOiBNb25zdGVyUmVuZGVyT3B0aW9ucyA9IHt9XG4pOiB2b2lkIHtcbiAgY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XG5cbiAgY29uc3QgY2FyZCA9IGNyZWF0ZURpdihcbiAgICBbXG4gICAgICBcInNkLW1vbnN0ZXItY2FyZFwiLFxuICAgICAgc2V0dGluZ3MuY29tcGFjdE1vZGUgPyBcImlzLWNvbXBhY3RcIiA6IFwiXCJcbiAgICBdXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAuam9pbihcIiBcIilcbiAgKTtcblxuICBjb25zdCBoZWFkZXIgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWhlYWRlclwiKTtcbiAgaGVhZGVyLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItbmFtZVwiLCBtb25zdGVyLm5hbWUpKTtcblxuICBjb25zdCBtZXRhID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1tZXRhXCIpO1xuICBjb25zdCBtZXRhUGFydHM6IEhUTUxFbGVtZW50W10gPSBbXTtcblxuICBpZiAobW9uc3Rlci5sZXZlbCkge1xuICAgIG1ldGFQYXJ0cy5wdXNoKGNyZWF0ZVNwYW4odW5kZWZpbmVkLCBgTGV2ZWwgJHttb25zdGVyLmxldmVsfWApKTtcbiAgfVxuXG4gIGlmIChtb25zdGVyLmFsaWdubWVudCkge1xuICAgIGNvbnN0IGFsaWdubWVudFNwYW4gPSBjcmVhdGVTcGFuKHVuZGVmaW5lZCwgYEFMICR7bW9uc3Rlci5hbGlnbm1lbnR9YCk7XG4gICAgY29uc3QgdG9vbHRpcCA9IGdldEFsaWdubWVudExhYmVsKG1vbnN0ZXIuYWxpZ25tZW50KTtcbiAgICBpZiAodG9vbHRpcCkge1xuICAgICAgYWxpZ25tZW50U3Bhbi50aXRsZSA9IHRvb2x0aXA7XG4gICAgfVxuICAgIG1ldGFQYXJ0cy5wdXNoKGFsaWdubWVudFNwYW4pO1xuICB9XG5cbiAgbWV0YVBhcnRzLmZvckVhY2goKHBhcnQsIGluZGV4KSA9PiB7XG4gICAgbWV0YS5hcHBlbmRDaGlsZChwYXJ0KTtcblxuICAgIGlmIChpbmRleCA8IG1ldGFQYXJ0cy5sZW5ndGggLSAxKSB7XG4gICAgICBtZXRhLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4odW5kZWZpbmVkLCBcIiBcdTIwMjIgXCIpKTtcbiAgICB9XG4gIH0pO1xuXG4gIGhlYWRlci5hcHBlbmRDaGlsZChtZXRhKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG4gIGNvbnN0IGNvcmUgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWNvcmVcIik7XG4gIGNvcmUuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1jb3JlLWl0ZW1cIiwgYEFDICR7bW9uc3Rlci5hY31gKSk7XG4gIGNvcmUuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1jb3JlLWl0ZW1cIiwgYEhQICR7bW9uc3Rlci5ocH1gKSk7XG5cbiAgaWYgKG1vbnN0ZXIubXYpIHtcbiAgICBjb3JlLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItY29yZS1pdGVtXCIsIGBNViAke21vbnN0ZXIubXZ9YCkpO1xuICB9XG5cbiAgY2FyZC5hcHBlbmRDaGlsZChjb3JlKTtcblxuICBpZiAobW9uc3Rlci5hdGsubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGF0a1NlY3Rpb24gPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb25cIik7XG4gICAgYXRrU2VjdGlvbi5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb24tdGl0bGVcIiwgXCJBVFRBQ0tTXCIpKTtcblxuICAgIGNvbnN0IGF0a0xpc3QgPSBjcmVhdGVMaXN0KFwic2QtbW9uc3Rlci1hdHRhY2tzXCIpO1xuICAgIGZvciAoY29uc3QgYXR0YWNrIG9mIG1vbnN0ZXIuYXRrKSB7XG4gICAgICBjb25zdCBsaSA9IGNyZWF0ZUxpc3RJdGVtKFwic2QtbW9uc3Rlci1hdHRhY2tcIik7XG4gICAgICBhcHBlbmRSZW5kZXJlZEF0dGFjayhsaSwgcmVuZGVyQXR0YWNrVGV4dChhdHRhY2spLCBzZXR0aW5ncywgb3B0aW9ucyk7XG4gICAgICBhdGtMaXN0LmFwcGVuZENoaWxkKGxpKTtcbiAgICB9XG5cbiAgICBhdGtTZWN0aW9uLmFwcGVuZENoaWxkKGF0a0xpc3QpO1xuICAgIGNhcmQuYXBwZW5kQ2hpbGQoYXRrU2VjdGlvbik7XG4gIH1cblxuICBjb25zdCBhYmlsaXRpZXMgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb25cIik7XG4gIGFiaWxpdGllcy5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb24tdGl0bGVcIiwgXCJBQklMSVRJRVNcIikpO1xuXG4gIGNvbnN0IGdyaWQgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdGllc1wiKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYFNUUiAke21vbnN0ZXIuc3RhdHMuc3RyfWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYERFWCAke21vbnN0ZXIuc3RhdHMuZGV4fWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYENPTiAke21vbnN0ZXIuc3RhdHMuY29ufWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYElOVCAke21vbnN0ZXIuc3RhdHMuaW50fWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYFdJUyAke21vbnN0ZXIuc3RhdHMud2lzfWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYENIQSAke21vbnN0ZXIuc3RhdHMuY2hhfWApKTtcblxuICBhYmlsaXRpZXMuYXBwZW5kQ2hpbGQoZ3JpZCk7XG4gIGNhcmQuYXBwZW5kQ2hpbGQoYWJpbGl0aWVzKTtcblxuICBhZGRTZWN0aW9uKGNhcmQsIFwiVFJBSVRTXCIsIG1vbnN0ZXIudHJhaXRzLCBcInNkLW1vbnN0ZXItbGlzdFwiLCBzZXR0aW5ncywgb3B0aW9ucyk7XG4gIGFkZFNlY3Rpb24oY2FyZCwgXCJTUEVDSUFMU1wiLCBtb25zdGVyLnNwZWNpYWxzLCBcInNkLW1vbnN0ZXItbGlzdFwiLCBzZXR0aW5ncywgb3B0aW9ucyk7XG4gIGFkZFNlY3Rpb24oY2FyZCwgXCJTUEVMTFNcIiwgbW9uc3Rlci5zcGVsbHMsIFwic2QtbW9uc3Rlci1saXN0XCIsIHNldHRpbmdzLCBvcHRpb25zKTtcbiAgYWRkU2VjdGlvbihjYXJkLCBcIkdFQVJcIiwgbW9uc3Rlci5nZWFyLCBcInNkLW1vbnN0ZXItbGlzdFwiLCBzZXR0aW5ncywgb3B0aW9ucyk7XG5cbiAgaWYgKG1vbnN0ZXIuZGVzY3JpcHRpb24pIHtcbiAgICBjb25zdCBkZXNjID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uXCIpO1xuICAgIGRlc2MuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1kZXNjcmlwdGlvblwiLCBtb25zdGVyLmRlc2NyaXB0aW9uKSk7XG4gICAgY2FyZC5hcHBlbmRDaGlsZChkZXNjKTtcbiAgfVxuXG4gIGlmIChzZXR0aW5ncy5zaG93U291cmNlICYmIG1vbnN0ZXIuc291cmNlKSB7XG4gICAgY29uc3Qgc291cmNlID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1mb290ZXJcIik7XG4gICAgc291cmNlLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLXNvdXJjZVwiLCBgU291cmNlOiAke21vbnN0ZXIuc291cmNlfWApKTtcbiAgICBjYXJkLmFwcGVuZENoaWxkKHNvdXJjZSk7XG4gIH1cblxuICBpZiAoc2V0dGluZ3Muc2hvd1RhZ3MgJiYgbW9uc3Rlci50YWdzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCB0YWdzID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci10YWdzXCIpO1xuICAgIGZvciAoY29uc3QgdGFnIG9mIG1vbnN0ZXIudGFncykge1xuICAgICAgdGFncy5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci10YWdcIiwgdGFnKSk7XG4gICAgfVxuICAgIGNhcmQuYXBwZW5kQ2hpbGQodGFncyk7XG4gIH1cblxuICBpZiAod2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHdhcm5pbmdCb3ggPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXdhcm5pbmctYm94XCIpO1xuICAgIGZvciAoY29uc3Qgd2FybmluZyBvZiB3YXJuaW5ncykge1xuICAgICAgd2FybmluZ0JveC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXdhcm5pbmdcIiwgd2FybmluZykpO1xuICAgIH1cbiAgICBjYXJkLmFwcGVuZENoaWxkKHdhcm5pbmdCb3gpO1xuICB9XG5cbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNhcmQpO1xufSIsICJleHBvcnQgaW50ZXJmYWNlIFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3Mge1xuICBjb21wYWN0TW9kZTogYm9vbGVhbjtcbiAgc2hvd1NvdXJjZTogYm9vbGVhbjtcbiAgc2hvd1RhZ3M6IGJvb2xlYW47XG4gIGVuYWJsZURpY2VSb2xsZXJJbnRlZ3JhdGlvbjogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU1RBVEJMT0NLX1JFTkRFUl9TRVRUSU5HUzogU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyA9IHtcbiAgY29tcGFjdE1vZGU6IHRydWUsXG4gIHNob3dTb3VyY2U6IHRydWUsXG4gIHNob3dUYWdzOiB0cnVlLFxuICBlbmFibGVEaWNlUm9sbGVySW50ZWdyYXRpb246IGZhbHNlXG59OyJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQUErQjs7O0FDSXhCLElBQU0sZUFBZTs7O0FDQXJCLElBQU0sZUFBTixNQUFtQjtBQUFBLEVBR3hCLFlBQVksS0FBVTtBQUNwQixTQUFLLE1BQU07QUFBQSxFQUNi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LFlBQUksQ0FBQyxNQUFNO0FBQ1QsaUJBQU87QUFBQSxRQUNUO0FBRUEsY0FBTSxRQUFRLEtBQUssSUFBSSxjQUFjLGFBQWEsSUFBSTtBQUN0RCxjQUFNLGNBQWMsK0JBQU87QUFFM0IsYUFBSSwyQ0FBYSxvQkFBbUIsYUFBYTtBQUMvQyxpQkFBTztBQUFBLFFBQ1Q7QUFFQSxZQUFJLENBQUMsVUFBVTtBQUNiLGNBQUk7QUFBQSxZQUNGLEtBQUs7QUFBQSxZQUNMLEtBQUs7QUFBQSxZQUNMLEtBQUs7QUFBQSxZQUNMO0FBQUEsVUFDRixFQUFFLEtBQUs7QUFBQSxRQUNUO0FBRUEsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFPQSxXQUFpQjtBQUNmLFlBQVEsSUFBSSxpQ0FBaUM7QUFBQSxFQUMvQztBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJfYiIsICJfYyIsICJpbXBvcnRfb2JzaWRpYW4iLCAic2VjdGlvbiIsICJfYSIsICJfYiJdCn0K
