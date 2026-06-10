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
var import_obsidian7 = require("obsidian");

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
    var _a, _b;
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
      dex: (_b = frontmatter.dex) != null ? _b : (_a = frontmatter.stats) == null ? void 0 : _a.dex,
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
function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}
function parseModifier(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function getHighestMonsterDex(encounter) {
  return encounter.monsters.reduce((highest, monster) => {
    const dex = parseModifier(monster.dex);
    return Math.max(highest, dex);
  }, 0);
}
function generateInitiativeEntries(encounter) {
  var _a, _b;
  const mode = (_a = encounter.initiativeMode) != null ? _a : "individual_monsters";
  if (mode === "none") {
    return [];
  }
  if (mode === "shadowdark_raw") {
    const highestDex = getHighestMonsterDex(encounter);
    return [
      {
        name: "GM / Monsters",
        initiative: rollD20() + highestDex
      }
    ];
  }
  const entries = [];
  for (const monster of encounter.monsters) {
    const qty = Math.max(1, Number((_b = monster.qty) != null ? _b : 1));
    const dexMod = parseModifier(monster.dex);
    for (let i = 1; i <= qty; i++) {
      entries.push({
        name: qty > 1 ? `${monster.name} ${i}` : monster.name,
        initiative: rollD20() + dexMod
      });
    }
  }
  return entries.sort((a, b) => b.initiative - a.initiative);
}
function generateEncounterMarkdown(encounter) {
  var _a, _b, _c, _d;
  const initiativeEntries = generateInitiativeEntries(encounter);
  const initiativeFrontmatter = initiativeEntries.map((entry) => `  - name: ${yamlString(entry.name)}
    initiative: ${entry.initiative}`).join("\n");
  const monsterFrontmatter = encounter.monsters.map((monster) => `  - name: ${yamlString(monster.name)}
    qty: ${monster.qty}
    path: ${yamlString(monster.path)}
    level: ${yamlString(monster.level)}
    ac: ${yamlString(monster.ac)}
    hp: ${yamlString(monster.hp)}
    dex: ${yamlString(monster.dex)}`).join("\n");
  return `---
shadowdarkType: encounter
name: ${yamlString(encounter.name)}
status: ${yamlString((_a = encounter.status) != null ? _a : "planned")}

partyLevel: ${(_b = encounter.partyLevel) != null ? _b : 1}
partySize: ${(_c = encounter.partySize) != null ? _c : 4}

terrain: ${yamlString(encounter.terrain)}
light: ${yamlString(encounter.light)}

monsters:
${monsterFrontmatter || "  []"}

initiativeMode: ${(_d = encounter.initiativeMode) != null ? _d : "individual_monsters"}
initiative:
${initiativeFrontmatter || "  []"}

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
  constructor(app, plugin, monsterIndex, encounterService, fileToEdit, mode = fileToEdit ? "edit" : "create") {
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
    this.status = "planned";
    this.initiativeMode = "individual_monsters";
    this.setup = "";
    this.readAloud = "";
    this.tactics = "";
    this.treasure = "";
    this.notes = "";
    this.mode = "create";
    this.plugin = plugin;
    this.monsterIndex = monsterIndex;
    this.encounterService = encounterService;
    this.fileToEdit = fileToEdit;
    this.mode = mode;
    this.partyLevel = plugin.settings.defaultPartyLevel;
    this.partySize = plugin.settings.defaultPartySize;
    this.initiativeMode = plugin.settings.defaultInitiativeMode;
  }
  get isEditing() {
    return this.mode === "edit";
  }
  get isDuplicating() {
    return this.mode === "duplicate";
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
      text: this.isEditing ? "Edit Shadowdark Encounter" : this.isDuplicating ? "Duplicate Shadowdark Encounter" : "Create Shadowdark Encounter"
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
    const nameRow = contentEl.createDiv({
      cls: "sd-encounter-name-row"
    });
    const nameField = nameRow.createDiv({
      cls: "sd-encounter-name-field"
    });
    nameField.createEl("label", {
      text: "Encounter Name"
    });
    const nameInput = nameField.createEl("input", {
      type: "text",
      placeholder: "Goblin Ambush"
    });
    nameInput.value = this.encounterName;
    nameInput.addEventListener("input", () => {
      this.encounterName = nameInput.value;
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
    this.renderFooterButtons(buttonEl, [
      {
        label: "Next",
        cta: true,
        onClick: () => {
          if (!this.encounterName.trim()) {
            new import_obsidian3.Notice("Encounter name is required.");
            return;
          }
          this.currentStep = "details";
          this.render();
        }
      }
    ]);
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
    const statusField = detailsEl.createDiv({
      cls: "sd-encounter-details-field"
    });
    statusField.createEl("label", {
      text: "Status"
    });
    const statusSelect = statusField.createEl("select");
    statusSelect.createEl("option", {
      text: "Planned",
      value: "planned"
    });
    statusSelect.createEl("option", {
      text: "Running",
      value: "running"
    });
    statusSelect.createEl("option", {
      text: "Completed",
      value: "completed"
    });
    statusSelect.createEl("option", {
      text: "Archived",
      value: "archived"
    });
    statusSelect.value = this.status;
    statusSelect.addEventListener("change", () => {
      this.status = statusSelect.value;
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
    const initiativeField = detailsEl.createDiv({
      cls: "sd-encounter-details-field"
    });
    initiativeField.createEl("label", {
      text: "Initiative Mode"
    });
    const initiativeSelect = initiativeField.createEl("select");
    initiativeSelect.createEl("option", {
      text: "Individual Monsters",
      value: "individual_monsters"
    });
    initiativeSelect.createEl("option", {
      text: "Shadowdark RAW",
      value: "shadowdark_raw"
    });
    initiativeSelect.createEl("option", {
      text: "None",
      value: "none"
    });
    initiativeSelect.value = this.initiativeMode;
    initiativeSelect.addEventListener("change", () => {
      this.initiativeMode = initiativeSelect.value;
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
      text: "Preview the markdown that will be saved."
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
        label: this.isEditing ? "Save Encounter" : this.isDuplicating ? "Create Duplicate" : "Create Encounter",
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
      status: this.status,
      partyLevel: this.partyLevel,
      partySize: this.partySize,
      initiativeMode: this.initiativeMode,
      monsters: this.selectedMonsters,
      setup: this.setup,
      readAloud: this.readAloud,
      tactics: this.tactics,
      treasure: this.treasure,
      notes: this.notes
    };
  }
  async loadEncounterFromFile(file) {
    var _a, _b, _c;
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache == null ? void 0 : cache.frontmatter;
    if (!frontmatter || frontmatter.shadowdarkType !== "encounter") {
      new import_obsidian3.Notice("This file is not a Shadowdark encounter.");
      return;
    }
    this.initiativeMode = frontmatter.initiativeMode === "shadowdark_raw" || frontmatter.initiativeMode === "individual_monsters" || frontmatter.initiativeMode === "none" ? frontmatter.initiativeMode : "individual_monsters";
    this.encounterName = String((_a = frontmatter.name) != null ? _a : file.basename);
    if (this.isDuplicating) {
      this.encounterName = `${this.encounterName} Copy`;
    }
    this.status = typeof frontmatter.status === "string" ? frontmatter.status : "planned";
    this.partyLevel = Number((_b = frontmatter.partyLevel) != null ? _b : 1);
    this.partySize = Number((_c = frontmatter.partySize) != null ? _c : 4);
    this.selectedMonsters = Array.isArray(frontmatter.monsters) ? frontmatter.monsters.map((monster) => {
      var _a2, _b2, _c2, _d, _e, _f, _g;
      return {
        name: String((_a2 = monster.name) != null ? _a2 : "Unknown Monster"),
        path: String((_b2 = monster.path) != null ? _b2 : ""),
        qty: Number((_c2 = monster.qty) != null ? _c2 : 1),
        level: String((_d = monster.level) != null ? _d : ""),
        ac: String((_e = monster.ac) != null ? _e : ""),
        hp: String((_f = monster.hp) != null ? _f : ""),
        dex: String((_g = monster.dex) != null ? _g : "")
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
      const row = new DocumentFragment();
      const wrapper = document.createElement("div");
      wrapper.className = "sd-encounter-monster-row";
      const info = document.createElement("div");
      info.className = "sd-encounter-monster-info";
      const name = document.createElement("div");
      name.className = "sd-encounter-monster-name";
      name.textContent = monster.name;
      const meta = document.createElement("div");
      meta.className = "sd-encounter-monster-meta";
      meta.textContent = [
        monster.level ? `LV ${monster.level}` : null,
        monster.ac ? `AC ${monster.ac}` : null,
        monster.hp ? `HP ${monster.hp}` : null
      ].filter(Boolean).join(" \u2022 ") || monster.path;
      info.appendChild(name);
      info.appendChild(meta);
      const actions = document.createElement("div");
      actions.className = "sd-encounter-monster-actions";
      const previewButton = document.createElement("button");
      previewButton.textContent = "Preview";
      previewButton.addEventListener("click", (event) => {
        showMonsterPreview(this.app, event, monster);
      });
      const addButton = document.createElement("button");
      addButton.textContent = "Add";
      addButton.classList.add("mod-cta");
      addButton.addEventListener("click", () => {
        this.addMonster(monster);
      });
      actions.appendChild(previewButton);
      actions.appendChild(addButton);
      wrapper.appendChild(info);
      wrapper.appendChild(actions);
      row.appendChild(wrapper);
      resultsEl.appendChild(row);
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
      const rowEl = selectedEl.createDiv({
        cls: "sd-encounter-selected-row"
      });
      const infoEl = rowEl.createDiv({
        cls: "sd-encounter-selected-info"
      });
      infoEl.createDiv({
        cls: "sd-encounter-selected-name",
        text: monster.name
      });
      infoEl.createDiv({
        cls: "sd-encounter-selected-path",
        text: monster.path
      });
      const qtyInput = rowEl.createEl("input", {
        type: "number"
      });
      qtyInput.value = String(monster.qty);
      qtyInput.min = "1";
      qtyInput.addEventListener("change", () => {
        const qty = Number(qtyInput.value);
        monster.qty = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;
        this.renderEncounterSummary();
      });
      const removeButton = rowEl.createEl("button", {
        text: "Remove"
      });
      removeButton.addEventListener("click", () => {
        this.selectedMonsters = this.selectedMonsters.filter(
          (selected) => selected.path !== monster.path
        );
        this.renderSelectedMonsters();
        this.renderEncounterSummary();
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
        hp: monster.hp,
        dex: monster.dex
      });
    }
    this.renderSelectedMonsters();
    this.renderEncounterSummary();
  }
  async saveEncounter() {
    const name = this.encounterName.trim();
    if (!name) {
      new import_obsidian3.Notice("Encounter name is required.");
      return;
    }
    try {
      if (this.isEditing && this.fileToEdit) {
        await this.encounterService.updateEncounterNote(
          this.fileToEdit,
          this.getEncounterData()
        );
        await new Promise(
          (resolve) => window.setTimeout(resolve, 300)
        );
        const leaf = this.app.workspace.getLeaf(false);
        await this.encounterService.updateEncounterNote(
          this.fileToEdit,
          this.getEncounterData()
        );
        await new Promise(
          (resolve) => window.setTimeout(resolve, 300)
        );
        const view = this.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
        await (view == null ? void 0 : view.previewMode.rerender(true));
        new import_obsidian3.Notice("Encounter saved.");
      } else {
        await this.encounterService.createEncounterNote(
          this.getEncounterData()
        );
        new import_obsidian3.Notice(
          this.isDuplicating ? "Encounter duplicated." : "Encounter created."
        );
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
  renderInitiative(container, frontmatter) {
    var _a, _b;
    const initiative = Array.isArray(frontmatter.initiative) ? frontmatter.initiative : [];
    if (initiative.length === 0) {
      return;
    }
    const initiativeEl = container.createDiv({
      cls: "sd-encounter-rendered-initiative"
    });
    initiativeEl.createEl("h3", {
      text: "Initiative"
    });
    const listEl = initiativeEl.createEl("ul");
    for (const entry of initiative) {
      const itemEl = listEl.createEl("li");
      itemEl.createEl("span", {
        cls: "sd-encounter-initiative-roll",
        text: String((_a = entry.initiative) != null ? _a : 0)
      });
      itemEl.createEl("span", {
        text: String((_b = entry.name) != null ? _b : "Unknown")
      });
    }
  }
  register() {
    this.plugin.registerMarkdownPostProcessor(
      (el, ctx) => {
        void this.process(el, ctx);
      }
    );
  }
  async process(el, ctx) {
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
    const content = await this.plugin.app.vault.read(file);
    const existingRender = el.querySelector(
      ".sd-encounter-rendered"
    );
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
        frontmatter.partySize ? `${frontmatter.partySize} PCs` : null
      ].filter(Boolean).join(" \u2022 ")
    });
    if (frontmatter.status) {
      container.createEl("span", {
        cls: `sd-encounter-status-badge is-${frontmatter.status}`,
        text: String(frontmatter.status).toUpperCase()
      });
    }
    this.renderDashboardStats(container, frontmatter);
    this.renderCompactMonsterRoster(container, frontmatter);
    if (this.plugin.settings.showInitiative) {
      this.renderInitiative(container, frontmatter);
    }
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
    const difficulty = this.plugin.settings.showDifficulty ? ` \u2022 ${this.getEncounterDifficulty(frontmatter)}` : "";
    container.createEl("p", {
      cls: "sd-encounter-rendered-stats",
      text: `${totalMonsters} Monsters \u2022 ${uniqueMonsters} Unique \u2022 Avg Lv ${averageLevel.toFixed(1)}` + difficulty
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

// src/settings.ts
var DEFAULT_SETTINGS = {
  encounterFolder: "Encounters",
  defaultPartyLevel: 1,
  defaultPartySize: 4,
  defaultInitiativeMode: "shadowdark_raw",
  showDifficulty: true,
  showInitiative: true
};

// src/settings/ShadowdarkEncountersSettingTab.ts
var import_obsidian5 = require("obsidian");
var ShadowdarkEncountersSettingTab = class extends import_obsidian5.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", {
      text: "Shadowdark Encounters Settings"
    });
    new import_obsidian5.Setting(containerEl).setName("Encounter Folder").setDesc("Folder where encounter notes are created.").addText(
      (text) => text.setPlaceholder("Encounters").setValue(this.plugin.settings.encounterFolder).onChange(async (value) => {
        this.plugin.settings.encounterFolder = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Default Party Level").addText(
      (text) => text.setValue(
        String(this.plugin.settings.defaultPartyLevel)
      ).onChange(async (value) => {
        this.plugin.settings.defaultPartyLevel = Number(value) || 1;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Default Party Size").addText(
      (text) => text.setValue(
        String(this.plugin.settings.defaultPartySize)
      ).onChange(async (value) => {
        this.plugin.settings.defaultPartySize = Number(value) || 4;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Default Initiative Mode").setDesc("Choose how new encounters generate initiative.").addDropdown(
      (dropdown) => dropdown.addOption("shadowdark_raw", "Shadowdark RAW").addOption("individual_monsters", "Individual Monsters").addOption("none", "None").setValue(this.plugin.settings.defaultInitiativeMode).onChange(async (value) => {
        this.plugin.settings.defaultInitiativeMode = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Show Difficulty Rating").setDesc("Display encounter difficulty in the rendered encounter card.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showDifficulty).onChange(async (value) => {
        this.plugin.settings.showDifficulty = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Show Initiative Tracker").setDesc("Display initiative in the rendered encounter card.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showInitiative).onChange(async (value) => {
        this.plugin.settings.showInitiative = value;
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/services/EncounterIndex.ts
var EncounterIndex = class {
  constructor(app) {
    this.app = app;
  }
  getAllEncounters() {
    return this.app.vault.getMarkdownFiles().map((file) => this.getEncounterFromFile(file)).filter((encounter) => encounter !== null).sort((a, b) => a.name.localeCompare(b.name));
  }
  getEncounterFromFile(file) {
    var _a, _b, _c, _d, _e;
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache == null ? void 0 : cache.frontmatter;
    if ((frontmatter == null ? void 0 : frontmatter.shadowdarkType) !== "encounter") {
      return null;
    }
    const monsters = Array.isArray(frontmatter.monsters) ? frontmatter.monsters : [];
    const monsterCount = monsters.reduce(
      (sum, monster) => {
        var _a2;
        return sum + Number((_a2 = monster.qty) != null ? _a2 : 1);
      },
      0
    );
    let totalLevels = 0;
    let countedMonsters = 0;
    for (const monster of monsters) {
      const level = Number(monster.level);
      const qty = Number((_a = monster.qty) != null ? _a : 1);
      if (Number.isFinite(level)) {
        totalLevels += level * qty;
        countedMonsters += qty;
      }
    }
    return {
      name: String((_b = frontmatter.name) != null ? _b : file.basename),
      path: file.path,
      status: String((_c = frontmatter.status) != null ? _c : "planned"),
      partyLevel: Number((_d = frontmatter.partyLevel) != null ? _d : 1),
      partySize: Number((_e = frontmatter.partySize) != null ? _e : 4),
      monsterCount,
      uniqueMonsterCount: monsters.length,
      averageMonsterLevel: countedMonsters > 0 ? totalLevels / countedMonsters : 0
    };
  }
  searchEncounters(query) {
    const lower = query.toLowerCase().trim();
    if (!lower) {
      return this.getAllEncounters();
    }
    return this.getAllEncounters().filter(
      (encounter) => encounter.name.toLowerCase().includes(lower)
    );
  }
};

// src/modals/EncounterBrowserModal.ts
var import_obsidian6 = require("obsidian");
var EncounterBrowserModal = class extends import_obsidian6.Modal {
  constructor(app, plugin, encounterIndex) {
    super(app);
    this.searchText = "";
    this.statusFilter = "";
    this.partyLevelFilter = "";
    this.sortMode = "name-asc";
    this.plugin = plugin;
    this.encounterIndex = encounterIndex;
  }
  onOpen() {
    this.modalEl.addClass("sd-encounter-browser-modal");
    this.render();
  }
  onClose() {
    this.contentEl.empty();
  }
  render() {
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
  renderFilters(containerEl) {
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
  sortEncounters(encounters) {
    return [...encounters].sort((a, b) => {
      var _a, _b, _c, _d, _e, _f;
      switch (this.sortMode) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "level-asc":
          return Number((_a = a.partyLevel) != null ? _a : 999) - Number((_b = b.partyLevel) != null ? _b : 999) || a.name.localeCompare(b.name);
        case "level-desc":
          return Number((_c = b.partyLevel) != null ? _c : -1) - Number((_d = a.partyLevel) != null ? _d : -1) || a.name.localeCompare(b.name);
        case "status":
          return String((_e = a.status) != null ? _e : "").localeCompare(
            String((_f = b.status) != null ? _f : "")
          ) || a.name.localeCompare(b.name);
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }
  renderResults() {
    this.resultsEl.empty();
    let encounters = this.encounterIndex.searchEncounters(this.searchText);
    if (this.statusFilter) {
      encounters = encounters.filter(
        (encounter) => encounter.status === this.statusFilter
      );
    }
    if (this.partyLevelFilter) {
      encounters = encounters.filter(
        (encounter) => {
          var _a;
          return String((_a = encounter.partyLevel) != null ? _a : "") === this.partyLevelFilter;
        }
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
  renderEncounterRow(encounter) {
    var _a, _b;
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
      text: `PL ${(_a = encounter.partyLevel) != null ? _a : "?"} \u2022 ${(_b = encounter.partySize) != null ? _b : "?"} PCs \u2022 ${encounter.monsterCount} Monsters \u2022 Avg Lv ${encounter.averageMonsterLevel.toFixed(1)}`
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
  async getEncounterFile(encounter) {
    const file = this.app.vault.getAbstractFileByPath(encounter.path);
    if (!(file instanceof import_obsidian6.TFile)) {
      new import_obsidian6.Notice("Encounter file not found.");
      return null;
    }
    return file;
  }
  async openEncounter(encounter, mode) {
    const file = await this.getEncounterFile(encounter);
    if (!file) {
      return;
    }
    if (mode === "right") {
      await this.app.workspace.getLeaf("split", "vertical").openFile(file);
      return;
    }
    if (mode === "new-tab") {
      await this.app.workspace.getLeaf(true).openFile(file);
      return;
    }
    await this.app.workspace.getLeaf(false).openFile(file);
    this.close();
  }
  async editEncounter(encounter) {
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
  async duplicateEncounter(encounter) {
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
  showContextMenu(event, encounter) {
    const menu = new import_obsidian6.Menu();
    menu.addItem(
      (item) => item.setTitle("Open").onClick(async () => {
        await this.openEncounter(encounter, "current");
      })
    );
    menu.addItem(
      (item) => item.setTitle("Open in New Tab").onClick(async () => {
        await this.openEncounter(encounter, "new-tab");
      })
    );
    menu.addItem(
      (item) => item.setTitle("Open to the Right").onClick(async () => {
        await this.openEncounter(encounter, "right");
      })
    );
    menu.addSeparator();
    menu.addItem(
      (item) => item.setTitle("Edit").onClick(async () => {
        await this.editEncounter(encounter);
      })
    );
    menu.addItem(
      (item) => item.setTitle("Duplicate").onClick(async () => {
        await this.duplicateEncounter(encounter);
      })
    );
    menu.showAtMouseEvent(event);
  }
};

// src/main.ts
var ShadowdarkEncountersPlugin = class extends import_obsidian7.Plugin {
  constructor() {
    super(...arguments);
    this.api = {
      getAllMonsters: () => this.monsterIndex.getAllMonsters()
    };
  }
  async onload() {
    console.log("Loading Shadowdark Encounters");
    await this.loadSettings();
    this.addSettingTab(
      new ShadowdarkEncountersSettingTab(
        this.app,
        this
      )
    );
    this.monsterIndex = new MonsterIndex(this.app);
    this.encounterService = new EncounterService(this.app);
    this.encounterRenderer = new EncounterRenderer(this);
    this.encounterRenderer.register();
    this.encounterIndex = new EncounterIndex(this.app);
    this.addCommand({
      id: "create-shadowdark-encounter",
      name: "Create Shadowdark Encounter",
      callback: () => {
        new CreateEncounterModal(
          this.app,
          this,
          this.monsterIndex,
          this.encounterService
        ).open();
      }
    });
    this.addCommand({
      id: "browse-shadowdark-encounters",
      name: "Browse Shadowdark Encounters",
      callback: () => {
        new EncounterBrowserModal(
          this.app,
          this,
          this.encounterIndex
        ).open();
      }
    });
    this.addCommand({
      id: "duplicate-shadowdark-encounter",
      name: "Duplicate Current Shadowdark Encounter",
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
            this,
            this.monsterIndex,
            this.encounterService,
            file,
            "duplicate"
          ).open();
        }
        return true;
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
            this,
            this.monsterIndex,
            this.encounterService,
            file
          ).open();
        }
        return true;
      }
    });
  }
  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  onunload() {
    console.log("Unloading Shadowdark Encounters");
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL2NvbnN0YW50cy9wbHVnaW4udHMiLCAic3JjL3NlcnZpY2VzL01vbnN0ZXJJbmRleC50cyIsICJzcmMvc2VydmljZXMvRW5jb3VudGVyU2VydmljZS50cyIsICJzcmMvdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlLnRzIiwgInNyYy9tb2RhbHMvQ3JlYXRlRW5jb3VudGVyTW9kYWwudHMiLCAic3JjL2NvbXBvbmVudHMvTW9uc3RlclByZXZpZXdQb3BvdmVyLnRzIiwgInNyYy9yZW5kZXJlcnMvRW5jb3VudGVyUmVuZGVyZXIudHMiLCAic3JjL3N0YXRibG9ja3NDb21wYXQvbm9ybWFsaXplTW9uc3Rlci50cyIsICJzcmMvc3RhdGJsb2Nrc0NvbXBhdC9wYXJzZUZyb250TWF0dGVyLnRzIiwgInNyYy9zdGF0YmxvY2tzQ29tcGF0L3JlbmRlck1vbnN0ZXJCbG9jay50cyIsICJzcmMvc3RhdGJsb2Nrc0NvbXBhdC9zZXR0aW5ncy50cyIsICJzcmMvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL1NoYWRvd2RhcmtFbmNvdW50ZXJzU2V0dGluZ1RhYi50cyIsICJzcmMvc2VydmljZXMvRW5jb3VudGVySW5kZXgudHMiLCAic3JjL21vZGFscy9FbmNvdW50ZXJCcm93c2VyTW9kYWwudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IE5vdGljZSwgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IE1vbnN0ZXJJbmRleCB9IGZyb20gXCIuL3NlcnZpY2VzL01vbnN0ZXJJbmRleFwiO1xuaW1wb3J0IHsgRW5jb3VudGVyU2VydmljZSB9IGZyb20gXCIuL3NlcnZpY2VzL0VuY291bnRlclNlcnZpY2VcIjtcbmltcG9ydCB7IENyZWF0ZUVuY291bnRlck1vZGFsIH0gZnJvbSBcIi4vbW9kYWxzL0NyZWF0ZUVuY291bnRlck1vZGFsXCI7XG5cbmltcG9ydCB7IEVuY291bnRlclJlbmRlcmVyIH0gZnJvbSBcIi4vcmVuZGVyZXJzL0VuY291bnRlclJlbmRlcmVyXCI7XG5cbmltcG9ydCB7XG4gIFNoYWRvd2RhcmtFbmNvdW50ZXJzU2V0dGluZ3MsXG4gIERFRkFVTFRfU0VUVElOR1Ncbn0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcblxuaW1wb3J0IHsgU2hhZG93ZGFya0VuY291bnRlcnNTZXR0aW5nVGFiIH1cbiAgZnJvbSBcIi4vc2V0dGluZ3MvU2hhZG93ZGFya0VuY291bnRlcnNTZXR0aW5nVGFiXCI7XG5cbmltcG9ydCB7IEVuY291bnRlckluZGV4IH0gZnJvbSBcIi4vc2VydmljZXMvRW5jb3VudGVySW5kZXhcIjtcblxuaW1wb3J0IHsgRW5jb3VudGVyQnJvd3Nlck1vZGFsIH0gZnJvbSBcIi4vbW9kYWxzL0VuY291bnRlckJyb3dzZXJNb2RhbFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTaGFkb3dkYXJrRW5jb3VudGVyc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG5cbiAgc2V0dGluZ3MhOiBTaGFkb3dkYXJrRW5jb3VudGVyc1NldHRpbmdzO1xuXG4gIG1vbnN0ZXJJbmRleCE6IE1vbnN0ZXJJbmRleDtcblxuICBlbmNvdW50ZXJTZXJ2aWNlITogRW5jb3VudGVyU2VydmljZTtcblxuICBlbmNvdW50ZXJSZW5kZXJlciE6IEVuY291bnRlclJlbmRlcmVyO1xuXG4gIGVuY291bnRlckluZGV4ITogRW5jb3VudGVySW5kZXg7XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgY29uc29sZS5sb2coXCJMb2FkaW5nIFNoYWRvd2RhcmsgRW5jb3VudGVyc1wiKTtcblxuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLmFkZFNldHRpbmdUYWIoXG4gICAgICBuZXcgU2hhZG93ZGFya0VuY291bnRlcnNTZXR0aW5nVGFiKFxuICAgICAgICB0aGlzLmFwcCxcbiAgICAgICAgdGhpc1xuICAgICAgKVxuICAgICk7XG5cbiAgICB0aGlzLm1vbnN0ZXJJbmRleCA9IFxuICAgICAgbmV3IE1vbnN0ZXJJbmRleCh0aGlzLmFwcCk7XG5cbiAgICB0aGlzLmVuY291bnRlclNlcnZpY2UgPVxuICAgICAgbmV3IEVuY291bnRlclNlcnZpY2UodGhpcy5hcHApO1xuXG4gICAgdGhpcy5lbmNvdW50ZXJSZW5kZXJlciA9IG5ldyBFbmNvdW50ZXJSZW5kZXJlcih0aGlzKTtcbiAgICB0aGlzLmVuY291bnRlclJlbmRlcmVyLnJlZ2lzdGVyKCk7XG4gICAgdGhpcy5lbmNvdW50ZXJJbmRleCA9IG5ldyBFbmNvdW50ZXJJbmRleCh0aGlzLmFwcCk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiY3JlYXRlLXNoYWRvd2RhcmstZW5jb3VudGVyXCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZSBTaGFkb3dkYXJrIEVuY291bnRlclwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgbmV3IENyZWF0ZUVuY291bnRlck1vZGFsKFxuICAgICAgICAgIHRoaXMuYXBwLFxuICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgdGhpcy5tb25zdGVySW5kZXgsXG4gICAgICAgICAgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlXG4gICAgICAgICkub3BlbigpO1xuICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiYnJvd3NlLXNoYWRvd2RhcmstZW5jb3VudGVyc1wiLFxuICAgICAgbmFtZTogXCJCcm93c2UgU2hhZG93ZGFyayBFbmNvdW50ZXJzXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICBuZXcgRW5jb3VudGVyQnJvd3Nlck1vZGFsKFxuICAgICAgICAgIHRoaXMuYXBwLFxuICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgdGhpcy5lbmNvdW50ZXJJbmRleFxuICAgICAgICApLm9wZW4oKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJkdXBsaWNhdGUtc2hhZG93ZGFyay1lbmNvdW50ZXJcIixcbiAgICAgIG5hbWU6IFwiRHVwbGljYXRlIEN1cnJlbnQgU2hhZG93ZGFyayBFbmNvdW50ZXJcIixcbiAgICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZykgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcblxuICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgICAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlcjtcblxuICAgICAgICBpZiAoZnJvbnRtYXR0ZXI/LnNoYWRvd2RhcmtUeXBlICE9PSBcImVuY291bnRlclwiKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjaGVja2luZykge1xuICAgICAgICAgIG5ldyBDcmVhdGVFbmNvdW50ZXJNb2RhbChcbiAgICAgICAgICAgIHRoaXMuYXBwLFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIHRoaXMubW9uc3RlckluZGV4LFxuICAgICAgICAgICAgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlLFxuICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgIFwiZHVwbGljYXRlXCJcbiAgICAgICAgICApLm9wZW4oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImVkaXQtc2hhZG93ZGFyay1lbmNvdW50ZXJcIixcbiAgICAgIG5hbWU6IFwiRWRpdCBDdXJyZW50IFNoYWRvd2RhcmsgRW5jb3VudGVyXCIsXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG5cbiAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICAgICAgY29uc3QgZnJvbnRtYXR0ZXIgPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG5cbiAgICAgICAgaWYgKGZyb250bWF0dGVyPy5zaGFkb3dkYXJrVHlwZSAhPT0gXCJlbmNvdW50ZXJcIikge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY2hlY2tpbmcpIHtcbiAgICAgICAgICBuZXcgQ3JlYXRlRW5jb3VudGVyTW9kYWwoXG4gICAgICAgICAgICB0aGlzLmFwcCxcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXJJbmRleCxcbiAgICAgICAgICAgIHRoaXMuZW5jb3VudGVyU2VydmljZSxcbiAgICAgICAgICAgIGZpbGVcbiAgICAgICAgICApLm9wZW4oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFwaSA9IHtcbiAgICBnZXRBbGxNb25zdGVyczogKCkgPT5cbiAgICAgICAgdGhpcy5tb25zdGVySW5kZXguZ2V0QWxsTW9uc3RlcnMoKVxuICAgIH07XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICBERUZBVUxUX1NFVFRJTkdTLFxuICAgICAgYXdhaXQgdGhpcy5sb2FkRGF0YSgpXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gICAgY29uc29sZS5sb2coXCJVbmxvYWRpbmcgU2hhZG93ZGFyayBFbmNvdW50ZXJzXCIpO1xuICB9XG59IiwgImV4cG9ydCBjb25zdCBQTFVHSU5fSUQgPSBcInNoYWRvd2RhcmstZW5jb3VudGVyc1wiO1xuXG5leHBvcnQgY29uc3QgRU5DT1VOVEVSX1RZUEUgPSBcImVuY291bnRlclwiO1xuXG5leHBvcnQgY29uc3QgTU9OU1RFUl9UWVBFID0gXCJtb25zdGVyXCI7IiwgImltcG9ydCB7IEFwcCwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IE1PTlNURVJfVFlQRSB9IGZyb20gXCIuLi9jb25zdGFudHMvcGx1Z2luXCI7XG5pbXBvcnQgeyBNb25zdGVyU3VtbWFyeSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmV4cG9ydCBjbGFzcyBNb25zdGVySW5kZXgge1xuICBhcHA6IEFwcDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICB9XG5cbiAgc2VhcmNoTW9uc3RlcnMocXVlcnk6IHN0cmluZyk6IE1vbnN0ZXJTdW1tYXJ5W10ge1xuICAgIGNvbnN0IGxvd2VyID0gcXVlcnkudG9Mb3dlckNhc2UoKS50cmltKCk7XG5cbiAgICBpZiAoIWxvd2VyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEFsbE1vbnN0ZXJzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0QWxsTW9uc3RlcnMoKS5maWx0ZXIoKG1vbnN0ZXIpID0+XG4gICAgICAgIG1vbnN0ZXIubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGxvd2VyKVxuICAgICk7XG59XG5cbiAgZ2V0QWxsTW9uc3RlcnMoKTogTW9uc3RlclN1bW1hcnlbXSB7XG4gICAgY29uc3QgZmlsZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG5cbiAgICBjb25zdCBtb25zdGVyczogTW9uc3RlclN1bW1hcnlbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBjb25zdCBtb25zdGVyID0gdGhpcy5nZXRNb25zdGVyRnJvbUZpbGUoZmlsZSk7XG5cbiAgICAgIGlmIChtb25zdGVyKSB7XG4gICAgICAgIG1vbnN0ZXJzLnB1c2gobW9uc3Rlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vbnN0ZXJzLnNvcnQoKGEsIGIpID0+XG4gICAgICBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpXG4gICAgKTtcbiAgfVxuXG4gIGdldE1vbnN0ZXJGcm9tRmlsZShmaWxlOiBURmlsZSk6IE1vbnN0ZXJTdW1tYXJ5IHwgbnVsbCB7XG4gICAgY29uc3QgY2FjaGUgPVxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG5cbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlcjtcblxuICAgIGlmICghZnJvbnRtYXR0ZXIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChmcm9udG1hdHRlci5zaGFkb3dkYXJrVHlwZSAhPT0gTU9OU1RFUl9UWVBFKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogZnJvbnRtYXR0ZXIubmFtZSB8fCBmaWxlLmJhc2VuYW1lLFxuICAgICAgcGF0aDogZmlsZS5wYXRoLFxuXG4gICAgICBsZXZlbDogZnJvbnRtYXR0ZXIubGV2ZWwsXG4gICAgICBhYzogZnJvbnRtYXR0ZXIuYWMsXG4gICAgICBocDogZnJvbnRtYXR0ZXIuaHAsXG4gICAgICBkZXg6IGZyb250bWF0dGVyLmRleCA/PyBmcm9udG1hdHRlci5zdGF0cz8uZGV4LFxuXG4gICAgICBhdGs6IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIuYXRrKVxuICAgICAgICA/IGZyb250bWF0dGVyLmF0a1swXVxuICAgICAgICA6IGZyb250bWF0dGVyLmF0ayxcblxuICAgICAgdHJhaXRzOiBBcnJheS5pc0FycmF5KGZyb250bWF0dGVyLnRyYWl0cylcbiAgICAgICAgPyBmcm9udG1hdHRlci50cmFpdHMuc2xpY2UoMCwgMilcbiAgICAgICAgOiBbXSxcblxuICAgICAgdGFnczogZnJvbnRtYXR0ZXIudGFncyB8fCBbXVxuICAgIH07XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBub3JtYWxpemVQYXRoLCBURmlsZSwgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBFbmNvdW50ZXJEYXRhIH0gZnJvbSBcIi4uL3R5cGVzL2VuY291bnRlcnNcIjtcbmltcG9ydCB7IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24gfSBmcm9tIFwiLi4vdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBFbmNvdW50ZXJTZXJ2aWNlIHtcbiAgYXBwOiBBcHA7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUVuY291bnRlck5vdGUoZW5jb3VudGVyOiBFbmNvdW50ZXJEYXRhKSB7XG4gICAgY29uc3QgY29udGVudCA9IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24oZW5jb3VudGVyKTtcblxuICAgIGNvbnN0IHNhZmVOYW1lID0gZW5jb3VudGVyLm5hbWVcbiAgICAgIC5yZXBsYWNlKC9bXFxcXC86Kj9cIjw+fF0vZywgXCJcIilcbiAgICAgIC50cmltKCk7XG5cbiAgICBjb25zdCBmb2xkZXJQYXRoID0gXCJFbmNvdW50ZXJzXCI7XG4gICAgY29uc3QgZmlsZVBhdGggPSBub3JtYWxpemVQYXRoKGAke2ZvbGRlclBhdGh9LyR7c2FmZU5hbWV9Lm1kYCk7XG5cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihmb2xkZXJQYXRoKTtcblxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUoZmlsZVBhdGgsIGNvbnRlbnQpO1xuXG4gICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUoZmlsZSk7XG5cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlcihwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcblxuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIocGF0aCk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVFbmNvdW50ZXJOb3RlKFxuICAgIGZpbGU6IFRGaWxlLFxuICAgIGVuY291bnRlcjogRW5jb3VudGVyRGF0YVxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjb250ZW50ID0gZ2VuZXJhdGVFbmNvdW50ZXJNYXJrZG93bihlbmNvdW50ZXIpO1xuXG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGNvbnRlbnQpO1xuICB9XG5cbn0iLCAiaW1wb3J0IHsgRW5jb3VudGVyRGF0YSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmZ1bmN0aW9uIHlhbWxTdHJpbmcodmFsdWU6IHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSA/PyBcIlwiKTtcbn1cblxuZnVuY3Rpb24gc2VjdGlvbih0aXRsZTogc3RyaW5nLCBjb250ZW50Pzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAjIyAke3RpdGxlfVxuXG4ke2NvbnRlbnQ/LnRyaW0oKSB8fCBcIlwifVxuYDtcbn1cblxuZnVuY3Rpb24gcm9sbEQyMCgpOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjApICsgMTtcbn1cblxuZnVuY3Rpb24gcGFyc2VNb2RpZmllcih2YWx1ZTogdW5rbm93bik6IG51bWJlciB7XG4gIGNvbnN0IHBhcnNlZCA9IE51bWJlcih2YWx1ZSk7XG4gIHJldHVybiBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSA/IHBhcnNlZCA6IDA7XG59XG5cbmZ1bmN0aW9uIGdldEhpZ2hlc3RNb25zdGVyRGV4KGVuY291bnRlcjogRW5jb3VudGVyRGF0YSk6IG51bWJlciB7XG4gIHJldHVybiBlbmNvdW50ZXIubW9uc3RlcnMucmVkdWNlKChoaWdoZXN0LCBtb25zdGVyKSA9PiB7XG4gICAgY29uc3QgZGV4ID0gcGFyc2VNb2RpZmllcihtb25zdGVyLmRleCk7XG5cbiAgICByZXR1cm4gTWF0aC5tYXgoaGlnaGVzdCwgZGV4KTtcbiAgfSwgMCk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhdGl2ZUVudHJpZXMoXG4gIGVuY291bnRlcjogRW5jb3VudGVyRGF0YVxuKTogeyBuYW1lOiBzdHJpbmc7IGluaXRpYXRpdmU6IG51bWJlciB9W10ge1xuICBjb25zdCBtb2RlID0gZW5jb3VudGVyLmluaXRpYXRpdmVNb2RlID8/IFwiaW5kaXZpZHVhbF9tb25zdGVyc1wiO1xuXG4gIGlmIChtb2RlID09PSBcIm5vbmVcIikge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGlmIChtb2RlID09PSBcInNoYWRvd2RhcmtfcmF3XCIpIHtcbiAgICBjb25zdCBoaWdoZXN0RGV4ID0gZ2V0SGlnaGVzdE1vbnN0ZXJEZXgoZW5jb3VudGVyKTtcblxuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwiR00gLyBNb25zdGVyc1wiLFxuICAgICAgICBpbml0aWF0aXZlOiByb2xsRDIwKCkgKyBoaWdoZXN0RGV4XG4gICAgICB9XG4gICAgXTtcbiAgfVxuXG4gIGNvbnN0IGVudHJpZXM6IHsgbmFtZTogc3RyaW5nOyBpbml0aWF0aXZlOiBudW1iZXIgfVtdID0gW107XG5cbiAgZm9yIChjb25zdCBtb25zdGVyIG9mIGVuY291bnRlci5tb25zdGVycykge1xuICAgIGNvbnN0IHF0eSA9IE1hdGgubWF4KDEsIE51bWJlcihtb25zdGVyLnF0eSA/PyAxKSk7XG4gICAgY29uc3QgZGV4TW9kID0gcGFyc2VNb2RpZmllcihtb25zdGVyLmRleCk7XG5cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBxdHk7IGkrKykge1xuICAgICAgZW50cmllcy5wdXNoKHtcbiAgICAgICAgbmFtZTogcXR5ID4gMSA/IGAke21vbnN0ZXIubmFtZX0gJHtpfWAgOiBtb25zdGVyLm5hbWUsXG4gICAgICAgIGluaXRpYXRpdmU6IHJvbGxEMjAoKSArIGRleE1vZFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGVudHJpZXMuc29ydCgoYSwgYikgPT4gYi5pbml0aWF0aXZlIC0gYS5pbml0aWF0aXZlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24oXG4gIGVuY291bnRlcjogRW5jb3VudGVyRGF0YVxuKTogc3RyaW5nIHtcbiAgY29uc3QgaW5pdGlhdGl2ZUVudHJpZXMgPSBnZW5lcmF0ZUluaXRpYXRpdmVFbnRyaWVzKGVuY291bnRlcik7XG5cbiAgY29uc3QgaW5pdGlhdGl2ZUZyb250bWF0dGVyID0gaW5pdGlhdGl2ZUVudHJpZXNcbiAgICAubWFwKChlbnRyeSkgPT4gYCAgLSBuYW1lOiAke3lhbWxTdHJpbmcoZW50cnkubmFtZSl9XG4gICAgaW5pdGlhdGl2ZTogJHtlbnRyeS5pbml0aWF0aXZlfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgY29uc3QgbW9uc3RlckZyb250bWF0dGVyID0gZW5jb3VudGVyLm1vbnN0ZXJzXG4gICAgLm1hcCgobW9uc3RlcikgPT4gYCAgLSBuYW1lOiAke3lhbWxTdHJpbmcobW9uc3Rlci5uYW1lKX1cbiAgICBxdHk6ICR7bW9uc3Rlci5xdHl9XG4gICAgcGF0aDogJHt5YW1sU3RyaW5nKG1vbnN0ZXIucGF0aCl9XG4gICAgbGV2ZWw6ICR7eWFtbFN0cmluZyhtb25zdGVyLmxldmVsKX1cbiAgICBhYzogJHt5YW1sU3RyaW5nKG1vbnN0ZXIuYWMpfVxuICAgIGhwOiAke3lhbWxTdHJpbmcobW9uc3Rlci5ocCl9XG4gICAgZGV4OiAke3lhbWxTdHJpbmcobW9uc3Rlci5kZXgpfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgcmV0dXJuIGAtLS1cbnNoYWRvd2RhcmtUeXBlOiBlbmNvdW50ZXJcbm5hbWU6ICR7eWFtbFN0cmluZyhlbmNvdW50ZXIubmFtZSl9XG5zdGF0dXM6ICR7eWFtbFN0cmluZyhlbmNvdW50ZXIuc3RhdHVzID8/IFwicGxhbm5lZFwiKX1cblxucGFydHlMZXZlbDogJHtlbmNvdW50ZXIucGFydHlMZXZlbCA/PyAxfVxucGFydHlTaXplOiAke2VuY291bnRlci5wYXJ0eVNpemUgPz8gNH1cblxudGVycmFpbjogJHt5YW1sU3RyaW5nKGVuY291bnRlci50ZXJyYWluKX1cbmxpZ2h0OiAke3lhbWxTdHJpbmcoZW5jb3VudGVyLmxpZ2h0KX1cblxubW9uc3RlcnM6XG4ke21vbnN0ZXJGcm9udG1hdHRlciB8fCBcIiAgW11cIn1cblxuaW5pdGlhdGl2ZU1vZGU6ICR7ZW5jb3VudGVyLmluaXRpYXRpdmVNb2RlID8/IFwiaW5kaXZpZHVhbF9tb25zdGVyc1wifVxuaW5pdGlhdGl2ZTpcbiR7aW5pdGlhdGl2ZUZyb250bWF0dGVyIHx8IFwiICBbXVwifVxuXG50YWdzOlxuICAtIHNoYWRvd2RhcmsvZW5jb3VudGVyXG4tLS1cblxuJHtzZWN0aW9uKFwiU2V0dXBcIiwgZW5jb3VudGVyLnNldHVwKX1cbiR7c2VjdGlvbihcIlJlYWQtQWxvdWRcIiwgZW5jb3VudGVyLnJlYWRBbG91ZCl9XG4ke3NlY3Rpb24oXCJUYWN0aWNzXCIsIGVuY291bnRlci50YWN0aWNzKX1cbiR7c2VjdGlvbihcIlRyZWFzdXJlXCIsIGVuY291bnRlci50cmVhc3VyZSl9XG4ke3NlY3Rpb24oXCJOb3Rlc1wiLCBlbmNvdW50ZXIubm90ZXMpfVxuYDtcbn0iLCAiaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcsIE1vZGFsLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IHNob3dNb25zdGVyUHJldmlldyB9IGZyb20gXCIuLi9jb21wb25lbnRzL01vbnN0ZXJQcmV2aWV3UG9wb3ZlclwiO1xuaW1wb3J0IHsgRW5jb3VudGVyU2VydmljZSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9FbmNvdW50ZXJTZXJ2aWNlXCI7XG5pbXBvcnQgeyBNb25zdGVySW5kZXggfSBmcm9tIFwiLi4vc2VydmljZXMvTW9uc3RlckluZGV4XCI7XG5pbXBvcnQgeyBnZW5lcmF0ZUVuY291bnRlck1hcmtkb3duIH0gZnJvbSBcIi4uL3RlbXBsYXRlcy9lbmNvdW50ZXJUZW1wbGF0ZVwiO1xuaW1wb3J0IHtcbiAgRW5jb3VudGVyRGF0YSxcbiAgRW5jb3VudGVySW5pdGlhdGl2ZU1vZGUsXG4gIE1vbnN0ZXJSZWZlcmVuY2UsXG4gIE1vbnN0ZXJTdW1tYXJ5XG59IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmltcG9ydCBTaGFkb3dkYXJrRW5jb3VudGVyc1BsdWdpbiBmcm9tIFwiLi4vbWFpblwiO1xuXG50eXBlIEVuY291bnRlcldpemFyZFN0ZXAgPSBcIm1vbnN0ZXJzXCIgfCBcImRldGFpbHNcIiB8IFwicHJldmlld1wiO1xudHlwZSBFbmNvdW50ZXJNb2RhbE1vZGUgPSBcImNyZWF0ZVwiIHwgXCJlZGl0XCIgfCBcImR1cGxpY2F0ZVwiO1xuXG5leHBvcnQgY2xhc3MgQ3JlYXRlRW5jb3VudGVyTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHBsdWdpbjogU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW47XG5cbiAgbW9uc3RlckluZGV4OiBNb25zdGVySW5kZXg7XG4gIGVuY291bnRlclNlcnZpY2U6IEVuY291bnRlclNlcnZpY2U7XG5cbiAgY3VycmVudFN0ZXA6IEVuY291bnRlcldpemFyZFN0ZXAgPSBcIm1vbnN0ZXJzXCI7XG5cbiAgZW5jb3VudGVyTmFtZSA9IFwiXCI7XG4gIHNlbGVjdGVkTW9uc3RlcnM6IE1vbnN0ZXJSZWZlcmVuY2VbXSA9IFtdO1xuXG4gIG1vbnN0ZXJTZWFyY2ggPSBcIlwiO1xuICBsZXZlbEZpbHRlciA9IFwiXCI7XG4gIHRhZ0ZpbHRlciA9IFwiXCI7XG4gIHNvcnRNb2RlID0gXCJuYW1lLWFzY1wiO1xuXG4gIHBhcnR5TGV2ZWwgPSAxO1xuICBwYXJ0eVNpemUgPSA0O1xuICBzdGF0dXMgPSBcInBsYW5uZWRcIjtcblxuICBpbml0aWF0aXZlTW9kZTogRW5jb3VudGVySW5pdGlhdGl2ZU1vZGUgPSBcImluZGl2aWR1YWxfbW9uc3RlcnNcIjtcblxuICBzZXR1cCA9IFwiXCI7XG4gIHJlYWRBbG91ZCA9IFwiXCI7XG4gIHRhY3RpY3MgPSBcIlwiO1xuICB0cmVhc3VyZSA9IFwiXCI7XG4gIG5vdGVzID0gXCJcIjtcblxuICBwcml2YXRlIGZpbGVUb0VkaXQ/OiBURmlsZTtcbiAgcHJpdmF0ZSBtb2RlOiBFbmNvdW50ZXJNb2RhbE1vZGUgPSBcImNyZWF0ZVwiO1xuXG4gIHByaXZhdGUgZ2V0IGlzRWRpdGluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5tb2RlID09PSBcImVkaXRcIjtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IGlzRHVwbGljYXRpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubW9kZSA9PT0gXCJkdXBsaWNhdGVcIjtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHBsdWdpbjogU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW4sXG4gICAgbW9uc3RlckluZGV4OiBNb25zdGVySW5kZXgsXG4gICAgZW5jb3VudGVyU2VydmljZTogRW5jb3VudGVyU2VydmljZSxcbiAgICBmaWxlVG9FZGl0PzogVEZpbGUsXG4gICAgbW9kZTogRW5jb3VudGVyTW9kYWxNb2RlID0gZmlsZVRvRWRpdCA/IFwiZWRpdFwiIDogXCJjcmVhdGVcIlxuICApIHtcbiAgICBzdXBlcihhcHApO1xuXG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgdGhpcy5tb25zdGVySW5kZXggPSBtb25zdGVySW5kZXg7XG4gICAgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlID0gZW5jb3VudGVyU2VydmljZTtcbiAgICB0aGlzLmZpbGVUb0VkaXQgPSBmaWxlVG9FZGl0O1xuICAgIHRoaXMubW9kZSA9IG1vZGU7XG5cbiAgICB0aGlzLnBhcnR5TGV2ZWwgPSBwbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFBhcnR5TGV2ZWw7XG4gICAgdGhpcy5wYXJ0eVNpemUgPSBwbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFBhcnR5U2l6ZTtcbiAgICB0aGlzLmluaXRpYXRpdmVNb2RlID0gcGx1Z2luLnNldHRpbmdzLmRlZmF1bHRJbml0aWF0aXZlTW9kZTtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLm1vZGFsRWwuYWRkQ2xhc3MoXCJzZC1lbmNvdW50ZXItbW9kYWxcIik7XG5cbiAgICBpZiAodGhpcy5maWxlVG9FZGl0KSB7XG4gICAgICBhd2FpdCB0aGlzLmxvYWRFbmNvdW50ZXJGcm9tRmlsZSh0aGlzLmZpbGVUb0VkaXQpO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICByZW5kZXIoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG5cbiAgICBjb250ZW50RWwuZW1wdHkoKTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHtcbiAgICAgIHRleHQ6IHRoaXMuaXNFZGl0aW5nXG4gICAgICAgID8gXCJFZGl0IFNoYWRvd2RhcmsgRW5jb3VudGVyXCJcbiAgICAgICAgOiB0aGlzLmlzRHVwbGljYXRpbmdcbiAgICAgICAgICA/IFwiRHVwbGljYXRlIFNoYWRvd2RhcmsgRW5jb3VudGVyXCJcbiAgICAgICAgICA6IFwiQ3JlYXRlIFNoYWRvd2RhcmsgRW5jb3VudGVyXCJcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyU3RlcEluZGljYXRvcihjb250ZW50RWwpO1xuXG4gICAgaWYgKHRoaXMuY3VycmVudFN0ZXAgPT09IFwibW9uc3RlcnNcIikge1xuICAgICAgdGhpcy5yZW5kZXJNb25zdGVyU3RlcChjb250ZW50RWwpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGVwID09PSBcImRldGFpbHNcIikge1xuICAgICAgdGhpcy5yZW5kZXJEZXRhaWxzU3RlcChjb250ZW50RWwpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyUHJldmlld1N0ZXAoY29udGVudEVsKTtcbiAgfVxuXG4gIHJlbmRlclN0ZXBJbmRpY2F0b3IoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItc3RlcC1pbmRpY2F0b3JcIixcbiAgICAgIHRleHQ6XG4gICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPT09IFwibW9uc3RlcnNcIlxuICAgICAgICAgID8gXCJTdGVwIDEgb2YgMzogQWRkIE1vbnN0ZXJzXCJcbiAgICAgICAgICA6IHRoaXMuY3VycmVudFN0ZXAgPT09IFwiZGV0YWlsc1wiXG4gICAgICAgICAgICA/IFwiU3RlcCAyIG9mIDM6IEFkZCBEZXRhaWxzXCJcbiAgICAgICAgICAgIDogXCJTdGVwIDMgb2YgMzogUHJldmlld1wiXG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJNb25zdGVyU3RlcChjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgbmFtZVJvdyA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1uYW1lLXJvd1wiXG4gICAgfSk7XG5cbiAgICBjb25zdCBuYW1lRmllbGQgPSBuYW1lUm93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLW5hbWUtZmllbGRcIlxuICAgIH0pO1xuXG4gICAgbmFtZUZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJFbmNvdW50ZXIgTmFtZVwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBuYW1lSW5wdXQgPSBuYW1lRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIkdvYmxpbiBBbWJ1c2hcIlxuICAgIH0pO1xuXG4gICAgbmFtZUlucHV0LnZhbHVlID0gdGhpcy5lbmNvdW50ZXJOYW1lO1xuXG4gICAgbmFtZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmVuY291bnRlck5hbWUgPSBuYW1lSW5wdXQudmFsdWU7XG4gICAgfSk7XG5cbiAgICBjb25zdCBidWlsZGVyRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItYnVpbGRlclwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBicm93c2VyRWwgPSBidWlsZGVyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItYnJvd3NlclwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBkcmFmdEVsID0gYnVpbGRlckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRyYWZ0XCJcbiAgICB9KTtcblxuICAgIGJyb3dzZXJFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IFwiTW9uc3RlciBCcm93c2VyXCJcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyRmlsdGVyUm93KGJyb3dzZXJFbCk7XG5cbiAgICBjb25zdCByZXN1bHRzRWwgPSBicm93c2VyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItbW9uc3Rlci1yZXN1bHRzXCJcbiAgICB9KTtcblxuICAgIHJlc3VsdHNFbC5kYXRhc2V0LnJvbGUgPSBcIm1vbnN0ZXItcmVzdWx0c1wiO1xuXG4gICAgZHJhZnRFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IFwiRW5jb3VudGVyIERyYWZ0XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlbGVjdGVkRWwgPSBkcmFmdEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXNlbGVjdGVkLW1vbnN0ZXJzXCJcbiAgICB9KTtcblxuICAgIHNlbGVjdGVkRWwuZGF0YXNldC5yb2xlID0gXCJzZWxlY3RlZC1tb25zdGVyc1wiO1xuXG4gICAgY29uc3Qgc3VtbWFyeUVsID0gZHJhZnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zdW1tYXJ5XCJcbiAgICB9KTtcblxuICAgIHN1bW1hcnlFbC5kYXRhc2V0LnJvbGUgPSBcImVuY291bnRlci1zdW1tYXJ5XCI7XG5cbiAgICBjb25zdCBidXR0b25FbCA9IGRyYWZ0RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItY3JlYXRlLWJ1dHRvblwiXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlckZvb3RlckJ1dHRvbnMoYnV0dG9uRWwsIFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiTmV4dFwiLFxuICAgICAgICBjdGE6IHRydWUsXG4gICAgICAgIG9uQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICBpZiAoIXRoaXMuZW5jb3VudGVyTmFtZS50cmltKCkpIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJFbmNvdW50ZXIgbmFtZSBpcyByZXF1aXJlZC5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IFwiZGV0YWlsc1wiO1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdKTtcblxuICAgIHRoaXMucmVuZGVyTW9uc3RlclJlc3VsdHMoKTtcbiAgICB0aGlzLnJlbmRlclNlbGVjdGVkTW9uc3RlcnMoKTtcbiAgICB0aGlzLnJlbmRlckVuY291bnRlclN1bW1hcnkoKTtcbiAgfVxuXG4gIHJlbmRlckZpbHRlclJvdyhicm93c2VyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgZmlsdGVyUm93ID0gYnJvd3NlckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1yb3dcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VhcmNoRmllbGQgPSBmaWx0ZXJSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZmlsdGVyLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIHNlYXJjaEZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJTZWFyY2hcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VhcmNoSW5wdXQgPSBzZWFyY2hGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiU2VhcmNoIG1vbnN0ZXJzLi4uXCJcbiAgICB9KTtcblxuICAgIHNlYXJjaElucHV0LnZhbHVlID0gdGhpcy5tb25zdGVyU2VhcmNoO1xuXG4gICAgc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMubW9uc3RlclNlYXJjaCA9IHNlYXJjaElucHV0LnZhbHVlO1xuICAgICAgdGhpcy5yZW5kZXJNb25zdGVyUmVzdWx0cygpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgbGV2ZWxGaWVsZCA9IGZpbHRlclJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1maWx0ZXItZmllbGRcIlxuICAgIH0pO1xuXG4gICAgbGV2ZWxGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiTGV2ZWxcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgbGV2ZWxTZWxlY3QgPSBsZXZlbEZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuXG4gICAgbGV2ZWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJBbnlcIixcbiAgICAgIHZhbHVlOiBcIlwiXG4gICAgfSk7XG5cbiAgICBmb3IgKGxldCBsZXZlbCA9IDA7IGxldmVsIDw9IDEwOyBsZXZlbCsrKSB7XG4gICAgICBsZXZlbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICAgIHRleHQ6IFN0cmluZyhsZXZlbCksXG4gICAgICAgIHZhbHVlOiBTdHJpbmcobGV2ZWwpXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsZXZlbFNlbGVjdC52YWx1ZSA9IHRoaXMubGV2ZWxGaWx0ZXI7XG5cbiAgICBsZXZlbFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHRoaXMubGV2ZWxGaWx0ZXIgPSBsZXZlbFNlbGVjdC52YWx1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9uc3RlclJlc3VsdHMoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRhZ0ZpZWxkID0gZmlsdGVyUm93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1maWVsZFwiXG4gICAgfSk7XG5cbiAgICB0YWdGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiVGFnXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHRhZ1NlbGVjdCA9IHRhZ0ZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuXG4gICAgdGFnU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiQW55XCIsXG4gICAgICB2YWx1ZTogXCJcIlxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCB0YWcgb2YgdGhpcy5nZXRBdmFpbGFibGVUYWdzKCkpIHtcbiAgICAgIHRhZ1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICAgIHRleHQ6IHRhZyxcbiAgICAgICAgdmFsdWU6IHRhZ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGFnU2VsZWN0LnZhbHVlID0gdGhpcy50YWdGaWx0ZXI7XG5cbiAgICB0YWdTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnRhZ0ZpbHRlciA9IHRhZ1NlbGVjdC52YWx1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9uc3RlclJlc3VsdHMoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHNvcnRGaWVsZCA9IGZpbHRlclJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1maWx0ZXItZmllbGRcIlxuICAgIH0pO1xuXG4gICAgc29ydEZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJTb3J0XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNvcnRTZWxlY3QgPSBzb3J0RmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG5cbiAgICBzb3J0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTmFtZSBBLVpcIixcbiAgICAgIHZhbHVlOiBcIm5hbWUtYXNjXCJcbiAgICB9KTtcblxuICAgIHNvcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJOYW1lIFotQVwiLFxuICAgICAgdmFsdWU6IFwibmFtZS1kZXNjXCJcbiAgICB9KTtcblxuICAgIHNvcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJMZXZlbCBMb3ctSGlnaFwiLFxuICAgICAgdmFsdWU6IFwibGV2ZWwtYXNjXCJcbiAgICB9KTtcblxuICAgIHNvcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJMZXZlbCBIaWdoLUxvd1wiLFxuICAgICAgdmFsdWU6IFwibGV2ZWwtZGVzY1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LnZhbHVlID0gdGhpcy5zb3J0TW9kZTtcblxuICAgIHNvcnRTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnNvcnRNb2RlID0gc29ydFNlbGVjdC52YWx1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9uc3RlclJlc3VsdHMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlckRldGFpbHNTdGVwKGNvbnRlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBkZXRhaWxzRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZGV0YWlscy1zdGVwXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHBhcnR5Um93ID0gZGV0YWlsc0VsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXBhcnR5LXJvd1wiXG4gICAgfSk7XG5cbiAgICBjb25zdCBsZXZlbEZpZWxkID0gcGFydHlSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcGFydHktZmllbGRcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhdHVzRmllbGQgPSBkZXRhaWxzRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZGV0YWlscy1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBzdGF0dXNGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiU3RhdHVzXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXR1c1NlbGVjdCA9IHN0YXR1c0ZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuXG4gICAgc3RhdHVzU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiUGxhbm5lZFwiLFxuICAgICAgdmFsdWU6IFwicGxhbm5lZFwiXG4gICAgfSk7XG5cbiAgICBzdGF0dXNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJSdW5uaW5nXCIsXG4gICAgICB2YWx1ZTogXCJydW5uaW5nXCJcbiAgICB9KTtcblxuICAgIHN0YXR1c1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIkNvbXBsZXRlZFwiLFxuICAgICAgdmFsdWU6IFwiY29tcGxldGVkXCJcbiAgICB9KTtcblxuICAgIHN0YXR1c1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIkFyY2hpdmVkXCIsXG4gICAgICB2YWx1ZTogXCJhcmNoaXZlZFwiXG4gICAgfSk7XG5cbiAgICBzdGF0dXNTZWxlY3QudmFsdWUgPSB0aGlzLnN0YXR1cztcblxuICAgIHN0YXR1c1NlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHRoaXMuc3RhdHVzID0gc3RhdHVzU2VsZWN0LnZhbHVlO1xuICAgIH0pO1xuXG4gICAgbGV2ZWxGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiUGFydHkgTGV2ZWxcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgbGV2ZWxJbnB1dCA9IGxldmVsRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcIm51bWJlclwiXG4gICAgfSk7XG5cbiAgICBsZXZlbElucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMucGFydHlMZXZlbCk7XG5cbiAgICBsZXZlbElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyKGxldmVsSW5wdXQudmFsdWUpO1xuXG4gICAgICB0aGlzLnBhcnR5TGV2ZWwgPVxuICAgICAgICBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPiAwXG4gICAgICAgICAgPyBNYXRoLmZsb29yKHBhcnNlZClcbiAgICAgICAgICA6IDE7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzaXplRmllbGQgPSBwYXJ0eVJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1wYXJ0eS1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBzaXplRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIlBhcnR5IFNpemVcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2l6ZUlucHV0ID0gc2l6ZUZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJudW1iZXJcIlxuICAgIH0pO1xuXG4gICAgc2l6ZUlucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMucGFydHlTaXplKTtcblxuICAgIHNpemVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlcihzaXplSW5wdXQudmFsdWUpO1xuXG4gICAgICB0aGlzLnBhcnR5U2l6ZSA9XG4gICAgICAgIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpICYmIHBhcnNlZCA+IDBcbiAgICAgICAgICA/IE1hdGguZmxvb3IocGFyc2VkKVxuICAgICAgICAgIDogNDtcbiAgICB9KTtcblxuICAgIGNvbnN0IGluaXRpYXRpdmVGaWVsZCA9IGRldGFpbHNFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1kZXRhaWxzLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIGluaXRpYXRpdmVGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiSW5pdGlhdGl2ZSBNb2RlXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGluaXRpYXRpdmVTZWxlY3QgPSBpbml0aWF0aXZlRmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG5cbiAgICBpbml0aWF0aXZlU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiSW5kaXZpZHVhbCBNb25zdGVyc1wiLFxuICAgICAgdmFsdWU6IFwiaW5kaXZpZHVhbF9tb25zdGVyc1wiXG4gICAgfSk7XG5cbiAgICBpbml0aWF0aXZlU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiU2hhZG93ZGFyayBSQVdcIixcbiAgICAgIHZhbHVlOiBcInNoYWRvd2RhcmtfcmF3XCJcbiAgICB9KTtcblxuICAgIGluaXRpYXRpdmVTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJOb25lXCIsXG4gICAgICB2YWx1ZTogXCJub25lXCJcbiAgICB9KTtcblxuICAgIGluaXRpYXRpdmVTZWxlY3QudmFsdWUgPSB0aGlzLmluaXRpYXRpdmVNb2RlO1xuXG4gICAgaW5pdGlhdGl2ZVNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHRoaXMuaW5pdGlhdGl2ZU1vZGUgPVxuICAgICAgICBpbml0aWF0aXZlU2VsZWN0LnZhbHVlIGFzIEVuY291bnRlckluaXRpYXRpdmVNb2RlO1xuICAgIH0pO1xuXG4gICAgZGV0YWlsc0VsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkFkZCBvcHRpb25hbCBHTS1mYWNpbmcgZGV0YWlscyBmb3IgdGhpcyBlbmNvdW50ZXIuXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGRldGFpbHNHcmlkID0gZGV0YWlsc0VsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRldGFpbHMtZ3JpZFwiXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFRleHRBcmVhRmllbGQoZGV0YWlsc0dyaWQsIFwiU2V0dXBcIiwgdGhpcy5zZXR1cCwgKHZhbHVlKSA9PiB7XG4gICAgICB0aGlzLnNldHVwID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFRleHRBcmVhRmllbGQoZGV0YWlsc0dyaWQsIFwiUmVhZC1BbG91ZFwiLCB0aGlzLnJlYWRBbG91ZCwgKHZhbHVlKSA9PiB7XG4gICAgICB0aGlzLnJlYWRBbG91ZCA9IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRUZXh0QXJlYUZpZWxkKGRldGFpbHNHcmlkLCBcIlRhY3RpY3NcIiwgdGhpcy50YWN0aWNzLCAodmFsdWUpID0+IHtcbiAgICAgIHRoaXMudGFjdGljcyA9IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRUZXh0QXJlYUZpZWxkKGRldGFpbHNHcmlkLCBcIlRyZWFzdXJlXCIsIHRoaXMudHJlYXN1cmUsICh2YWx1ZSkgPT4ge1xuICAgICAgdGhpcy50cmVhc3VyZSA9IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgbm90ZXNGaWVsZCA9IGRldGFpbHNFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1kZXRhaWxzLWZpZWxkIHNkLWVuY291bnRlci1ub3Rlcy1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBub3Rlc0ZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJOb3Rlc1wiXG4gICAgfSk7XG5cbiAgICBjb25zdCBub3Rlc0FyZWEgPSBub3Rlc0ZpZWxkLmNyZWF0ZUVsKFwidGV4dGFyZWFcIik7XG5cbiAgICBub3Rlc0FyZWEudmFsdWUgPSB0aGlzLm5vdGVzO1xuICAgIG5vdGVzQXJlYS5yb3dzID0gNDtcblxuICAgIG5vdGVzQXJlYS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5ub3RlcyA9IG5vdGVzQXJlYS52YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyRm9vdGVyQnV0dG9ucyhjb250ZW50RWwsIFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiQmFja1wiLFxuICAgICAgICBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IFwibW9uc3RlcnNcIjtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogXCJTa2lwIERldGFpbHNcIixcbiAgICAgICAgb25DbGljazogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPSBcInByZXZpZXdcIjtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogXCJQcmV2aWV3XCIsXG4gICAgICAgIGN0YTogdHJ1ZSxcbiAgICAgICAgb25DbGljazogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPSBcInByZXZpZXdcIjtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXSk7XG4gIH1cblxuICBhZGRUZXh0QXJlYUZpZWxkKFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBsYWJlbDogc3RyaW5nLFxuICAgIHZhbHVlOiBzdHJpbmcsXG4gICAgb25DaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGZpZWxkRWwgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1kZXRhaWxzLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIGZpZWxkRWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBsYWJlbFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGV4dGFyZWEgPSBmaWVsZEVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIik7XG5cbiAgICB0ZXh0YXJlYS52YWx1ZSA9IHZhbHVlO1xuICAgIHRleHRhcmVhLnJvd3MgPSA0O1xuXG4gICAgdGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIG9uQ2hhbmdlKHRleHRhcmVhLnZhbHVlKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlclByZXZpZXdTdGVwKGNvbnRlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBlbmNvdW50ZXIgPSB0aGlzLmdldEVuY291bnRlckRhdGEoKTtcblxuICAgIGNvbnN0IHByZXZpZXdFbCA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1wcmV2aWV3LXN0ZXBcIlxuICAgIH0pO1xuXG4gICAgcHJldmlld0VsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIlByZXZpZXcgdGhlIG1hcmtkb3duIHRoYXQgd2lsbCBiZSBzYXZlZC5cIlxuICAgIH0pO1xuXG4gICAgY29uc3QgbWFya2Rvd25QcmV2aWV3ID0gcHJldmlld0VsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1tYXJrZG93bi1wcmV2aWV3XCJcbiAgICB9KTtcblxuICAgIG1hcmtkb3duUHJldmlldy52YWx1ZSA9IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24oZW5jb3VudGVyKTtcbiAgICBtYXJrZG93blByZXZpZXcucmVhZE9ubHkgPSB0cnVlO1xuXG4gICAgdGhpcy5yZW5kZXJGb290ZXJCdXR0b25zKGNvbnRlbnRFbCwgW1xuICAgICAge1xuICAgICAgICBsYWJlbDogXCJCYWNrXCIsXG4gICAgICAgIG9uQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gXCJkZXRhaWxzXCI7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IHRoaXMuaXNFZGl0aW5nXG4gICAgICAgICAgPyBcIlNhdmUgRW5jb3VudGVyXCJcbiAgICAgICAgICA6IHRoaXMuaXNEdXBsaWNhdGluZ1xuICAgICAgICAgICAgPyBcIkNyZWF0ZSBEdXBsaWNhdGVcIlxuICAgICAgICAgICAgOiBcIkNyZWF0ZSBFbmNvdW50ZXJcIixcbiAgICAgICAgY3RhOiB0cnVlLFxuICAgICAgICBvbkNsaWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlRW5jb3VudGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdKTtcbiAgfVxuXG4gIHJlbmRlckZvb3RlckJ1dHRvbnMoXG4gICAgY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LFxuICAgIGJ1dHRvbnM6IHtcbiAgICAgIGxhYmVsOiBzdHJpbmc7XG4gICAgICBjdGE/OiBib29sZWFuO1xuICAgICAgb25DbGljazogKCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gICAgfVtdXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGZvb3RlckVsID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItd2l6YXJkLWZvb3RlclwiXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IGJ1dHRvbkNvbmZpZyBvZiBidXR0b25zKSB7XG4gICAgICBjb25zdCBidXR0b24gPSBmb290ZXJFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIHRleHQ6IGJ1dHRvbkNvbmZpZy5sYWJlbFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChidXR0b25Db25maWcuY3RhKSB7XG4gICAgICAgIGJ1dHRvbi5hZGRDbGFzcyhcIm1vZC1jdGFcIik7XG4gICAgICB9XG5cbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIGJ1dHRvbkNvbmZpZy5vbkNsaWNrKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBnZXRFbmNvdW50ZXJEYXRhKCk6IEVuY291bnRlckRhdGEge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiB0aGlzLmVuY291bnRlck5hbWUudHJpbSgpLFxuICAgICAgc3RhdHVzOiB0aGlzLnN0YXR1cyxcbiAgICAgIHBhcnR5TGV2ZWw6IHRoaXMucGFydHlMZXZlbCxcbiAgICAgIHBhcnR5U2l6ZTogdGhpcy5wYXJ0eVNpemUsXG4gICAgICBpbml0aWF0aXZlTW9kZTogdGhpcy5pbml0aWF0aXZlTW9kZSxcbiAgICAgIG1vbnN0ZXJzOiB0aGlzLnNlbGVjdGVkTW9uc3RlcnMsXG4gICAgICBzZXR1cDogdGhpcy5zZXR1cCxcbiAgICAgIHJlYWRBbG91ZDogdGhpcy5yZWFkQWxvdWQsXG4gICAgICB0YWN0aWNzOiB0aGlzLnRhY3RpY3MsXG4gICAgICB0cmVhc3VyZTogdGhpcy50cmVhc3VyZSxcbiAgICAgIG5vdGVzOiB0aGlzLm5vdGVzXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgbG9hZEVuY291bnRlckZyb21GaWxlKGZpbGU6IFRGaWxlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlcjtcblxuICAgIGlmICghZnJvbnRtYXR0ZXIgfHwgZnJvbnRtYXR0ZXIuc2hhZG93ZGFya1R5cGUgIT09IFwiZW5jb3VudGVyXCIpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJUaGlzIGZpbGUgaXMgbm90IGEgU2hhZG93ZGFyayBlbmNvdW50ZXIuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuaW5pdGlhdGl2ZU1vZGUgPVxuICAgICAgZnJvbnRtYXR0ZXIuaW5pdGlhdGl2ZU1vZGUgPT09IFwic2hhZG93ZGFya19yYXdcIiB8fFxuICAgICAgZnJvbnRtYXR0ZXIuaW5pdGlhdGl2ZU1vZGUgPT09IFwiaW5kaXZpZHVhbF9tb25zdGVyc1wiIHx8XG4gICAgICBmcm9udG1hdHRlci5pbml0aWF0aXZlTW9kZSA9PT0gXCJub25lXCJcbiAgICAgICAgPyBmcm9udG1hdHRlci5pbml0aWF0aXZlTW9kZVxuICAgICAgICA6IFwiaW5kaXZpZHVhbF9tb25zdGVyc1wiO1xuXG4gICAgdGhpcy5lbmNvdW50ZXJOYW1lID0gU3RyaW5nKGZyb250bWF0dGVyLm5hbWUgPz8gZmlsZS5iYXNlbmFtZSk7XG5cbiAgICBpZiAodGhpcy5pc0R1cGxpY2F0aW5nKSB7XG4gICAgICB0aGlzLmVuY291bnRlck5hbWUgPSBgJHt0aGlzLmVuY291bnRlck5hbWV9IENvcHlgO1xuICAgIH1cblxuICAgIHRoaXMuc3RhdHVzID1cbiAgICAgIHR5cGVvZiBmcm9udG1hdHRlci5zdGF0dXMgPT09IFwic3RyaW5nXCJcbiAgICAgICAgPyBmcm9udG1hdHRlci5zdGF0dXNcbiAgICAgICAgOiBcInBsYW5uZWRcIjtcblxuICAgIHRoaXMucGFydHlMZXZlbCA9IE51bWJlcihmcm9udG1hdHRlci5wYXJ0eUxldmVsID8/IDEpO1xuICAgIHRoaXMucGFydHlTaXplID0gTnVtYmVyKGZyb250bWF0dGVyLnBhcnR5U2l6ZSA/PyA0KTtcblxuICAgIHRoaXMuc2VsZWN0ZWRNb25zdGVycyA9IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIubW9uc3RlcnMpXG4gICAgICA/IGZyb250bWF0dGVyLm1vbnN0ZXJzLm1hcCgobW9uc3RlcjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+ICh7XG4gICAgICAgICAgbmFtZTogU3RyaW5nKG1vbnN0ZXIubmFtZSA/PyBcIlVua25vd24gTW9uc3RlclwiKSxcbiAgICAgICAgICBwYXRoOiBTdHJpbmcobW9uc3Rlci5wYXRoID8/IFwiXCIpLFxuICAgICAgICAgIHF0eTogTnVtYmVyKG1vbnN0ZXIucXR5ID8/IDEpLFxuICAgICAgICAgIGxldmVsOiBTdHJpbmcobW9uc3Rlci5sZXZlbCA/PyBcIlwiKSxcbiAgICAgICAgICBhYzogU3RyaW5nKG1vbnN0ZXIuYWMgPz8gXCJcIiksXG4gICAgICAgICAgaHA6IFN0cmluZyhtb25zdGVyLmhwID8/IFwiXCIpLFxuICAgICAgICAgIGRleDogU3RyaW5nKG1vbnN0ZXIuZGV4ID8/IFwiXCIpXG4gICAgICAgIH0pKVxuICAgICAgOiBbXTtcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuXG4gICAgdGhpcy5zZXR1cCA9IHRoaXMuZXh0cmFjdFNlY3Rpb24oY29udGVudCwgXCJTZXR1cFwiKTtcbiAgICB0aGlzLnJlYWRBbG91ZCA9IHRoaXMuZXh0cmFjdFNlY3Rpb24oY29udGVudCwgXCJSZWFkLUFsb3VkXCIpO1xuICAgIHRoaXMudGFjdGljcyA9IHRoaXMuZXh0cmFjdFNlY3Rpb24oY29udGVudCwgXCJUYWN0aWNzXCIpO1xuICAgIHRoaXMudHJlYXN1cmUgPSB0aGlzLmV4dHJhY3RTZWN0aW9uKGNvbnRlbnQsIFwiVHJlYXN1cmVcIik7XG4gICAgdGhpcy5ub3RlcyA9IHRoaXMuZXh0cmFjdFNlY3Rpb24oY29udGVudCwgXCJOb3Rlc1wiKTtcbiAgfVxuXG4gIHByaXZhdGUgZXh0cmFjdFNlY3Rpb24oXG4gICAgY29udGVudDogc3RyaW5nLFxuICAgIGhlYWRpbmc6IHN0cmluZ1xuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgvXFxyP1xcbi8pO1xuXG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IGxpbmVzLmZpbmRJbmRleChcbiAgICAgIChsaW5lKSA9PiBsaW5lLnRyaW0oKSA9PT0gYCMjICR7aGVhZGluZ31gXG4gICAgKTtcblxuICAgIGlmIChzdGFydEluZGV4ID09PSAtMSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgY29uc3Qgc2VjdGlvbkxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXggKyAxOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGxpbmUgPSBsaW5lc1tpXTtcblxuICAgICAgaWYgKC9eIyNcXHMrLy50ZXN0KGxpbmUudHJpbSgpKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgc2VjdGlvbkxpbmVzLnB1c2gobGluZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlY3Rpb25MaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbiAgfVxuXG4gIGdldEF2YWlsYWJsZVRhZ3MoKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHRhZ1NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gICAgZm9yIChjb25zdCBtb25zdGVyIG9mIHRoaXMubW9uc3RlckluZGV4LmdldEFsbE1vbnN0ZXJzKCkpIHtcbiAgICAgIGZvciAoY29uc3QgdGFnIG9mIG1vbnN0ZXIudGFncyA/PyBbXSkge1xuICAgICAgICB0YWdTZXQuYWRkKFN0cmluZyh0YWcpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gWy4uLnRhZ1NldF0uc29ydCgoYSwgYikgPT4gYS5sb2NhbGVDb21wYXJlKGIpKTtcbiAgfVxuXG4gIHNvcnRNb25zdGVycyhtb25zdGVyczogTW9uc3RlclN1bW1hcnlbXSk6IE1vbnN0ZXJTdW1tYXJ5W10ge1xuICAgIHJldHVybiBbLi4ubW9uc3RlcnNdLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGNvbnN0IGFMZXZlbCA9IE51bWJlcihhLmxldmVsID8/IDk5OSk7XG4gICAgICBjb25zdCBiTGV2ZWwgPSBOdW1iZXIoYi5sZXZlbCA/PyA5OTkpO1xuXG4gICAgICBzd2l0Y2ggKHRoaXMuc29ydE1vZGUpIHtcbiAgICAgICAgY2FzZSBcIm5hbWUtZGVzY1wiOlxuICAgICAgICAgIHJldHVybiBiLm5hbWUubG9jYWxlQ29tcGFyZShhLm5hbWUpO1xuXG4gICAgICAgIGNhc2UgXCJsZXZlbC1hc2NcIjpcbiAgICAgICAgICByZXR1cm4gYUxldmVsIC0gYkxldmVsIHx8IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG5cbiAgICAgICAgY2FzZSBcImxldmVsLWRlc2NcIjpcbiAgICAgICAgICByZXR1cm4gYkxldmVsIC0gYUxldmVsIHx8IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG5cbiAgICAgICAgY2FzZSBcIm5hbWUtYXNjXCI6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJNb25zdGVyUmVzdWx0cygpOiB2b2lkIHtcbiAgICBjb25zdCByZXN1bHRzRWwgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFxuICAgICAgJ1tkYXRhLXJvbGU9XCJtb25zdGVyLXJlc3VsdHNcIl0nXG4gICAgKTtcblxuICAgIGlmICghKHJlc3VsdHNFbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlc3VsdHNFbC5lbXB0eSgpO1xuXG4gICAgbGV0IG1vbnN0ZXJzID0gdGhpcy5tb25zdGVySW5kZXguc2VhcmNoTW9uc3RlcnModGhpcy5tb25zdGVyU2VhcmNoKTtcblxuICAgIGlmICh0aGlzLmxldmVsRmlsdGVyKSB7XG4gICAgICBtb25zdGVycyA9IG1vbnN0ZXJzLmZpbHRlcigobW9uc3RlcikgPT5cbiAgICAgICAgU3RyaW5nKG1vbnN0ZXIubGV2ZWwgPz8gXCJcIikgPT09IHRoaXMubGV2ZWxGaWx0ZXJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudGFnRmlsdGVyKSB7XG4gICAgICBtb25zdGVycyA9IG1vbnN0ZXJzLmZpbHRlcigobW9uc3RlcikgPT5cbiAgICAgICAgKG1vbnN0ZXIudGFncyA/PyBbXSkuaW5jbHVkZXModGhpcy50YWdGaWx0ZXIpXG4gICAgICApO1xuICAgIH1cblxuICAgIG1vbnN0ZXJzID0gdGhpcy5zb3J0TW9uc3RlcnMobW9uc3RlcnMpO1xuICAgIG1vbnN0ZXJzID0gbW9uc3RlcnMuc2xpY2UoMCwgMTAwKTtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiBtb25zdGVycykge1xuICAgICAgY29uc3Qgcm93ID0gbmV3IERvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgICAgY29uc3Qgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICB3cmFwcGVyLmNsYXNzTmFtZSA9IFwic2QtZW5jb3VudGVyLW1vbnN0ZXItcm93XCI7XG5cbiAgICAgIGNvbnN0IGluZm8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgaW5mby5jbGFzc05hbWUgPSBcInNkLWVuY291bnRlci1tb25zdGVyLWluZm9cIjtcblxuICAgICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBuYW1lLmNsYXNzTmFtZSA9IFwic2QtZW5jb3VudGVyLW1vbnN0ZXItbmFtZVwiO1xuICAgICAgbmFtZS50ZXh0Q29udGVudCA9IG1vbnN0ZXIubmFtZTtcblxuICAgICAgY29uc3QgbWV0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBtZXRhLmNsYXNzTmFtZSA9IFwic2QtZW5jb3VudGVyLW1vbnN0ZXItbWV0YVwiO1xuICAgICAgbWV0YS50ZXh0Q29udGVudCA9XG4gICAgICAgIFtcbiAgICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgICBtb25zdGVyLmFjID8gYEFDICR7bW9uc3Rlci5hY31gIDogbnVsbCxcbiAgICAgICAgICBtb25zdGVyLmhwID8gYEhQICR7bW9uc3Rlci5ocH1gIDogbnVsbFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiIFx1MjAyMiBcIikgfHwgbW9uc3Rlci5wYXRoO1xuXG4gICAgICBpbmZvLmFwcGVuZENoaWxkKG5hbWUpO1xuICAgICAgaW5mby5hcHBlbmRDaGlsZChtZXRhKTtcblxuICAgICAgY29uc3QgYWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBhY3Rpb25zLmNsYXNzTmFtZSA9IFwic2QtZW5jb3VudGVyLW1vbnN0ZXItYWN0aW9uc1wiO1xuXG4gICAgICBjb25zdCBwcmV2aWV3QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgIHByZXZpZXdCdXR0b24udGV4dENvbnRlbnQgPSBcIlByZXZpZXdcIjtcblxuICAgICAgcHJldmlld0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIHNob3dNb25zdGVyUHJldmlldyh0aGlzLmFwcCwgZXZlbnQsIG1vbnN0ZXIpO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGFkZEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBhZGRCdXR0b24udGV4dENvbnRlbnQgPSBcIkFkZFwiO1xuICAgICAgYWRkQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJtb2QtY3RhXCIpO1xuXG4gICAgICBhZGRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5hZGRNb25zdGVyKG1vbnN0ZXIpO1xuICAgICAgfSk7XG5cbiAgICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQocHJldmlld0J1dHRvbik7XG4gICAgICBhY3Rpb25zLmFwcGVuZENoaWxkKGFkZEJ1dHRvbik7XG5cbiAgICAgIHdyYXBwZXIuYXBwZW5kQ2hpbGQoaW5mbyk7XG4gICAgICB3cmFwcGVyLmFwcGVuZENoaWxkKGFjdGlvbnMpO1xuXG4gICAgICByb3cuYXBwZW5kQ2hpbGQod3JhcHBlcik7XG4gICAgICByZXN1bHRzRWwuYXBwZW5kQ2hpbGQocm93KTtcbiAgICB9XG4gIH1cblxuICByZW5kZXJTZWxlY3RlZE1vbnN0ZXJzKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkRWwgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFxuICAgICAgJ1tkYXRhLXJvbGU9XCJzZWxlY3RlZC1tb25zdGVyc1wiXSdcbiAgICApO1xuXG4gICAgaWYgKCEoc2VsZWN0ZWRFbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGVjdGVkRWwuZW1wdHkoKTtcblxuICAgIGlmICh0aGlzLnNlbGVjdGVkTW9uc3RlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBzZWxlY3RlZEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IFwiTm8gbW9uc3RlcnMgc2VsZWN0ZWQgeWV0LlwiXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiB0aGlzLnNlbGVjdGVkTW9uc3RlcnMpIHtcbiAgICAgIGNvbnN0IHJvd0VsID0gc2VsZWN0ZWRFbC5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXNlbGVjdGVkLXJvd1wiXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgaW5mb0VsID0gcm93RWwuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zZWxlY3RlZC1pbmZvXCJcbiAgICAgIH0pO1xuXG4gICAgICBpbmZvRWwuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zZWxlY3RlZC1uYW1lXCIsXG4gICAgICAgIHRleHQ6IG1vbnN0ZXIubmFtZVxuICAgICAgfSk7XG5cbiAgICAgIGluZm9FbC5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXNlbGVjdGVkLXBhdGhcIixcbiAgICAgICAgdGV4dDogbW9uc3Rlci5wYXRoXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcXR5SW5wdXQgPSByb3dFbC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgdHlwZTogXCJudW1iZXJcIlxuICAgICAgfSk7XG5cbiAgICAgIHF0eUlucHV0LnZhbHVlID0gU3RyaW5nKG1vbnN0ZXIucXR5KTtcbiAgICAgIHF0eUlucHV0Lm1pbiA9IFwiMVwiO1xuXG4gICAgICBxdHlJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgcXR5ID0gTnVtYmVyKHF0eUlucHV0LnZhbHVlKTtcblxuICAgICAgICBtb25zdGVyLnF0eSA9XG4gICAgICAgICAgTnVtYmVyLmlzRmluaXRlKHF0eSkgJiYgcXR5ID4gMFxuICAgICAgICAgICAgPyBNYXRoLmZsb29yKHF0eSlcbiAgICAgICAgICAgIDogMTtcblxuICAgICAgICB0aGlzLnJlbmRlckVuY291bnRlclN1bW1hcnkoKTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZW1vdmVCdXR0b24gPSByb3dFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIHRleHQ6IFwiUmVtb3ZlXCJcbiAgICAgIH0pO1xuXG4gICAgICByZW1vdmVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZE1vbnN0ZXJzID0gdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLmZpbHRlcihcbiAgICAgICAgICAoc2VsZWN0ZWQpID0+IHNlbGVjdGVkLnBhdGggIT09IG1vbnN0ZXIucGF0aFxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMucmVuZGVyU2VsZWN0ZWRNb25zdGVycygpO1xuICAgICAgICB0aGlzLnJlbmRlckVuY291bnRlclN1bW1hcnkoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlckVuY291bnRlclN1bW1hcnkoKTogdm9pZCB7XG4gICAgY29uc3Qgc3VtbWFyeUVsID0gdGhpcy5jb250ZW50RWwucXVlcnlTZWxlY3RvcihcbiAgICAgICdbZGF0YS1yb2xlPVwiZW5jb3VudGVyLXN1bW1hcnlcIl0nXG4gICAgKTtcblxuICAgIGlmICghKHN1bW1hcnlFbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN1bW1hcnlFbC5lbXB0eSgpO1xuXG4gICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMuZ2V0RW5jb3VudGVyU3VtbWFyeSgpO1xuXG4gICAgc3VtbWFyeUVsLmNyZWF0ZUVsKFwiaDRcIiwge1xuICAgICAgdGV4dDogXCJFbmNvdW50ZXIgU3VtbWFyeVwiXG4gICAgfSk7XG5cbiAgICBzdW1tYXJ5RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBUb3RhbCBNb25zdGVyczogJHtzdW1tYXJ5LnRvdGFsTW9uc3RlcnN9YFxuICAgIH0pO1xuXG4gICAgc3VtbWFyeUVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgVW5pcXVlIE1vbnN0ZXJzOiAke3N1bW1hcnkudW5pcXVlTW9uc3RlcnN9YFxuICAgIH0pO1xuXG4gICAgc3VtbWFyeUVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgQXZlcmFnZSBNb25zdGVyIExldmVsOiAke3N1bW1hcnkuYXZlcmFnZUxldmVsLnRvRml4ZWQoMSl9YFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0RW5jb3VudGVyU3VtbWFyeSgpOiB7XG4gICAgdG90YWxNb25zdGVyczogbnVtYmVyO1xuICAgIHVuaXF1ZU1vbnN0ZXJzOiBudW1iZXI7XG4gICAgYXZlcmFnZUxldmVsOiBudW1iZXI7XG4gIH0ge1xuICAgIGNvbnN0IHRvdGFsTW9uc3RlcnMgPSB0aGlzLnNlbGVjdGVkTW9uc3RlcnMucmVkdWNlKFxuICAgICAgKHN1bSwgbW9uc3RlcikgPT4gc3VtICsgbW9uc3Rlci5xdHksXG4gICAgICAwXG4gICAgKTtcblxuICAgIGNvbnN0IHVuaXF1ZU1vbnN0ZXJzID0gdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLmxlbmd0aDtcblxuICAgIGxldCB0b3RhbExldmVscyA9IDA7XG4gICAgbGV0IGNvdW50ZWRNb25zdGVycyA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgdGhpcy5zZWxlY3RlZE1vbnN0ZXJzKSB7XG4gICAgICBjb25zdCBsZXZlbCA9IE51bWJlcihtb25zdGVyLmxldmVsKTtcblxuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4obGV2ZWwpKSB7XG4gICAgICAgIHRvdGFsTGV2ZWxzICs9IGxldmVsICogbW9uc3Rlci5xdHk7XG4gICAgICAgIGNvdW50ZWRNb25zdGVycyArPSBtb25zdGVyLnF0eTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhdmVyYWdlTGV2ZWwgPVxuICAgICAgY291bnRlZE1vbnN0ZXJzID4gMFxuICAgICAgICA/IHRvdGFsTGV2ZWxzIC8gY291bnRlZE1vbnN0ZXJzXG4gICAgICAgIDogMDtcblxuICAgIHJldHVybiB7XG4gICAgICB0b3RhbE1vbnN0ZXJzLFxuICAgICAgdW5pcXVlTW9uc3RlcnMsXG4gICAgICBhdmVyYWdlTGV2ZWxcbiAgICB9O1xuICB9XG5cbiAgYWRkTW9uc3Rlcihtb25zdGVyOiBNb25zdGVyU3VtbWFyeSk6IHZvaWQge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLmZpbmQoXG4gICAgICAoc2VsZWN0ZWQpID0+IHNlbGVjdGVkLnBhdGggPT09IG1vbnN0ZXIucGF0aFxuICAgICk7XG5cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIGV4aXN0aW5nLnF0eSArPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNlbGVjdGVkTW9uc3RlcnMucHVzaCh7XG4gICAgICAgIG5hbWU6IG1vbnN0ZXIubmFtZSxcbiAgICAgICAgcGF0aDogbW9uc3Rlci5wYXRoLFxuICAgICAgICBxdHk6IDEsXG4gICAgICAgIGxldmVsOiBtb25zdGVyLmxldmVsLFxuICAgICAgICBhYzogbW9uc3Rlci5hYyxcbiAgICAgICAgaHA6IG1vbnN0ZXIuaHAsXG4gICAgICAgIGRleDogbW9uc3Rlci5kZXhcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyU2VsZWN0ZWRNb25zdGVycygpO1xuICAgIHRoaXMucmVuZGVyRW5jb3VudGVyU3VtbWFyeSgpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZUVuY291bnRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5lbmNvdW50ZXJOYW1lLnRyaW0oKTtcblxuICAgIGlmICghbmFtZSkge1xuICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBuYW1lIGlzIHJlcXVpcmVkLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMuaXNFZGl0aW5nICYmIHRoaXMuZmlsZVRvRWRpdCkge1xuICAgICAgICBhd2FpdCB0aGlzLmVuY291bnRlclNlcnZpY2UudXBkYXRlRW5jb3VudGVyTm90ZShcbiAgICAgICAgICB0aGlzLmZpbGVUb0VkaXQsXG4gICAgICAgICAgdGhpcy5nZXRFbmNvdW50ZXJEYXRhKClcbiAgICAgICAgKTtcblxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT5cbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChyZXNvbHZlLCAzMDApXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmVuY291bnRlclNlcnZpY2UudXBkYXRlRW5jb3VudGVyTm90ZShcbiAgICAgICAgICB0aGlzLmZpbGVUb0VkaXQsXG4gICAgICAgICAgdGhpcy5nZXRFbmNvdW50ZXJEYXRhKClcbiAgICAgICAgKTtcblxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT5cbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChyZXNvbHZlLCAzMDApXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG5cbiAgICAgICAgYXdhaXQgdmlldz8ucHJldmlld01vZGUucmVyZW5kZXIodHJ1ZSk7XG5cbiAgICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBzYXZlZC5cIik7XG4gICAgICB9ZWxzZSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZW5jb3VudGVyU2VydmljZS5jcmVhdGVFbmNvdW50ZXJOb3RlKFxuICAgICAgICAgIHRoaXMuZ2V0RW5jb3VudGVyRGF0YSgpXG4gICAgICAgICk7XG5cbiAgICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgICB0aGlzLmlzRHVwbGljYXRpbmdcbiAgICAgICAgICAgID8gXCJFbmNvdW50ZXIgZHVwbGljYXRlZC5cIlxuICAgICAgICAgICAgOiBcIkVuY291bnRlciBjcmVhdGVkLlwiXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBzYXZlIGVuY291bnRlcjpcIiwgZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcIkZhaWxlZCB0byBzYXZlIGVuY291bnRlci4gQ2hlY2sgY29uc29sZS5cIik7XG4gICAgfVxuICB9XG59IiwgImltcG9ydCB7IEFwcCwgTWVudSwgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBNb25zdGVyU3VtbWFyeSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93TW9uc3RlclByZXZpZXcoXG4gIGFwcDogQXBwLFxuICBldmVudDogTW91c2VFdmVudCxcbiAgbW9uc3RlcjogTW9uc3RlclN1bW1hcnlcbik6IHZvaWQge1xuXG4gIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKG1vbnN0ZXIubmFtZSlcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChtb25zdGVyLnBhdGgpO1xuXG4gICAgICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgYXBwLndvcmtzcGFjZS5nZXRMZWFmKHRydWUpLm9wZW5GaWxlKGZpbGUpO1xuICAgICB9KTtcbiAgfSk7XG5cbiAgbWVudS5hZGRTZXBhcmF0b3IoKTtcblxuICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICBpdGVtLnNldFRpdGxlKFxuICAgICAgW1xuICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgbW9uc3Rlci5hYyA/IGBBQyAke21vbnN0ZXIuYWN9YCA6IG51bGwsXG4gICAgICAgIG1vbnN0ZXIuaHAgPyBgSFAgJHttb25zdGVyLmhwfWAgOiBudWxsXG4gICAgICBdXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLmpvaW4oXCIgXHUyMDIyIFwiKVxuICAgICk7XG5cbiAgICBpdGVtLnNldERpc2FibGVkKHRydWUpO1xuICB9KTtcblxuICBpZiAobW9uc3Rlci5hdGspIHtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uc2V0VGl0bGUoYEFUSzogJHttb25zdGVyLmF0a31gKTtcbiAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgfSk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHRyYWl0IG9mIG1vbnN0ZXIudHJhaXRzID8/IFtdKSB7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLnNldFRpdGxlKHRyYWl0KTtcbiAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgfSk7XG4gIH1cblxuICBtZW51LmFkZFNlcGFyYXRvcigpO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgIC5zZXRUaXRsZShcIkNvcHkgTW9uc3RlciBQYXRoXCIpXG4gICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KG1vbnN0ZXIucGF0aCk7XG5cbiAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgcGF0aCBjb3BpZWQuXCIpO1xuICAgICAgfSk7XG4gIH0pO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgIC5zZXRUaXRsZShcIk9wZW4gaW4gTmV3IFRhYlwiKVxuICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChtb25zdGVyLnBhdGgpO1xuICAgICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKS5vcGVuRmlsZShmaWxlKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICBpdGVtXG4gICAgICAuc2V0VGl0bGUoXCJPcGVuIHRvIHRoZSBSaWdodFwiKVxuICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuXG4gICAgICAgIGNvbnN0IGZpbGUgPVxuICAgICAgICAgIGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobW9uc3Rlci5wYXRoKTtcblxuICAgICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxlYWYgPVxuICAgICAgICAgIGFwcC53b3Jrc3BhY2UuZ2V0TGVhZihcInNwbGl0XCIsIFwidmVydGljYWxcIik7XG5cbiAgICAgICAgYXdhaXQgbGVhZi5vcGVuRmlsZShmaWxlKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZXZlbnQpO1xufSIsICJpbXBvcnQge1xuICBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0LFxuICBNZW51LFxuICBOb3RpY2UsXG4gIFRGaWxlXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBwYXJzZUZyb250bWF0dGVyIH0gZnJvbSBcIi4uL3N0YXRibG9ja3NDb21wYXQvcGFyc2VGcm9udE1hdHRlclwiO1xuaW1wb3J0IHsgcmVuZGVyTW9uc3RlckJsb2NrIH0gZnJvbSBcIi4uL3N0YXRibG9ja3NDb21wYXQvcmVuZGVyTW9uc3RlckJsb2NrXCI7XG5pbXBvcnQgeyBERUZBVUxUX1NUQVRCTE9DS19SRU5ERVJfU0VUVElOR1MgfSBmcm9tIFwiLi4vc3RhdGJsb2Nrc0NvbXBhdC9zZXR0aW5nc1wiO1xuXG5leHBvcnQgY2xhc3MgRW5jb3VudGVyUmVuZGVyZXIge1xuICBwbHVnaW46IFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKHBsdWdpbjogU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW4pIHtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGV4dHJhY3RTZWN0aW9uKFxuICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICBoZWFkaW5nOiBzdHJpbmdcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoL1xccj9cXG4vKTtcblxuICAgIGNvbnN0IHN0YXJ0SW5kZXggPSBsaW5lcy5maW5kSW5kZXgoXG4gICAgICAobGluZSkgPT4gbGluZS50cmltKCkgPT09IGAjIyAke2hlYWRpbmd9YFxuICAgICk7XG5cbiAgICBpZiAoc3RhcnRJbmRleCA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIGNvbnN0IHNlY3Rpb25MaW5lczogc3RyaW5nW10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydEluZGV4ICsgMTsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBsaW5lID0gbGluZXNbaV07XG5cbiAgICAgIGlmICgvXiMjXFxzKy8udGVzdChsaW5lLnRyaW0oKSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHNlY3Rpb25MaW5lcy5wdXNoKGxpbmUpO1xuICAgIH1cblxuICAgIHJldHVybiBzZWN0aW9uTGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG4gIH1cblxuICByZW5kZXJJbml0aWF0aXZlKFxuICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gICAgZnJvbnRtYXR0ZXI6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogdm9pZCB7XG4gICAgY29uc3QgaW5pdGlhdGl2ZSA9IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIuaW5pdGlhdGl2ZSlcbiAgICAgID8gZnJvbnRtYXR0ZXIuaW5pdGlhdGl2ZVxuICAgICAgOiBbXTtcblxuICAgIGlmIChpbml0aWF0aXZlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGluaXRpYXRpdmVFbCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1yZW5kZXJlZC1pbml0aWF0aXZlXCJcbiAgICB9KTtcblxuICAgIGluaXRpYXRpdmVFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IFwiSW5pdGlhdGl2ZVwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0RWwgPSBpbml0aWF0aXZlRWwuY3JlYXRlRWwoXCJ1bFwiKTtcblxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgaW5pdGlhdGl2ZSkge1xuICAgICAgY29uc3QgaXRlbUVsID0gbGlzdEVsLmNyZWF0ZUVsKFwibGlcIik7XG5cbiAgICAgIGl0ZW1FbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWluaXRpYXRpdmUtcm9sbFwiLFxuICAgICAgICB0ZXh0OiBTdHJpbmcoZW50cnkuaW5pdGlhdGl2ZSA/PyAwKVxuICAgICAgfSk7XG5cbiAgICAgIGl0ZW1FbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICB0ZXh0OiBTdHJpbmcoZW50cnkubmFtZSA/PyBcIlVua25vd25cIilcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJlZ2lzdGVyKCk6IHZvaWQge1xuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyTWFya2Rvd25Qb3N0UHJvY2Vzc29yKFxuICAgICAgKFxuICAgICAgICBlbDogSFRNTEVsZW1lbnQsXG4gICAgICAgIGN0eDogTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dFxuICAgICAgKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5wcm9jZXNzKGVsLCBjdHgpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBhc3luYyBwcm9jZXNzKFxuICAgIGVsOiBIVE1MRWxlbWVudCxcbiAgICBjdHg6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHRcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2VjdGlvbkluZm8gPSBjdHguZ2V0U2VjdGlvbkluZm8oZWwpO1xuXG4gICAgaWYgKCFzZWN0aW9uSW5mbyB8fCBzZWN0aW9uSW5mby5saW5lU3RhcnQgIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID1cbiAgICAgIHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoXG4gICAgICAgIGN0eC5zb3VyY2VQYXRoXG4gICAgICApO1xuXG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNhY2hlID1cbiAgICAgIHRoaXMucGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcblxuICAgIGNvbnN0IGZyb250bWF0dGVyID0gY2FjaGU/LmZyb250bWF0dGVyO1xuXG4gICAgaWYgKGZyb250bWF0dGVyPy5zaGFkb3dkYXJrVHlwZSAhPT0gXCJlbmNvdW50ZXJcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnBsdWdpbi5hcHAudmF1bHQucmVhZChmaWxlKTtcblxuICAgIGNvbnN0IGV4aXN0aW5nUmVuZGVyID0gZWwucXVlcnlTZWxlY3RvcihcbiAgICAgIFwiLnNkLWVuY291bnRlci1yZW5kZXJlZFwiXG4gICAgKTtcblxuICAgIGlmIChlbC5xdWVyeVNlbGVjdG9yKFwiLnNkLWVuY291bnRlci1yZW5kZXJlZFwiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRhaW5lciA9IGVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkXCJcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImgyXCIsIHtcbiAgICAgIHRleHQ6IGZyb250bWF0dGVyLm5hbWUgPz8gZmlsZS5iYXNlbmFtZVxuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkLW1ldGFcIixcbiAgICAgIHRleHQ6IFtcbiAgICAgICAgZnJvbnRtYXR0ZXIucGFydHlMZXZlbFxuICAgICAgICAgID8gYFBhcnR5IExldmVsICR7ZnJvbnRtYXR0ZXIucGFydHlMZXZlbH1gXG4gICAgICAgICAgOiBudWxsLFxuICAgICAgICBmcm9udG1hdHRlci5wYXJ0eVNpemVcbiAgICAgICAgICA/IGAke2Zyb250bWF0dGVyLnBhcnR5U2l6ZX0gUENzYFxuICAgICAgICAgIDogbnVsbCxcbiAgICAgICAgXVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5qb2luKFwiIFx1MjAyMiBcIilcbiAgICB9KTtcblxuICAgIGlmIChmcm9udG1hdHRlci5zdGF0dXMpIHtcbiAgICAgIGNvbnRhaW5lci5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICBjbHM6IGBzZC1lbmNvdW50ZXItc3RhdHVzLWJhZGdlIGlzLSR7ZnJvbnRtYXR0ZXIuc3RhdHVzfWAsXG4gICAgICAgIHRleHQ6IFN0cmluZyhmcm9udG1hdHRlci5zdGF0dXMpLnRvVXBwZXJDYXNlKClcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICB0aGlzLnJlbmRlckRhc2hib2FyZFN0YXRzKGNvbnRhaW5lciwgZnJvbnRtYXR0ZXIpO1xuICAgIHRoaXMucmVuZGVyQ29tcGFjdE1vbnN0ZXJSb3N0ZXIoY29udGFpbmVyLCBmcm9udG1hdHRlcik7XG4gICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dJbml0aWF0aXZlKSB7XG4gICAgICB0aGlzLnJlbmRlckluaXRpYXRpdmUoY29udGFpbmVyLCBmcm9udG1hdHRlcik7XG4gICAgfVxuICB9XG5cbiAgZ2V0RW5jb3VudGVyRGlmZmljdWx0eShcbiAgICBmcm9udG1hdHRlcjogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhcnR5TGV2ZWwgPSBOdW1iZXIoZnJvbnRtYXR0ZXIucGFydHlMZXZlbCA/PyAxKTtcbiAgICBjb25zdCBwYXJ0eVNpemUgPSBOdW1iZXIoZnJvbnRtYXR0ZXIucGFydHlTaXplID8/IDQpO1xuXG4gICAgY29uc3QgbW9uc3RlcnMgPSBBcnJheS5pc0FycmF5KGZyb250bWF0dGVyLm1vbnN0ZXJzKVxuICAgICAgPyBmcm9udG1hdHRlci5tb25zdGVyc1xuICAgICAgOiBbXTtcblxuICAgIGNvbnN0IHBhcnR5UG93ZXIgPSBwYXJ0eUxldmVsICogcGFydHlTaXplO1xuXG4gICAgY29uc3QgbW9uc3RlclBvd2VyID0gbW9uc3RlcnMucmVkdWNlKFxuICAgICAgKHN1bTogbnVtYmVyLCBtb25zdGVyOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSA9PiB7XG4gICAgICAgIGNvbnN0IHF0eSA9IE51bWJlcihtb25zdGVyLnF0eSA/PyAxKTtcbiAgICAgICAgY29uc3QgbGV2ZWwgPSBOdW1iZXIobW9uc3Rlci5sZXZlbCA/PyAwKTtcblxuICAgICAgICByZXR1cm4gc3VtICsgcXR5ICogbGV2ZWw7XG4gICAgICB9LFxuICAgICAgMFxuICAgICk7XG5cbiAgICBpZiAobW9uc3RlclBvd2VyIDw9IDApIHtcbiAgICAgIHJldHVybiBcIk5vbmVcIjtcbiAgICB9XG5cbiAgICBjb25zdCByYXRpbyA9IG1vbnN0ZXJQb3dlciAvIHBhcnR5UG93ZXI7XG5cbiAgICBpZiAocmF0aW8gPCAwLjUpIHtcbiAgICAgIHJldHVybiBcIkVhc3lcIjtcbiAgICB9XG5cbiAgICBpZiAocmF0aW8gPCAwLjg1KSB7XG4gICAgICByZXR1cm4gXCJTdGFuZGFyZFwiO1xuICAgIH1cblxuICAgIGlmIChyYXRpbyA8IDEuMjUpIHtcbiAgICAgIHJldHVybiBcIkhhcmRcIjtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJEZWFkbHlcIjtcbiAgfVxuXG4gIHJlbmRlckRhc2hib2FyZFN0YXRzKFxuICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gICAgZnJvbnRtYXR0ZXI6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogdm9pZCB7XG4gICAgY29uc3QgbW9uc3RlcnMgPSBBcnJheS5pc0FycmF5KGZyb250bWF0dGVyLm1vbnN0ZXJzKVxuICAgICAgPyBmcm9udG1hdHRlci5tb25zdGVyc1xuICAgICAgOiBbXTtcblxuICAgIGNvbnN0IHRvdGFsTW9uc3RlcnMgPSBtb25zdGVycy5yZWR1Y2UoXG4gICAgICAoc3VtOiBudW1iZXIsIG1vbnN0ZXI6IFJlY29yZDxzdHJpbmcsIGFueT4pID0+XG4gICAgICAgIHN1bSArIE51bWJlcihtb25zdGVyLnF0eSA/PyAxKSxcbiAgICAgIDBcbiAgICApO1xuXG4gICAgY29uc3QgdW5pcXVlTW9uc3RlcnMgPSBtb25zdGVycy5sZW5ndGg7XG5cbiAgICBsZXQgdG90YWxMZXZlbHMgPSAwO1xuICAgIGxldCBjb3VudGVkTW9uc3RlcnMgPSAwO1xuXG4gICAgZm9yIChjb25zdCBtb25zdGVyIG9mIG1vbnN0ZXJzKSB7XG4gICAgICBjb25zdCBsZXZlbCA9IE51bWJlcihtb25zdGVyLmxldmVsKTtcblxuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4obGV2ZWwpKSB7XG4gICAgICAgIGNvbnN0IHF0eSA9IE51bWJlcihtb25zdGVyLnF0eSA/PyAxKTtcblxuICAgICAgICB0b3RhbExldmVscyArPSBsZXZlbCAqIHF0eTtcbiAgICAgICAgY291bnRlZE1vbnN0ZXJzICs9IHF0eTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhdmVyYWdlTGV2ZWwgPVxuICAgICAgY291bnRlZE1vbnN0ZXJzID4gMFxuICAgICAgICA/IHRvdGFsTGV2ZWxzIC8gY291bnRlZE1vbnN0ZXJzXG4gICAgICAgIDogMDtcblxuICAgIGNvbnN0IGRpZmZpY3VsdHkgPVxuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd0RpZmZpY3VsdHlcbiAgICAgICAgPyBgIFx1MjAyMiAke3RoaXMuZ2V0RW5jb3VudGVyRGlmZmljdWx0eShmcm9udG1hdHRlcil9YFxuICAgICAgICA6IFwiXCI7XG5cbiAgICBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcmVuZGVyZWQtc3RhdHNcIixcbiAgICAgIHRleHQ6XG4gICAgICAgIGAke3RvdGFsTW9uc3RlcnN9IE1vbnN0ZXJzYCArXG4gICAgICAgIGAgXHUyMDIyICR7dW5pcXVlTW9uc3RlcnN9IFVuaXF1ZWAgK1xuICAgICAgICBgIFx1MjAyMiBBdmcgTHYgJHthdmVyYWdlTGV2ZWwudG9GaXhlZCgxKX1gICtcbiAgICAgICAgZGlmZmljdWx0eVxuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyQ29tcGFjdE1vbnN0ZXJSb3N0ZXIoXG4gICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgICBmcm9udG1hdHRlcjogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiB2b2lkIHtcbiAgICBjb25zdCBtb25zdGVycyA9IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIubW9uc3RlcnMpXG4gICAgICA/IGZyb250bWF0dGVyLm1vbnN0ZXJzXG4gICAgICA6IFtdO1xuXG4gICAgaWYgKG1vbnN0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcmVuZGVyZWQtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJObyBtb25zdGVycyBhZGRlZC5cIlxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByb3N0ZXJFbCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1yZW5kZXJlZC1yb3N0ZXJcIlxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBtb25zdGVyIG9mIG1vbnN0ZXJzKSB7XG4gICAgICBjb25zdCBxdHkgPSBtb25zdGVyLnF0eSA/PyAxO1xuICAgICAgY29uc3QgbmFtZSA9IG1vbnN0ZXIubmFtZSA/PyBcIlVua25vd24gTW9uc3RlclwiO1xuXG4gICAgICBjb25zdCBtZXRhID0gW1xuICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgbW9uc3Rlci5hYyA/IGBBQyAke21vbnN0ZXIuYWN9YCA6IG51bGwsXG4gICAgICAgIG1vbnN0ZXIuaHAgPyBgSFAgJHttb25zdGVyLmhwfWAgOiBudWxsXG4gICAgICBdXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLmpvaW4oXCIgXHUyMDIyIFwiKTtcblxuICAgICAgY29uc3QgcGlsbEVsID0gcm9zdGVyRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkLW1vbnN0ZXJcIixcbiAgICAgICAgdGV4dDogbWV0YVxuICAgICAgICAgID8gYCR7cXR5fXggJHtuYW1lfSBcdTIwMjIgJHttZXRhfWBcbiAgICAgICAgICA6IGAke3F0eX14ICR7bmFtZX1gXG4gICAgICB9KTtcblxuICAgICAgcGlsbEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5zaG93TW9uc3RlclBpbGxNZW51KGV2ZW50LCBtb25zdGVyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHNob3dNb25zdGVyUGlsbE1lbnUoXG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQsXG4gICAgbW9uc3RlcjogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiB2b2lkIHtcbiAgICBjb25zdCBwYXRoID0gbW9uc3Rlci5wYXRoO1xuICAgIGNvbnN0IG5hbWUgPSBtb25zdGVyLm5hbWUgPz8gXCJVbmtub3duIE1vbnN0ZXJcIjtcblxuICAgIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZShgT3BlbiAke25hbWV9YClcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMub3Blbk1vbnN0ZXIocGF0aCwgXCJjdXJyZW50XCIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbVxuICAgICAgICAuc2V0VGl0bGUoXCJPcGVuIGluIE5ldyBUYWJcIilcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMub3Blbk1vbnN0ZXIocGF0aCwgXCJuZXctdGFiXCIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbVxuICAgICAgICAuc2V0VGl0bGUoXCJPcGVuIHRvIHRoZSBSaWdodFwiKVxuICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5vcGVuTW9uc3RlcihwYXRoLCBcInJpZ2h0XCIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKFwiUHJldmlldyBTdGF0YmxvY2tcIilcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2hvd01vbnN0ZXJTdGF0YmxvY2tQcmV2aWV3KG1vbnN0ZXIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uc2V0VGl0bGUoXG4gICAgICAgIFtcbiAgICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgICBtb25zdGVyLmFjID8gYEFDICR7bW9uc3Rlci5hY31gIDogbnVsbCxcbiAgICAgICAgICBtb25zdGVyLmhwID8gYEhQICR7bW9uc3Rlci5ocH1gIDogbnVsbFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiIFx1MjAyMiBcIikgfHwgXCJObyBzdGF0cyBhdmFpbGFibGVcIlxuICAgICAgKTtcblxuICAgICAgaXRlbS5zZXREaXNhYmxlZCh0cnVlKTtcbiAgICB9KTtcblxuICAgIG1lbnUuc2hvd0F0TW91c2VFdmVudChldmVudCk7XG4gIH1cblxuICBhc3luYyBvcGVuTW9uc3RlcihcbiAgICBwYXRoOiB1bmtub3duLFxuICAgIG1vZGU6IFwiY3VycmVudFwiIHwgXCJuZXctdGFiXCIgfCBcInJpZ2h0XCJcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiIHx8IHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9XG4gICAgICB0aGlzLnBsdWdpbi5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuXG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChtb2RlID09PSBcInJpZ2h0XCIpIHtcbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2VcbiAgICAgICAgLmdldExlYWYoXCJzcGxpdFwiLCBcInZlcnRpY2FsXCIpXG4gICAgICAgIC5vcGVuRmlsZShmaWxlKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChtb2RlID09PSBcIm5ldy10YWJcIikge1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZVxuICAgICAgICAuZ2V0TGVhZih0cnVlKVxuICAgICAgICAub3BlbkZpbGUoZmlsZSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlXG4gICAgICAuZ2V0TGVhZihmYWxzZSlcbiAgICAgIC5vcGVuRmlsZShmaWxlKTtcbiAgfVxuXG4gIGFzeW5jIHNob3dNb25zdGVyU3RhdGJsb2NrUHJldmlldyhcbiAgICBtb25zdGVyOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHBhdGggPSBtb25zdGVyLnBhdGg7XG5cbiAgICBpZiAodHlwZW9mIHBhdGggIT09IFwic3RyaW5nXCIgfHwgcGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJNb25zdGVyIGZpbGUgbm90IGZvdW5kLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID1cbiAgICAgIHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG5cbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY2FjaGUgPVxuICAgICAgdGhpcy5wbHVnaW4uYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuXG4gICAgY29uc3QgZnJvbnRtYXR0ZXIgPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG5cbiAgICBpZiAoIWZyb250bWF0dGVyKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBoYXMgbm8gZnJvbnRtYXR0ZXIuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlRnJvbnRtYXR0ZXIoZnJvbnRtYXR0ZXIpO1xuXG4gICAgaWYgKCFyZXN1bHQuc3VjY2VzcyB8fCAhcmVzdWx0LmRhdGEpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJDb3VsZCBub3QgcGFyc2UgbW9uc3Rlci5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJldmlld0VsID0gZG9jdW1lbnQuYm9keS5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zdGF0YmxvY2stcHJldmlld1wiXG4gICAgfSk7XG5cbiAgICBjb25zdCBpbm5lckVsID0gcHJldmlld0VsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXN0YXRibG9jay1wcmV2aWV3LWlubmVyXCJcbiAgICB9KTtcblxuICAgIHJlbmRlck1vbnN0ZXJCbG9jayhcbiAgICAgIGlubmVyRWwsXG4gICAgICByZXN1bHQuZGF0YSxcbiAgICAgIERFRkFVTFRfU1RBVEJMT0NLX1JFTkRFUl9TRVRUSU5HUyxcbiAgICAgIHJlc3VsdC53YXJuaW5nc1xuICAgICk7XG5cbiAgICBjb25zdCBjbG9zZUJ1dHRvbiA9IHByZXZpZXdFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXN0YXRibG9jay1wcmV2aWV3LWNsb3NlXCIsXG4gICAgICB0ZXh0OiBcIlx1MDBEN1wiXG4gICAgfSk7XG5cbiAgICBjbG9zZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgcHJldmlld0VsLnJlbW92ZSgpO1xuICAgIH0pO1xuXG4gICAgcHJldmlld0VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChldmVudC50YXJnZXQgPT09IHByZXZpZXdFbCkge1xuICAgICAgICBwcmV2aWV3RWwucmVtb3ZlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn0iLCAiaW1wb3J0IHsgU2hhZG93ZGFya0F0dGFjaywgU2hhZG93ZGFya01vbnN0ZXIgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG50eXBlIExvb3NlTW9uc3RlciA9IFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYge1xuICBuYW1lPzogdW5rbm93bjtcbiAgbGV2ZWw/OiB1bmtub3duO1xuICBhbGlnbm1lbnQ/OiB1bmtub3duO1xuICB0eXBlPzogdW5rbm93bjtcbiAgYWM/OiB1bmtub3duO1xuICBocD86IHVua25vd247XG4gIG12PzogdW5rbm93bjtcbiAgYXRrPzogdW5rbm93bjtcbiAgc3RhdHM/OiB1bmtub3duO1xuICBzdHI/OiB1bmtub3duO1xuICBkZXg/OiB1bmtub3duO1xuICBjb24/OiB1bmtub3duO1xuICBpbnQ/OiB1bmtub3duO1xuICB3aXM/OiB1bmtub3duO1xuICBjaGE/OiB1bmtub3duO1xuICB0cmFpdHM/OiB1bmtub3duO1xuICBzcGVjaWFscz86IHVua25vd247XG4gIHNwZWxscz86IHVua25vd247XG4gIGdlYXI/OiB1bmtub3duO1xuICBkZXNjcmlwdGlvbj86IHVua25vd247XG4gIHNvdXJjZT86IHVua25vd247XG4gIHRhZ3M/OiB1bmtub3duO1xufTtcblxuZnVuY3Rpb24gYXNTdHJpbmcodmFsdWU6IHVua25vd24sIGZhbGxiYWNrID0gXCJcIik6IHN0cmluZyB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG5cbiAgaWYgKFxuICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiB8fFxuICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiB8fFxuICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCJcbiAgKSB7XG4gICAgcmV0dXJuIFN0cmluZyh2YWx1ZSkudHJpbSgpO1xuICB9XG5cbiAgcmV0dXJuIGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVNb2RpZmllcih2YWx1ZTogdW5rbm93biwgZmFsbGJhY2sgPSBcIiswXCIpOiBzdHJpbmcge1xuICBjb25zdCByYXcgPSBhc1N0cmluZyh2YWx1ZSwgZmFsbGJhY2spO1xuICBpZiAoIXJhdykgcmV0dXJuIGZhbGxiYWNrO1xuICBpZiAoL15bKy1dXFxkKyQvLnRlc3QocmF3KSkgcmV0dXJuIHJhdztcbiAgaWYgKC9eXFxkKyQvLnRlc3QocmF3KSkgcmV0dXJuIGArJHtyYXd9YDtcbiAgaWYgKC9eLVxcZCskLy50ZXN0KHJhdykpIHJldHVybiByYXc7XG4gIHJldHVybiByYXc7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN0cmluZ0FycmF5KHZhbHVlOiB1bmtub3duKTogc3RyaW5nW10ge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUubWFwKChpdGVtKSA9PiBhc1N0cmluZyhpdGVtKSkuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiB2YWx1ZVxuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gIH1cblxuICByZXR1cm4gW107XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUF0dGFjayhpdGVtOiB1bmtub3duKTogU2hhZG93ZGFya0F0dGFjayB8IG51bGwge1xuICBpZiAodHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogaXRlbS50cmltKCksXG4gICAgICByYXc6IGl0ZW0udHJpbSgpXG4gICAgfTtcbiAgfVxuXG4gIGlmIChpdGVtICYmIHR5cGVvZiBpdGVtID09PSBcIm9iamVjdFwiKSB7XG4gICAgY29uc3Qgb2JqID0gaXRlbSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICBjb25zdCBuYW1lID0gYXNTdHJpbmcob2JqLm5hbWUpO1xuICAgIGlmICghbmFtZSkgcmV0dXJuIG51bGw7XG5cbiAgICByZXR1cm4ge1xuICAgICAgbmFtZSxcbiAgICAgIGJvbnVzOiBhc1N0cmluZyhvYmouYm9udXMpLFxuICAgICAgZGFtYWdlOiBhc1N0cmluZyhvYmouZGFtYWdlKSxcbiAgICAgIHJhbmdlOiBhc1N0cmluZyhvYmoucmFuZ2UpLFxuICAgICAgbm90ZXM6IGFzU3RyaW5nKG9iai5ub3RlcylcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUF0dGFja3ModmFsdWU6IHVua25vd24pOiBTaGFkb3dkYXJrQXR0YWNrW10ge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWVcbiAgICAgIC5tYXAobm9ybWFsaXplQXR0YWNrKVxuICAgICAgLmZpbHRlcigoYSk6IGEgaXMgU2hhZG93ZGFya0F0dGFjayA9PiBhICE9PSBudWxsKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUudHJpbSgpKSB7XG4gICAgcmV0dXJuIFt7IG5hbWU6IHZhbHVlLnRyaW0oKSwgcmF3OiB2YWx1ZS50cmltKCkgfV07XG4gIH1cblxuICByZXR1cm4gW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVNb25zdGVyKFxuICBpbnB1dDogTG9vc2VNb25zdGVyXG4pOiBTaGFkb3dkYXJrTW9uc3RlciB7XG4gIGNvbnN0IG5lc3RlZFN0YXRzID0gKGlucHV0LnN0YXRzIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkKSA/PyB7fTtcblxuICBjb25zdCBzdHJWYWx1ZSA9IGlucHV0LnN0ciA/PyBuZXN0ZWRTdGF0cy5zdHI7XG4gIGNvbnN0IGRleFZhbHVlID0gaW5wdXQuZGV4ID8/IG5lc3RlZFN0YXRzLmRleDtcbiAgY29uc3QgY29uVmFsdWUgPSBpbnB1dC5jb24gPz8gbmVzdGVkU3RhdHMuY29uO1xuICBjb25zdCBpbnRWYWx1ZSA9IGlucHV0LmludCA/PyBuZXN0ZWRTdGF0cy5pbnQ7XG4gIGNvbnN0IHdpc1ZhbHVlID0gaW5wdXQud2lzID8/IG5lc3RlZFN0YXRzLndpcztcbiAgY29uc3QgY2hhVmFsdWUgPSBpbnB1dC5jaGEgPz8gbmVzdGVkU3RhdHMuY2hhO1xuXG4gIHJldHVybiB7XG4gICAgbmFtZTogYXNTdHJpbmcoaW5wdXQubmFtZSwgXCJVbm5hbWVkIE1vbnN0ZXJcIiksXG4gICAgbGV2ZWw6IGFzU3RyaW5nKGlucHV0LmxldmVsLCBcIj9cIiksXG4gICAgYWxpZ25tZW50OiBhc1N0cmluZyhpbnB1dC5hbGlnbm1lbnQsIFwiXCIpLFxuICAgIHR5cGU6IGFzU3RyaW5nKGlucHV0LnR5cGUsIFwiXCIpLFxuICAgIGFjOiBhc1N0cmluZyhpbnB1dC5hYywgXCI/XCIpLFxuICAgIGhwOiBhc1N0cmluZyhpbnB1dC5ocCwgXCI/XCIpLFxuICAgIG12OiBhc1N0cmluZyhpbnB1dC5tdiwgXCJcIiksXG4gICAgYXRrOiBub3JtYWxpemVBdHRhY2tzKGlucHV0LmF0ayksXG4gICAgc3RhdHM6IHtcbiAgICAgIHN0cjogbm9ybWFsaXplTW9kaWZpZXIoc3RyVmFsdWUsIFwiKzBcIiksXG4gICAgICBkZXg6IG5vcm1hbGl6ZU1vZGlmaWVyKGRleFZhbHVlLCBcIiswXCIpLFxuICAgICAgY29uOiBub3JtYWxpemVNb2RpZmllcihjb25WYWx1ZSwgXCIrMFwiKSxcbiAgICAgIGludDogbm9ybWFsaXplTW9kaWZpZXIoaW50VmFsdWUsIFwiKzBcIiksXG4gICAgICB3aXM6IG5vcm1hbGl6ZU1vZGlmaWVyKHdpc1ZhbHVlLCBcIiswXCIpLFxuICAgICAgY2hhOiBub3JtYWxpemVNb2RpZmllcihjaGFWYWx1ZSwgXCIrMFwiKVxuICAgIH0sXG4gICAgdHJhaXRzOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC50cmFpdHMpLFxuICAgIHNwZWNpYWxzOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC5zcGVjaWFscyksXG4gICAgc3BlbGxzOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC5zcGVsbHMpLFxuICAgIGdlYXI6IG5vcm1hbGl6ZVN0cmluZ0FycmF5KGlucHV0LmdlYXIpLFxuICAgIGRlc2NyaXB0aW9uOiBhc1N0cmluZyhpbnB1dC5kZXNjcmlwdGlvbiwgXCJcIiksXG4gICAgc291cmNlOiBhc1N0cmluZyhpbnB1dC5zb3VyY2UsIFwiXCIpLFxuICAgIHRhZ3M6IG5vcm1hbGl6ZVN0cmluZ0FycmF5KGlucHV0LnRhZ3MpXG4gIH07XG59IiwgImltcG9ydCB7IFBhcnNlUmVzdWx0LCBTaGFkb3dkYXJrTW9uc3RlciB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBub3JtYWxpemVNb25zdGVyIH0gZnJvbSBcIi4vbm9ybWFsaXplTW9uc3RlclwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGcm9udG1hdHRlcihcbiAgZnJvbnRtYXR0ZXI6IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4pOiBQYXJzZVJlc3VsdDxTaGFkb3dkYXJrTW9uc3Rlcj4ge1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGlmICghZnJvbnRtYXR0ZXIgfHwgdHlwZW9mIGZyb250bWF0dGVyICE9PSBcIm9iamVjdFwiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3JzOiBbXCJObyB2YWxpZCBmcm9udG1hdHRlciBmb3VuZC5cIl0sXG4gICAgICB3YXJuaW5nc1xuICAgIH07XG4gIH1cblxuICBjb25zdCBtb25zdGVyID0gbm9ybWFsaXplTW9uc3Rlcihmcm9udG1hdHRlciBhcyBQYXJ0aWFsPFNoYWRvd2RhcmtNb25zdGVyPik7XG5cbiAgaWYgKCFtb25zdGVyLm5hbWUgfHwgbW9uc3Rlci5uYW1lID09PSBcIlVubmFtZWQgTW9uc3RlclwiKSB7XG4gICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaXMgbWlzc2luZyBhIG5hbWUuXCIpO1xuICB9XG5cbiAgaWYgKCFtb25zdGVyLmFjIHx8IG1vbnN0ZXIuYWMgPT09IFwiP1wiKSB7XG4gICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaXMgbWlzc2luZyBBQy5cIik7XG4gIH1cblxuICBpZiAoIW1vbnN0ZXIuaHAgfHwgbW9uc3Rlci5ocCA9PT0gXCI/XCIpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFwiTW9uc3RlciBpcyBtaXNzaW5nIEhQLlwiKTtcbiAgfVxuXG4gIGlmIChtb25zdGVyLmF0ay5sZW5ndGggPT09IDApIHtcbiAgICB3YXJuaW5ncy5wdXNoKFwiTW9uc3RlciBoYXMgbm8gYXR0YWNrcyBsaXN0ZWQuXCIpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIGRhdGE6IG1vbnN0ZXIsXG4gICAgZXJyb3JzLFxuICAgIHdhcm5pbmdzXG4gIH07XG59IiwgImltcG9ydCB7IFNoYWRvd2RhcmtNb25zdGVyLCBTaGFkb3dkYXJrQXR0YWNrIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3MgfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xuXG50eXBlIE1vbnN0ZXJSZW5kZXJPcHRpb25zID0ge1xuICBvblJvbGxEaWNlPzogKGZvcm11bGE6IHN0cmluZykgPT4gdm9pZDtcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZURpdihjbGFzc05hbWU/OiBzdHJpbmcsIHRleHQ/OiBzdHJpbmcpOiBIVE1MRGl2RWxlbWVudCB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICBpZiAodGV4dCAhPT0gdW5kZWZpbmVkKSBlbC50ZXh0Q29udGVudCA9IHRleHQ7XG4gIHJldHVybiBlbDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU3BhbihjbGFzc05hbWU/OiBzdHJpbmcsIHRleHQ/OiBzdHJpbmcpOiBIVE1MU3BhbkVsZW1lbnQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBpZiAoY2xhc3NOYW1lKSBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIGlmICh0ZXh0ICE9PSB1bmRlZmluZWQpIGVsLnRleHRDb250ZW50ID0gdGV4dDtcbiAgcmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMaXN0KGNsYXNzTmFtZT86IHN0cmluZyk6IEhUTUxVTGlzdEVsZW1lbnQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpc3RJdGVtKGNsYXNzTmFtZT86IHN0cmluZyk6IEhUTUxMSUVsZW1lbnQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckF0dGFja1RleHQoYXR0YWNrOiBTaGFkb3dkYXJrQXR0YWNrKTogc3RyaW5nIHtcbiAgaWYgKGF0dGFjay5yYXcpIHJldHVybiBhdHRhY2sucmF3O1xuXG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFthdHRhY2submFtZV07XG5cbiAgaWYgKGF0dGFjay5ib251cykgcGFydHMucHVzaChhdHRhY2suYm9udXMpO1xuICBpZiAoYXR0YWNrLmRhbWFnZSkgcGFydHMucHVzaChgKCR7YXR0YWNrLmRhbWFnZX0pYCk7XG4gIGlmIChhdHRhY2sucmFuZ2UpIHBhcnRzLnB1c2goYFske2F0dGFjay5yYW5nZX1dYCk7XG4gIGlmIChhdHRhY2subm90ZXMpIHBhcnRzLnB1c2goYC0gJHthdHRhY2subm90ZXN9YCk7XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oXCIgXCIpLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gZ2V0QWxpZ25tZW50TGFiZWwoYWxpZ25tZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gYWxpZ25tZW50LnRyaW0oKS50b1VwcGVyQ2FzZSgpO1xuXG4gIHN3aXRjaCAobm9ybWFsaXplZCkge1xuICAgIGNhc2UgXCJMXCI6XG4gICAgICByZXR1cm4gXCJMYXdmdWxcIjtcbiAgICBjYXNlIFwiTlwiOlxuICAgICAgcmV0dXJuIFwiTmV1dHJhbFwiO1xuICAgIGNhc2UgXCJDXCI6XG4gICAgICByZXR1cm4gXCJDaGFvdGljXCI7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNwbGl0QXR0YWNrQ29ubmVjdG9yKHRleHQ6IHN0cmluZyk6IHsgY29ubmVjdG9yOiBzdHJpbmcgfCBudWxsOyBib2R5OiBzdHJpbmcgfSB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgY29uc3QgbWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKEFORHxPUilcXHMrKC4rKSQvaSk7XG5cbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybiB7IGNvbm5lY3RvcjogbnVsbCwgYm9keTogdHJpbW1lZCB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBjb25uZWN0b3I6IG1hdGNoWzFdLnRvVXBwZXJDYXNlKCksXG4gICAgYm9keTogbWF0Y2hbMl0udHJpbSgpXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZURpY2VGb3JtdWxhKGZvcm11bGE6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBmb3JtdWxhLnJlcGxhY2UoL1xccysvZywgXCJcIik7XG59XG5cbmZ1bmN0aW9uIGF0dGFja0JvbnVzVG9Gb3JtdWxhKGJvbnVzOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gYm9udXMudHJpbSgpO1xuICByZXR1cm4gYDFkMjAke25vcm1hbGl6ZWR9YDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRGljZVJvbGxCdXR0b24oXG4gIHRleHQ6IHN0cmluZyxcbiAgZm9ybXVsYTogc3RyaW5nLFxuICBvblJvbGxEaWNlOiAoZm9ybXVsYTogc3RyaW5nKSA9PiB2b2lkXG4pOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ1dHRvbi50eXBlID0gXCJidXR0b25cIjtcbiAgYnV0dG9uLmNsYXNzTmFtZSA9IFwic2QtbW9uc3Rlci1kaWNlLWJ1dHRvblwiO1xuICBidXR0b24udGV4dENvbnRlbnQgPSB0ZXh0O1xuICBidXR0b24udGl0bGUgPSBgUm9sbCAke2Zvcm11bGF9YDtcblxuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldnQpID0+IHtcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgb25Sb2xsRGljZShmb3JtdWxhKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGJ1dHRvbjtcbn1cblxuZnVuY3Rpb24gYXBwZW5kQXR0YWNrQm9keVdpdGhEaWNlQnV0dG9ucyhcbiAgcGFyZW50OiBIVE1MRWxlbWVudCxcbiAgYm9keTogc3RyaW5nLFxuICBvblJvbGxEaWNlOiAoZm9ybXVsYTogc3RyaW5nKSA9PiB2b2lkXG4pOiB2b2lkIHtcbiAgY29uc3QgYXR0YWNrQm9udXNSZWdleCA9IC8oWystXVxcZCspLztcbiAgY29uc3QgZGFtYWdlUmVnZXggPSAvXFxiKFxcZCtkXFxkKyg/OlxccypbKy1dXFxzKlxcZCspPylcXGIvaTtcblxuICBjb25zdCByZXBsYWNlbWVudHM6IEFycmF5PHtcbiAgICBzdGFydDogbnVtYmVyO1xuICAgIGVuZDogbnVtYmVyO1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBmb3JtdWxhOiBzdHJpbmc7XG4gIH0+ID0gW107XG5cbiAgY29uc3QgYm9udXNNYXRjaCA9IGF0dGFja0JvbnVzUmVnZXguZXhlYyhib2R5KTtcbiAgaWYgKGJvbnVzTWF0Y2g/LmluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCB0ZXh0ID0gYm9udXNNYXRjaFsxXTtcbiAgICByZXBsYWNlbWVudHMucHVzaCh7XG4gICAgICBzdGFydDogYm9udXNNYXRjaC5pbmRleCxcbiAgICAgIGVuZDogYm9udXNNYXRjaC5pbmRleCArIHRleHQubGVuZ3RoLFxuICAgICAgdGV4dCxcbiAgICAgIGZvcm11bGE6IGF0dGFja0JvbnVzVG9Gb3JtdWxhKHRleHQpXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBkYW1hZ2VNYXRjaCA9IGRhbWFnZVJlZ2V4LmV4ZWMoYm9keSk7XG4gIGlmIChkYW1hZ2VNYXRjaD8uaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IHRleHQgPSBkYW1hZ2VNYXRjaFsxXTtcbiAgICByZXBsYWNlbWVudHMucHVzaCh7XG4gICAgICBzdGFydDogZGFtYWdlTWF0Y2guaW5kZXgsXG4gICAgICBlbmQ6IGRhbWFnZU1hdGNoLmluZGV4ICsgdGV4dC5sZW5ndGgsXG4gICAgICB0ZXh0LFxuICAgICAgZm9ybXVsYTogbm9ybWFsaXplRGljZUZvcm11bGEodGV4dClcbiAgICB9KTtcbiAgfVxuXG4gIHJlcGxhY2VtZW50cy5zb3J0KChhLCBiKSA9PiBhLnN0YXJ0IC0gYi5zdGFydCk7XG5cbiAgbGV0IGN1cnNvciA9IDA7XG5cbiAgZm9yIChjb25zdCByZXBsYWNlbWVudCBvZiByZXBsYWNlbWVudHMpIHtcbiAgICBpZiAocmVwbGFjZW1lbnQuc3RhcnQgPCBjdXJzb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChyZXBsYWNlbWVudC5zdGFydCA+IGN1cnNvcikge1xuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGJvZHkuc2xpY2UoY3Vyc29yLCByZXBsYWNlbWVudC5zdGFydCkpKTtcbiAgICB9XG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoXG4gICAgICBjcmVhdGVEaWNlUm9sbEJ1dHRvbihyZXBsYWNlbWVudC50ZXh0LCByZXBsYWNlbWVudC5mb3JtdWxhLCBvblJvbGxEaWNlKVxuICAgICk7XG5cbiAgICBjdXJzb3IgPSByZXBsYWNlbWVudC5lbmQ7XG4gIH1cblxuICBpZiAoY3Vyc29yIDwgYm9keS5sZW5ndGgpIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoYm9keS5zbGljZShjdXJzb3IpKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwZW5kVGV4dFdpdGhEYW1hZ2VEaWNlQnV0dG9ucyhcbiAgcGFyZW50OiBIVE1MRWxlbWVudCxcbiAgdGV4dDogc3RyaW5nLFxuICBvblJvbGxEaWNlOiAoZm9ybXVsYTogc3RyaW5nKSA9PiB2b2lkXG4pOiB2b2lkIHtcbiAgY29uc3QgZGFtYWdlUmVnZXggPSAvXFxiXFxkK2RcXGQrKD86XFxzKlsrLV1cXHMqXFxkKyk/XFxiL2dpO1xuXG4gIGxldCBjdXJzb3IgPSAwO1xuICBsZXQgbWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG5cbiAgd2hpbGUgKChtYXRjaCA9IGRhbWFnZVJlZ2V4LmV4ZWModGV4dCkpICE9PSBudWxsKSB7XG4gICAgY29uc3QgZGljZVRleHQgPSBtYXRjaFswXTtcbiAgICBjb25zdCBzdGFydCA9IG1hdGNoLmluZGV4O1xuICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgZGljZVRleHQubGVuZ3RoO1xuXG4gICAgaWYgKHN0YXJ0ID4gY3Vyc29yKSB7XG4gICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dC5zbGljZShjdXJzb3IsIHN0YXJ0KSkpO1xuICAgIH1cblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChcbiAgICAgIGNyZWF0ZURpY2VSb2xsQnV0dG9uKGRpY2VUZXh0LCBub3JtYWxpemVEaWNlRm9ybXVsYShkaWNlVGV4dCksIG9uUm9sbERpY2UpXG4gICAgKTtcblxuICAgIGN1cnNvciA9IGVuZDtcbiAgfVxuXG4gIGlmIChjdXJzb3IgPCB0ZXh0Lmxlbmd0aCkge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0LnNsaWNlKGN1cnNvcikpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBlbmRSZW5kZXJlZEF0dGFjayhcbiAgbGk6IEhUTUxMSUVsZW1lbnQsXG4gIGF0dGFja1RleHQ6IHN0cmluZyxcbiAgc2V0dGluZ3M6IFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3MsXG4gIG9wdGlvbnM6IE1vbnN0ZXJSZW5kZXJPcHRpb25zXG4pOiB2b2lkIHtcbiAgY29uc3QgeyBjb25uZWN0b3IsIGJvZHkgfSA9IHNwbGl0QXR0YWNrQ29ubmVjdG9yKGF0dGFja1RleHQpO1xuXG4gIGlmIChjb25uZWN0b3IpIHtcbiAgICBsaS5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci1hdHRhY2stY29ubmVjdG9yXCIsIGAke2Nvbm5lY3Rvcn0gYCkpO1xuICB9XG5cbiAgY29uc3QgYXR0YWNrVGV4dEVsID0gY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItYXR0YWNrLXRleHRcIik7XG5cbiAgaWYgKHNldHRpbmdzLmVuYWJsZURpY2VSb2xsZXJJbnRlZ3JhdGlvbiAmJiBvcHRpb25zLm9uUm9sbERpY2UpIHtcbiAgICBhcHBlbmRBdHRhY2tCb2R5V2l0aERpY2VCdXR0b25zKGF0dGFja1RleHRFbCwgYm9keSwgb3B0aW9ucy5vblJvbGxEaWNlKTtcbiAgfSBlbHNlIHtcbiAgICBhdHRhY2tUZXh0RWwudGV4dENvbnRlbnQgPSBib2R5O1xuICB9XG5cbiAgbGkuYXBwZW5kQ2hpbGQoYXR0YWNrVGV4dEVsKTtcbn1cblxuZnVuY3Rpb24gc3BsaXRMYWJlbEFuZEJvZHkodGV4dDogc3RyaW5nKTogeyBsYWJlbDogc3RyaW5nOyBib2R5OiBzdHJpbmcgfSB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIHsgbGFiZWw6IFwiXCIsIGJvZHk6IFwiXCIgfTtcbiAgfVxuXG4gIGxldCBtYXRjaDogUmVnRXhwTWF0Y2hBcnJheSB8IG51bGwgPSBudWxsO1xuXG4gIC8vIDEpIFBhcmVudGhldGljYWwgc3BlbGwtc3R5bGUgbGFiZWwgdXAgdG8gZmlyc3QgcGVyaW9kXG4gIC8vIEV4YW1wbGU6IFwiUmF5IG9mIEZyb3N0IChJTlQgMTUpLiBUYXJnZXQgdGFrZXMuLi5cIlxuICBtYXRjaCA9IHRyaW1tZWQubWF0Y2goL14oLnsxLDEwMH0/XFwoW14pXXsxLDQwfVxcKVxcLilcXHMqKC4rKSQvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsOiBtYXRjaFsxXS50cmltKCksXG4gICAgICBib2R5OiBtYXRjaFsyXS50cmltKClcbiAgICB9O1xuICB9XG5cbiAgLy8gMikgU3RhbmRhcmQgc2VudGVuY2UgbGFiZWxcbiAgLy8gRXhhbXBsZTogXCJEZXZvdXIuIFVzZSB0dXJuIHRvIGRldm91ci4uLlwiXG4gIG1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXihbXi4hPzpdezEsODB9Wy4hP10pXFxzKiguKykkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbDogbWF0Y2hbMV0udHJpbSgpLFxuICAgICAgYm9keTogbWF0Y2hbMl0udHJpbSgpXG4gICAgfTtcbiAgfVxuXG4gIC8vIDMpIENvbG9uIGxhYmVsXG4gIC8vIEV4YW1wbGU6IFwiRGV2b3VyOiBVc2UgdHVybiB0byBkZXZvdXIuLi5cIlxuICBtYXRjaCA9IHRyaW1tZWQubWF0Y2goL14oW146XXsxLDgwfTopXFxzKiguKykkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbDogbWF0Y2hbMV0udHJpbSgpLFxuICAgICAgYm9keTogbWF0Y2hbMl0udHJpbSgpXG4gICAgfTtcbiAgfVxuXG4gIC8vIDQpIERhc2ggLyBlbSBkYXNoIGxhYmVsXG4gIC8vIEV4YW1wbGU6IFwiU3Rvcm1ibG9vZCAtIEVsZWN0cmljaXR5IGltbXVuZS5cIlxuICAvLyBFeGFtcGxlOiBcIlN0b3JtYmxvb2QgXHUyMDE0IEVsZWN0cmljaXR5IGltbXVuZS5cIlxuICBtYXRjaCA9IHRyaW1tZWQubWF0Y2goL14oLnsxLDgwfT9cXHNbLVx1MjAxNF0pXFxzKiguKykkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbDogbWF0Y2hbMV0udHJpbSgpLFxuICAgICAgYm9keTogbWF0Y2hbMl0udHJpbSgpXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7IGxhYmVsOiBcIlwiLCBib2R5OiB0cmltbWVkIH07XG59XG5cbmZ1bmN0aW9uIGFkZFNlY3Rpb24oXG4gIHBhcmVudDogSFRNTEVsZW1lbnQsXG4gIHRpdGxlOiBzdHJpbmcsXG4gIGl0ZW1zOiBzdHJpbmdbXSxcbiAgY2xhc3NOYW1lOiBzdHJpbmcsXG4gIHNldHRpbmdzOiBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdzLFxuICBvcHRpb25zOiBNb25zdGVyUmVuZGVyT3B0aW9uc1xuKTogdm9pZCB7XG4gIGlmIChpdGVtcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBjb25zdCBzZWN0aW9uID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uXCIpO1xuICBzZWN0aW9uLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvbi10aXRsZVwiLCB0aXRsZSkpO1xuXG4gIGNvbnN0IGxpc3QgPSBjcmVhdGVMaXN0KGNsYXNzTmFtZSk7XG5cbiAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgY29uc3QgbGkgPSBjcmVhdGVMaXN0SXRlbSgpO1xuXG4gICAgY29uc3QgeyBsYWJlbCwgYm9keSB9ID0gc3BsaXRMYWJlbEFuZEJvZHkoaXRlbSk7XG5cbiAgICBpZiAobGFiZWwpIHtcbiAgICAgIGxpLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLWFiaWxpdHktbGFiZWxcIiwgbGFiZWwpKTtcbiAgICB9XG5cbiAgICBpZiAoYm9keSkge1xuICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgIGxpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiIFwiKSk7XG4gICAgICB9XG4gICAgICBjb25zdCBib2R5RWwgPSBjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci1hYmlsaXR5LXRleHRcIik7XG5cbiAgICAgIGlmIChzZXR0aW5ncy5lbmFibGVEaWNlUm9sbGVySW50ZWdyYXRpb24gJiYgb3B0aW9ucy5vblJvbGxEaWNlKSB7XG5cbiAgICAgICAgYXBwZW5kVGV4dFdpdGhEYW1hZ2VEaWNlQnV0dG9ucyhib2R5RWwsIGJvZHksIG9wdGlvbnMub25Sb2xsRGljZSk7XG5cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgYm9keUVsLnRleHRDb250ZW50ID0gYm9keTtcblxuICAgICAgfVxuXG4gICAgICBsaS5hcHBlbmRDaGlsZChib2R5RWwpO1xuICAgIH1cblxuICAgIGlmICghbGFiZWwpIHtcbiAgICAgIGlmIChzZXR0aW5ncy5lbmFibGVEaWNlUm9sbGVySW50ZWdyYXRpb24gJiYgb3B0aW9ucy5vblJvbGxEaWNlKSB7XG4gICAgICAgIGFwcGVuZFRleHRXaXRoRGFtYWdlRGljZUJ1dHRvbnMobGksIGl0ZW0sIG9wdGlvbnMub25Sb2xsRGljZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaS50ZXh0Q29udGVudCA9IGl0ZW07XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGlzdC5hcHBlbmRDaGlsZChsaSk7XG4gIH1cblxuICBzZWN0aW9uLmFwcGVuZENoaWxkKGxpc3QpO1xuICBwYXJlbnQuYXBwZW5kQ2hpbGQoc2VjdGlvbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJNb25zdGVyQmxvY2soXG4gIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gIG1vbnN0ZXI6IFNoYWRvd2RhcmtNb25zdGVyLFxuICBzZXR0aW5nczogU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyxcbiAgd2FybmluZ3M6IHN0cmluZ1tdID0gW10sXG4gIG9wdGlvbnM6IE1vbnN0ZXJSZW5kZXJPcHRpb25zID0ge31cbik6IHZvaWQge1xuICBjb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjtcblxuICBjb25zdCBjYXJkID0gY3JlYXRlRGl2KFxuICAgIFtcbiAgICAgIFwic2QtbW9uc3Rlci1jYXJkXCIsXG4gICAgICBzZXR0aW5ncy5jb21wYWN0TW9kZSA/IFwiaXMtY29tcGFjdFwiIDogXCJcIlxuICAgIF1cbiAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgIC5qb2luKFwiIFwiKVxuICApO1xuXG4gIGNvbnN0IGhlYWRlciA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItaGVhZGVyXCIpO1xuICBoZWFkZXIuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1uYW1lXCIsIG1vbnN0ZXIubmFtZSkpO1xuXG4gIGNvbnN0IG1ldGEgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLW1ldGFcIik7XG4gIGNvbnN0IG1ldGFQYXJ0czogSFRNTEVsZW1lbnRbXSA9IFtdO1xuXG4gIGlmIChtb25zdGVyLmxldmVsKSB7XG4gICAgbWV0YVBhcnRzLnB1c2goY3JlYXRlU3Bhbih1bmRlZmluZWQsIGBMZXZlbCAke21vbnN0ZXIubGV2ZWx9YCkpO1xuICB9XG5cbiAgaWYgKG1vbnN0ZXIuYWxpZ25tZW50KSB7XG4gICAgY29uc3QgYWxpZ25tZW50U3BhbiA9IGNyZWF0ZVNwYW4odW5kZWZpbmVkLCBgQUwgJHttb25zdGVyLmFsaWdubWVudH1gKTtcbiAgICBjb25zdCB0b29sdGlwID0gZ2V0QWxpZ25tZW50TGFiZWwobW9uc3Rlci5hbGlnbm1lbnQpO1xuICAgIGlmICh0b29sdGlwKSB7XG4gICAgICBhbGlnbm1lbnRTcGFuLnRpdGxlID0gdG9vbHRpcDtcbiAgICB9XG4gICAgbWV0YVBhcnRzLnB1c2goYWxpZ25tZW50U3Bhbik7XG4gIH1cblxuICBtZXRhUGFydHMuZm9yRWFjaCgocGFydCwgaW5kZXgpID0+IHtcbiAgICBtZXRhLmFwcGVuZENoaWxkKHBhcnQpO1xuXG4gICAgaWYgKGluZGV4IDwgbWV0YVBhcnRzLmxlbmd0aCAtIDEpIHtcbiAgICAgIG1ldGEuYXBwZW5kQ2hpbGQoY3JlYXRlU3Bhbih1bmRlZmluZWQsIFwiIFx1MjAyMiBcIikpO1xuICAgIH1cbiAgfSk7XG5cbiAgaGVhZGVyLmFwcGVuZENoaWxkKG1ldGEpO1xuICBjYXJkLmFwcGVuZENoaWxkKGhlYWRlcik7XG5cbiAgY29uc3QgY29yZSA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItY29yZVwiKTtcbiAgY29yZS5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWNvcmUtaXRlbVwiLCBgQUMgJHttb25zdGVyLmFjfWApKTtcbiAgY29yZS5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWNvcmUtaXRlbVwiLCBgSFAgJHttb25zdGVyLmhwfWApKTtcblxuICBpZiAobW9uc3Rlci5tdikge1xuICAgIGNvcmUuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1jb3JlLWl0ZW1cIiwgYE1WICR7bW9uc3Rlci5tdn1gKSk7XG4gIH1cblxuICBjYXJkLmFwcGVuZENoaWxkKGNvcmUpO1xuXG4gIGlmIChtb25zdGVyLmF0ay5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgYXRrU2VjdGlvbiA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvblwiKTtcbiAgICBhdGtTZWN0aW9uLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvbi10aXRsZVwiLCBcIkFUVEFDS1NcIikpO1xuXG4gICAgY29uc3QgYXRrTGlzdCA9IGNyZWF0ZUxpc3QoXCJzZC1tb25zdGVyLWF0dGFja3NcIik7XG4gICAgZm9yIChjb25zdCBhdHRhY2sgb2YgbW9uc3Rlci5hdGspIHtcbiAgICAgIGNvbnN0IGxpID0gY3JlYXRlTGlzdEl0ZW0oXCJzZC1tb25zdGVyLWF0dGFja1wiKTtcbiAgICAgIGFwcGVuZFJlbmRlcmVkQXR0YWNrKGxpLCByZW5kZXJBdHRhY2tUZXh0KGF0dGFjayksIHNldHRpbmdzLCBvcHRpb25zKTtcbiAgICAgIGF0a0xpc3QuYXBwZW5kQ2hpbGQobGkpO1xuICAgIH1cblxuICAgIGF0a1NlY3Rpb24uYXBwZW5kQ2hpbGQoYXRrTGlzdCk7XG4gICAgY2FyZC5hcHBlbmRDaGlsZChhdGtTZWN0aW9uKTtcbiAgfVxuXG4gIGNvbnN0IGFiaWxpdGllcyA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvblwiKTtcbiAgYWJpbGl0aWVzLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvbi10aXRsZVwiLCBcIkFCSUxJVElFU1wiKSk7XG5cbiAgY29uc3QgZ3JpZCA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItYWJpbGl0aWVzXCIpO1xuICBncmlkLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItYWJpbGl0eVwiLCBgU1RSICR7bW9uc3Rlci5zdGF0cy5zdHJ9YCkpO1xuICBncmlkLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItYWJpbGl0eVwiLCBgREVYICR7bW9uc3Rlci5zdGF0cy5kZXh9YCkpO1xuICBncmlkLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItYWJpbGl0eVwiLCBgQ09OICR7bW9uc3Rlci5zdGF0cy5jb259YCkpO1xuICBncmlkLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItYWJpbGl0eVwiLCBgSU5UICR7bW9uc3Rlci5zdGF0cy5pbnR9YCkpO1xuICBncmlkLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItYWJpbGl0eVwiLCBgV0lTICR7bW9uc3Rlci5zdGF0cy53aXN9YCkpO1xuICBncmlkLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItYWJpbGl0eVwiLCBgQ0hBICR7bW9uc3Rlci5zdGF0cy5jaGF9YCkpO1xuXG4gIGFiaWxpdGllcy5hcHBlbmRDaGlsZChncmlkKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChhYmlsaXRpZXMpO1xuXG4gIGFkZFNlY3Rpb24oY2FyZCwgXCJUUkFJVFNcIiwgbW9uc3Rlci50cmFpdHMsIFwic2QtbW9uc3Rlci1saXN0XCIsIHNldHRpbmdzLCBvcHRpb25zKTtcbiAgYWRkU2VjdGlvbihjYXJkLCBcIlNQRUNJQUxTXCIsIG1vbnN0ZXIuc3BlY2lhbHMsIFwic2QtbW9uc3Rlci1saXN0XCIsIHNldHRpbmdzLCBvcHRpb25zKTtcbiAgYWRkU2VjdGlvbihjYXJkLCBcIlNQRUxMU1wiLCBtb25zdGVyLnNwZWxscywgXCJzZC1tb25zdGVyLWxpc3RcIiwgc2V0dGluZ3MsIG9wdGlvbnMpO1xuICBhZGRTZWN0aW9uKGNhcmQsIFwiR0VBUlwiLCBtb25zdGVyLmdlYXIsIFwic2QtbW9uc3Rlci1saXN0XCIsIHNldHRpbmdzLCBvcHRpb25zKTtcblxuICBpZiAobW9uc3Rlci5kZXNjcmlwdGlvbikge1xuICAgIGNvbnN0IGRlc2MgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb25cIik7XG4gICAgZGVzYy5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWRlc2NyaXB0aW9uXCIsIG1vbnN0ZXIuZGVzY3JpcHRpb24pKTtcbiAgICBjYXJkLmFwcGVuZENoaWxkKGRlc2MpO1xuICB9XG5cbiAgaWYgKHNldHRpbmdzLnNob3dTb3VyY2UgJiYgbW9uc3Rlci5zb3VyY2UpIHtcbiAgICBjb25zdCBzb3VyY2UgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWZvb3RlclwiKTtcbiAgICBzb3VyY2UuYXBwZW5kQ2hpbGQoY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItc291cmNlXCIsIGBTb3VyY2U6ICR7bW9uc3Rlci5zb3VyY2V9YCkpO1xuICAgIGNhcmQuYXBwZW5kQ2hpbGQoc291cmNlKTtcbiAgfVxuXG4gIGlmIChzZXR0aW5ncy5zaG93VGFncyAmJiBtb25zdGVyLnRhZ3MubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHRhZ3MgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXRhZ3NcIik7XG4gICAgZm9yIChjb25zdCB0YWcgb2YgbW9uc3Rlci50YWdzKSB7XG4gICAgICB0YWdzLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLXRhZ1wiLCB0YWcpKTtcbiAgICB9XG4gICAgY2FyZC5hcHBlbmRDaGlsZCh0YWdzKTtcbiAgfVxuXG4gIGlmICh3YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3Qgd2FybmluZ0JveCA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItd2FybmluZy1ib3hcIik7XG4gICAgZm9yIChjb25zdCB3YXJuaW5nIG9mIHdhcm5pbmdzKSB7XG4gICAgICB3YXJuaW5nQm94LmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItd2FybmluZ1wiLCB3YXJuaW5nKSk7XG4gICAgfVxuICAgIGNhcmQuYXBwZW5kQ2hpbGQod2FybmluZ0JveCk7XG4gIH1cblxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FyZCk7XG59IiwgImV4cG9ydCBpbnRlcmZhY2UgU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyB7XG4gIGNvbXBhY3RNb2RlOiBib29sZWFuO1xuICBzaG93U291cmNlOiBib29sZWFuO1xuICBzaG93VGFnczogYm9vbGVhbjtcbiAgZW5hYmxlRGljZVJvbGxlckludGVncmF0aW9uOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TVEFUQkxPQ0tfUkVOREVSX1NFVFRJTkdTOiBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdzID0ge1xuICBjb21wYWN0TW9kZTogdHJ1ZSxcbiAgc2hvd1NvdXJjZTogdHJ1ZSxcbiAgc2hvd1RhZ3M6IHRydWUsXG4gIGVuYWJsZURpY2VSb2xsZXJJbnRlZ3JhdGlvbjogZmFsc2Vcbn07IiwgImltcG9ydCB7IEVuY291bnRlckluaXRpYXRpdmVNb2RlIH0gZnJvbSBcIi4vdHlwZXMvZW5jb3VudGVyc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNoYWRvd2RhcmtFbmNvdW50ZXJzU2V0dGluZ3Mge1xuICBlbmNvdW50ZXJGb2xkZXI6IHN0cmluZztcbiAgZGVmYXVsdFBhcnR5TGV2ZWw6IG51bWJlcjtcbiAgZGVmYXVsdFBhcnR5U2l6ZTogbnVtYmVyO1xuICBkZWZhdWx0SW5pdGlhdGl2ZU1vZGU6IEVuY291bnRlckluaXRpYXRpdmVNb2RlO1xuICBzaG93RGlmZmljdWx0eTogYm9vbGVhbjtcbiAgc2hvd0luaXRpYXRpdmU6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBTaGFkb3dkYXJrRW5jb3VudGVyc1NldHRpbmdzID0ge1xuICBlbmNvdW50ZXJGb2xkZXI6IFwiRW5jb3VudGVyc1wiLFxuICBkZWZhdWx0UGFydHlMZXZlbDogMSxcbiAgZGVmYXVsdFBhcnR5U2l6ZTogNCxcbiAgZGVmYXVsdEluaXRpYXRpdmVNb2RlOiBcInNoYWRvd2RhcmtfcmF3XCIsXG4gIHNob3dEaWZmaWN1bHR5OiB0cnVlLFxuICBzaG93SW5pdGlhdGl2ZTogdHJ1ZVxufTsiLCAiaW1wb3J0IHtcbiAgQXBwLFxuICBQbHVnaW5TZXR0aW5nVGFiLFxuICBTZXR0aW5nXG59IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW4gZnJvbSBcIi4uL21haW5cIjtcblxuZXhwb3J0IGNsYXNzIFNoYWRvd2RhcmtFbmNvdW50ZXJzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHBsdWdpbjogU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW5cbiAgKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuXG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwge1xuICAgICAgdGV4dDogXCJTaGFkb3dkYXJrIEVuY291bnRlcnMgU2V0dGluZ3NcIlxuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkVuY291bnRlciBGb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIHdoZXJlIGVuY291bnRlciBub3RlcyBhcmUgY3JlYXRlZC5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiRW5jb3VudGVyc1wiKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmNvdW50ZXJGb2xkZXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5jb3VudGVyRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IFBhcnR5IExldmVsXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZShcbiAgICAgICAgICAgIFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0UGFydHlMZXZlbClcbiAgICAgICAgICApXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFBhcnR5TGV2ZWwgPVxuICAgICAgICAgICAgICBOdW1iZXIodmFsdWUpIHx8IDE7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgUGFydHkgU2l6ZVwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICBTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFBhcnR5U2l6ZSlcbiAgICAgICAgICApXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFBhcnR5U2l6ZSA9XG4gICAgICAgICAgICAgIE51bWJlcih2YWx1ZSkgfHwgNDtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkRlZmF1bHQgSW5pdGlhdGl2ZSBNb2RlXCIpXG4gICAgICAgIC5zZXREZXNjKFwiQ2hvb3NlIGhvdyBuZXcgZW5jb3VudGVycyBnZW5lcmF0ZSBpbml0aWF0aXZlLlwiKVxuICAgICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PlxuICAgICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgICAuYWRkT3B0aW9uKFwic2hhZG93ZGFya19yYXdcIiwgXCJTaGFkb3dkYXJrIFJBV1wiKVxuICAgICAgICAgICAgLmFkZE9wdGlvbihcImluZGl2aWR1YWxfbW9uc3RlcnNcIiwgXCJJbmRpdmlkdWFsIE1vbnN0ZXJzXCIpXG4gICAgICAgICAgICAuYWRkT3B0aW9uKFwibm9uZVwiLCBcIk5vbmVcIilcbiAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0SW5pdGlhdGl2ZU1vZGUpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRJbml0aWF0aXZlTW9kZSA9XG4gICAgICAgICAgICAgICAgdmFsdWUgYXMgYW55O1xuXG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiU2hvdyBEaWZmaWN1bHR5IFJhdGluZ1wiKVxuICAgICAgICAuc2V0RGVzYyhcIkRpc3BsYXkgZW5jb3VudGVyIGRpZmZpY3VsdHkgaW4gdGhlIHJlbmRlcmVkIGVuY291bnRlciBjYXJkLlwiKVxuICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd0RpZmZpY3VsdHkpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dEaWZmaWN1bHR5ID0gdmFsdWU7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiU2hvdyBJbml0aWF0aXZlIFRyYWNrZXJcIilcbiAgICAgICAgLnNldERlc2MoXCJEaXNwbGF5IGluaXRpYXRpdmUgaW4gdGhlIHJlbmRlcmVkIGVuY291bnRlciBjYXJkLlwiKVxuICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd0luaXRpYXRpdmUpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dJbml0aWF0aXZlID0gdmFsdWU7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG59IiwgImltcG9ydCB7IEFwcCwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgRW5jb3VudGVyU3VtbWFyeSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmV4cG9ydCBjbGFzcyBFbmNvdW50ZXJJbmRleCB7XG4gIGFwcDogQXBwO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gIH1cblxuICBnZXRBbGxFbmNvdW50ZXJzKCk6IEVuY291bnRlclN1bW1hcnlbXSB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0XG4gICAgICAuZ2V0TWFya2Rvd25GaWxlcygpXG4gICAgICAubWFwKChmaWxlKSA9PiB0aGlzLmdldEVuY291bnRlckZyb21GaWxlKGZpbGUpKVxuICAgICAgLmZpbHRlcigoZW5jb3VudGVyKTogZW5jb3VudGVyIGlzIEVuY291bnRlclN1bW1hcnkgPT4gZW5jb3VudGVyICE9PSBudWxsKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSkpO1xuICB9XG5cbiAgZ2V0RW5jb3VudGVyRnJvbUZpbGUoZmlsZTogVEZpbGUpOiBFbmNvdW50ZXJTdW1tYXJ5IHwgbnVsbCB7XG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlcjtcblxuICAgIGlmIChmcm9udG1hdHRlcj8uc2hhZG93ZGFya1R5cGUgIT09IFwiZW5jb3VudGVyXCIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG1vbnN0ZXJzID0gQXJyYXkuaXNBcnJheShmcm9udG1hdHRlci5tb25zdGVycylcbiAgICAgID8gZnJvbnRtYXR0ZXIubW9uc3RlcnNcbiAgICAgIDogW107XG5cbiAgICBjb25zdCBtb25zdGVyQ291bnQgPSBtb25zdGVycy5yZWR1Y2UoXG4gICAgICAoc3VtOiBudW1iZXIsIG1vbnN0ZXI6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PlxuICAgICAgICBzdW0gKyBOdW1iZXIobW9uc3Rlci5xdHkgPz8gMSksXG4gICAgICAwXG4gICAgKTtcblxuICAgIGxldCB0b3RhbExldmVscyA9IDA7XG4gICAgbGV0IGNvdW50ZWRNb25zdGVycyA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgbW9uc3RlcnMpIHtcbiAgICAgIGNvbnN0IGxldmVsID0gTnVtYmVyKG1vbnN0ZXIubGV2ZWwpO1xuICAgICAgY29uc3QgcXR5ID0gTnVtYmVyKG1vbnN0ZXIucXR5ID8/IDEpO1xuXG4gICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGxldmVsKSkge1xuICAgICAgICB0b3RhbExldmVscyArPSBsZXZlbCAqIHF0eTtcbiAgICAgICAgY291bnRlZE1vbnN0ZXJzICs9IHF0eTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogU3RyaW5nKGZyb250bWF0dGVyLm5hbWUgPz8gZmlsZS5iYXNlbmFtZSksXG4gICAgICBwYXRoOiBmaWxlLnBhdGgsXG4gICAgICBzdGF0dXM6IFN0cmluZyhmcm9udG1hdHRlci5zdGF0dXMgPz8gXCJwbGFubmVkXCIpLFxuICAgICAgcGFydHlMZXZlbDogTnVtYmVyKGZyb250bWF0dGVyLnBhcnR5TGV2ZWwgPz8gMSksXG4gICAgICBwYXJ0eVNpemU6IE51bWJlcihmcm9udG1hdHRlci5wYXJ0eVNpemUgPz8gNCksXG4gICAgICBtb25zdGVyQ291bnQsXG4gICAgICB1bmlxdWVNb25zdGVyQ291bnQ6IG1vbnN0ZXJzLmxlbmd0aCxcbiAgICAgIGF2ZXJhZ2VNb25zdGVyTGV2ZWw6XG4gICAgICAgIGNvdW50ZWRNb25zdGVycyA+IDAgPyB0b3RhbExldmVscyAvIGNvdW50ZWRNb25zdGVycyA6IDBcbiAgICB9O1xuICB9XG5cbiAgc2VhcmNoRW5jb3VudGVycyhxdWVyeTogc3RyaW5nKTogRW5jb3VudGVyU3VtbWFyeVtdIHtcbiAgICBjb25zdCBsb3dlciA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gICAgaWYgKCFsb3dlcikge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0QWxsRW5jb3VudGVycygpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdldEFsbEVuY291bnRlcnMoKS5maWx0ZXIoKGVuY291bnRlcikgPT5cbiAgICAgIGVuY291bnRlci5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMobG93ZXIpXG4gICAgKTtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIE1lbnUsIE1vZGFsLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCBTaGFkb3dkYXJrRW5jb3VudGVyc1BsdWdpbiBmcm9tIFwiLi4vbWFpblwiO1xuaW1wb3J0IHsgRW5jb3VudGVySW5kZXggfSBmcm9tIFwiLi4vc2VydmljZXMvRW5jb3VudGVySW5kZXhcIjtcbmltcG9ydCB7IEVuY291bnRlclN1bW1hcnkgfSBmcm9tIFwiLi4vdHlwZXMvZW5jb3VudGVyc1wiO1xuaW1wb3J0IHsgQ3JlYXRlRW5jb3VudGVyTW9kYWwgfSBmcm9tIFwiLi9DcmVhdGVFbmNvdW50ZXJNb2RhbFwiO1xuXG5leHBvcnQgY2xhc3MgRW5jb3VudGVyQnJvd3Nlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwbHVnaW46IFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luO1xuICBlbmNvdW50ZXJJbmRleDogRW5jb3VudGVySW5kZXg7XG5cbiAgc2VhcmNoVGV4dCA9IFwiXCI7XG4gIHN0YXR1c0ZpbHRlciA9IFwiXCI7XG4gIHBhcnR5TGV2ZWxGaWx0ZXIgPSBcIlwiO1xuICBzb3J0TW9kZSA9IFwibmFtZS1hc2NcIjtcblxuICByZXN1bHRzRWwhOiBIVE1MRGl2RWxlbWVudDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwbHVnaW46IFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luLFxuICAgIGVuY291bnRlckluZGV4OiBFbmNvdW50ZXJJbmRleFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuXG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgdGhpcy5lbmNvdW50ZXJJbmRleCA9IGVuY291bnRlckluZGV4O1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMubW9kYWxFbC5hZGRDbGFzcyhcInNkLWVuY291bnRlci1icm93c2VyLW1vZGFsXCIpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICByZW5kZXIoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG5cbiAgICBjb250ZW50RWwuZW1wdHkoKTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHtcbiAgICAgIHRleHQ6IFwiU2hhZG93ZGFyayBFbmNvdW50ZXJzXCJcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyRmlsdGVycyhjb250ZW50RWwpO1xuXG4gICAgdGhpcy5yZXN1bHRzRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItYnJvd3Nlci1yZXN1bHRzXCJcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyUmVzdWx0cygpO1xuICB9XG5cbiAgcmVuZGVyRmlsdGVycyhjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBmaWx0ZXJSb3cgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1icm93c2VyLWZpbHRlci1yb3dcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VhcmNoRmllbGQgPSBmaWx0ZXJSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZmlsdGVyLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIHNlYXJjaEZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJTZWFyY2hcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VhcmNoSW5wdXQgPSBzZWFyY2hGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiU2VhcmNoIGVuY291bnRlcnMuLi5cIlxuICAgIH0pO1xuXG4gICAgc2VhcmNoSW5wdXQudmFsdWUgPSB0aGlzLnNlYXJjaFRleHQ7XG5cbiAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5zZWFyY2hUZXh0ID0gc2VhcmNoSW5wdXQudmFsdWU7XG4gICAgICB0aGlzLnJlbmRlclJlc3VsdHMoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXR1c0ZpZWxkID0gZmlsdGVyUm93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBzdGF0dXNGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiU3RhdHVzXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXR1c1NlbGVjdCA9IHN0YXR1c0ZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuXG4gICAgc3RhdHVzU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiQW55XCIsXG4gICAgICB2YWx1ZTogXCJcIlxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBzdGF0dXMgb2YgW1wicGxhbm5lZFwiLCBcInJ1bm5pbmdcIiwgXCJjb21wbGV0ZWRcIiwgXCJhcmNoaXZlZFwiXSkge1xuICAgICAgc3RhdHVzU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgICAgdGV4dDogc3RhdHVzLFxuICAgICAgICB2YWx1ZTogc3RhdHVzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0dXNTZWxlY3QudmFsdWUgPSB0aGlzLnN0YXR1c0ZpbHRlcjtcblxuICAgIHN0YXR1c1NlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHRoaXMuc3RhdHVzRmlsdGVyID0gc3RhdHVzU2VsZWN0LnZhbHVlO1xuICAgICAgdGhpcy5yZW5kZXJSZXN1bHRzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBsZXZlbEZpZWxkID0gZmlsdGVyUm93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBsZXZlbEZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJQYXJ0eSBMZXZlbFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBsZXZlbFNlbGVjdCA9IGxldmVsRmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG5cbiAgICBsZXZlbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIkFueVwiLFxuICAgICAgdmFsdWU6IFwiXCJcbiAgICB9KTtcblxuICAgIGZvciAobGV0IGxldmVsID0gMTsgbGV2ZWwgPD0gMTA7IGxldmVsKyspIHtcbiAgICAgIGxldmVsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgICAgdGV4dDogU3RyaW5nKGxldmVsKSxcbiAgICAgICAgdmFsdWU6IFN0cmluZyhsZXZlbClcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGxldmVsU2VsZWN0LnZhbHVlID0gdGhpcy5wYXJ0eUxldmVsRmlsdGVyO1xuXG4gICAgbGV2ZWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnBhcnR5TGV2ZWxGaWx0ZXIgPSBsZXZlbFNlbGVjdC52YWx1ZTtcbiAgICAgIHRoaXMucmVuZGVyUmVzdWx0cygpO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgc29ydEZpZWxkID0gZmlsdGVyUm93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBzb3J0RmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIlNvcnRcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc29ydFNlbGVjdCA9IHNvcnRGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiKTtcblxuICAgIHNvcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJOYW1lIEEtWlwiLFxuICAgICAgdmFsdWU6IFwibmFtZS1hc2NcIlxuICAgIH0pO1xuXG4gICAgc29ydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIk5hbWUgWi1BXCIsXG4gICAgICB2YWx1ZTogXCJuYW1lLWRlc2NcIlxuICAgIH0pO1xuXG4gICAgc29ydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIlBhcnR5IExldmVsIExvdy1IaWdoXCIsXG4gICAgICB2YWx1ZTogXCJsZXZlbC1hc2NcIlxuICAgIH0pO1xuXG4gICAgc29ydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIlBhcnR5IExldmVsIEhpZ2gtTG93XCIsXG4gICAgICB2YWx1ZTogXCJsZXZlbC1kZXNjXCJcbiAgICB9KTtcblxuICAgIHNvcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJTdGF0dXNcIixcbiAgICAgIHZhbHVlOiBcInN0YXR1c1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LnZhbHVlID0gdGhpcy5zb3J0TW9kZTtcblxuICAgIHNvcnRTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnNvcnRNb2RlID0gc29ydFNlbGVjdC52YWx1ZTtcbiAgICAgIHRoaXMucmVuZGVyUmVzdWx0cygpO1xuICAgIH0pO1xuICB9XG5cbiAgICBzb3J0RW5jb3VudGVycyhcbiAgICAgICAgZW5jb3VudGVyczogRW5jb3VudGVyU3VtbWFyeVtdXG4gICAgKTogRW5jb3VudGVyU3VtbWFyeVtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi5lbmNvdW50ZXJzXS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICBzd2l0Y2ggKHRoaXMuc29ydE1vZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwibmFtZS1kZXNjXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiLm5hbWUubG9jYWxlQ29tcGFyZShhLm5hbWUpO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBcImxldmVsLWFzY1wiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgTnVtYmVyKGEucGFydHlMZXZlbCA/PyA5OTkpIC1cbiAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlcihiLnBhcnR5TGV2ZWwgPz8gOTk5KSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBcImxldmVsLWRlc2NcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlcihiLnBhcnR5TGV2ZWwgPz8gLTEpIC1cbiAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlcihhLnBhcnR5TGV2ZWwgPz8gLTEpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpXG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBjYXNlIFwic3RhdHVzXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBTdHJpbmcoYS5zdGF0dXMgPz8gXCJcIikubG9jYWxlQ29tcGFyZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdHJpbmcoYi5zdGF0dXMgPz8gXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICkgfHwgYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBcIm5hbWUtYXNjXCI6XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0gIFxuXG4gIHJlbmRlclJlc3VsdHMoKTogdm9pZCB7XG4gICAgdGhpcy5yZXN1bHRzRWwuZW1wdHkoKTtcblxuICAgIGxldCBlbmNvdW50ZXJzID1cbiAgICAgIHRoaXMuZW5jb3VudGVySW5kZXguc2VhcmNoRW5jb3VudGVycyh0aGlzLnNlYXJjaFRleHQpO1xuXG4gICAgaWYgKHRoaXMuc3RhdHVzRmlsdGVyKSB7XG4gICAgICBlbmNvdW50ZXJzID0gZW5jb3VudGVycy5maWx0ZXIoXG4gICAgICAgIChlbmNvdW50ZXIpID0+IGVuY291bnRlci5zdGF0dXMgPT09IHRoaXMuc3RhdHVzRmlsdGVyXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBhcnR5TGV2ZWxGaWx0ZXIpIHtcbiAgICAgIGVuY291bnRlcnMgPSBlbmNvdW50ZXJzLmZpbHRlcihcbiAgICAgICAgKGVuY291bnRlcikgPT5cbiAgICAgICAgICBTdHJpbmcoZW5jb3VudGVyLnBhcnR5TGV2ZWwgPz8gXCJcIikgPT09IHRoaXMucGFydHlMZXZlbEZpbHRlclxuICAgICAgKTtcbiAgICB9XG5cbiAgICBlbmNvdW50ZXJzID0gdGhpcy5zb3J0RW5jb3VudGVycyhlbmNvdW50ZXJzKTtcblxuICAgIGNvbnN0IHN1bW1hcnlFbCA9IHRoaXMucmVzdWx0c0VsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWJyb3dzZXItc3VtbWFyeVwiXG4gICAgfSk7XG5cbiAgICBzdW1tYXJ5RWwuc2V0VGV4dChgJHtlbmNvdW50ZXJzLmxlbmd0aH0gZW5jb3VudGVyKHMpYCk7XG5cbiAgICBpZiAoZW5jb3VudGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmVzdWx0c0VsLmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItYnJvd3Nlci1lbXB0eVwiLFxuICAgICAgICB0ZXh0OiBcIk5vIGVuY291bnRlcnMgbWF0Y2ggdGhvc2UgZmlsdGVycy5cIlxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGVuY291bnRlciBvZiBlbmNvdW50ZXJzKSB7XG4gICAgICB0aGlzLnJlbmRlckVuY291bnRlclJvdyhlbmNvdW50ZXIpO1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlckVuY291bnRlclJvdyhlbmNvdW50ZXI6IEVuY291bnRlclN1bW1hcnkpOiB2b2lkIHtcbiAgICBjb25zdCByb3dFbCA9IHRoaXMucmVzdWx0c0VsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWJyb3dzZXItcm93XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGluZm9FbCA9IHJvd0VsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWJyb3dzZXItaW5mb1wiXG4gICAgfSk7XG5cbiAgICBpbmZvRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItYnJvd3Nlci1uYW1lXCIsXG4gICAgICB0ZXh0OiBlbmNvdW50ZXIubmFtZVxuICAgIH0pO1xuXG4gICAgaW5mb0VsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWJyb3dzZXItbWV0YVwiLFxuICAgICAgdGV4dDpcbiAgICAgICAgYFBMICR7ZW5jb3VudGVyLnBhcnR5TGV2ZWwgPz8gXCI/XCJ9YCArXG4gICAgICAgIGAgXHUyMDIyICR7ZW5jb3VudGVyLnBhcnR5U2l6ZSA/PyBcIj9cIn0gUENzYCArXG4gICAgICAgIGAgXHUyMDIyICR7ZW5jb3VudGVyLm1vbnN0ZXJDb3VudH0gTW9uc3RlcnNgICtcbiAgICAgICAgYCBcdTIwMjIgQXZnIEx2ICR7ZW5jb3VudGVyLmF2ZXJhZ2VNb25zdGVyTGV2ZWwudG9GaXhlZCgxKX1gXG4gICAgfSk7XG5cbiAgICBpZiAoZW5jb3VudGVyLnN0YXR1cykge1xuICAgICAgaW5mb0VsLmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogYHNkLWVuY291bnRlci1zdGF0dXMtYmFkZ2UgaXMtJHtlbmNvdW50ZXIuc3RhdHVzfWAsXG4gICAgICAgIHRleHQ6IGVuY291bnRlci5zdGF0dXMudG9VcHBlckNhc2UoKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aW9uc0VsID0gcm93RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItYnJvd3Nlci1hY3Rpb25zXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IG9wZW5CdXR0b24gPSBhY3Rpb25zRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgdGV4dDogXCJPcGVuXCJcbiAgICB9KTtcblxuICAgIG9wZW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMub3BlbkVuY291bnRlcihlbmNvdW50ZXIsIFwiY3VycmVudFwiKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGVkaXRCdXR0b24gPSBhY3Rpb25zRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgdGV4dDogXCJFZGl0XCJcbiAgICB9KTtcblxuICAgIGVkaXRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMuZWRpdEVuY291bnRlcihlbmNvdW50ZXIpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgZHVwbGljYXRlQnV0dG9uID0gYWN0aW9uc0VsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IFwiRHVwbGljYXRlXCJcbiAgICB9KTtcblxuICAgIGR1cGxpY2F0ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5kdXBsaWNhdGVFbmNvdW50ZXIoZW5jb3VudGVyKTtcbiAgICB9KTtcblxuICAgIHJvd0VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnNob3dDb250ZXh0TWVudShldmVudCwgZW5jb3VudGVyKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGdldEVuY291bnRlckZpbGUoXG4gICAgZW5jb3VudGVyOiBFbmNvdW50ZXJTdW1tYXJ5XG4gICk6IFByb21pc2U8VEZpbGUgfCBudWxsPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChlbmNvdW50ZXIucGF0aCk7XG5cbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICBuZXcgTm90aWNlKFwiRW5jb3VudGVyIGZpbGUgbm90IGZvdW5kLlwiKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgb3BlbkVuY291bnRlcihcbiAgICBlbmNvdW50ZXI6IEVuY291bnRlclN1bW1hcnksXG4gICAgbW9kZTogXCJjdXJyZW50XCIgfCBcIm5ldy10YWJcIiB8IFwicmlnaHRcIlxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5nZXRFbmNvdW50ZXJGaWxlKGVuY291bnRlcik7XG5cbiAgICBpZiAoIWZpbGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobW9kZSA9PT0gXCJyaWdodFwiKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2VcbiAgICAgICAgLmdldExlYWYoXCJzcGxpdFwiLCBcInZlcnRpY2FsXCIpXG4gICAgICAgIC5vcGVuRmlsZShmaWxlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobW9kZSA9PT0gXCJuZXctdGFiXCIpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZVxuICAgICAgICAuZ2V0TGVhZih0cnVlKVxuICAgICAgICAub3BlbkZpbGUoZmlsZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlXG4gICAgICAuZ2V0TGVhZihmYWxzZSlcbiAgICAgIC5vcGVuRmlsZShmaWxlKTtcblxuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxuXG4gIGFzeW5jIGVkaXRFbmNvdW50ZXIoXG4gICAgZW5jb3VudGVyOiBFbmNvdW50ZXJTdW1tYXJ5XG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmdldEVuY291bnRlckZpbGUoZW5jb3VudGVyKTtcblxuICAgIGlmICghZmlsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2xvc2UoKTtcblxuICAgIG5ldyBDcmVhdGVFbmNvdW50ZXJNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5wbHVnaW4sXG4gICAgICB0aGlzLnBsdWdpbi5tb25zdGVySW5kZXgsXG4gICAgICB0aGlzLnBsdWdpbi5lbmNvdW50ZXJTZXJ2aWNlLFxuICAgICAgZmlsZSxcbiAgICAgIFwiZWRpdFwiXG4gICAgKS5vcGVuKCk7XG4gIH1cblxuICBhc3luYyBkdXBsaWNhdGVFbmNvdW50ZXIoXG4gICAgZW5jb3VudGVyOiBFbmNvdW50ZXJTdW1tYXJ5XG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmdldEVuY291bnRlckZpbGUoZW5jb3VudGVyKTtcblxuICAgIGlmICghZmlsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2xvc2UoKTtcblxuICAgIG5ldyBDcmVhdGVFbmNvdW50ZXJNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5wbHVnaW4sXG4gICAgICB0aGlzLnBsdWdpbi5tb25zdGVySW5kZXgsXG4gICAgICB0aGlzLnBsdWdpbi5lbmNvdW50ZXJTZXJ2aWNlLFxuICAgICAgZmlsZSxcbiAgICAgIFwiZHVwbGljYXRlXCJcbiAgICApLm9wZW4oKTtcbiAgfVxuXG4gIHNob3dDb250ZXh0TWVudShcbiAgICBldmVudDogTW91c2VFdmVudCxcbiAgICBlbmNvdW50ZXI6IEVuY291bnRlclN1bW1hcnlcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgbWVudSA9IG5ldyBNZW51KCk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+XG4gICAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZShcIk9wZW5cIilcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMub3BlbkVuY291bnRlcihlbmNvdW50ZXIsIFwiY3VycmVudFwiKTtcbiAgICAgICAgfSlcbiAgICApO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PlxuICAgICAgaXRlbVxuICAgICAgICAuc2V0VGl0bGUoXCJPcGVuIGluIE5ldyBUYWJcIilcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMub3BlbkVuY291bnRlcihlbmNvdW50ZXIsIFwibmV3LXRhYlwiKTtcbiAgICAgICAgfSlcbiAgICApO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PlxuICAgICAgaXRlbVxuICAgICAgICAuc2V0VGl0bGUoXCJPcGVuIHRvIHRoZSBSaWdodFwiKVxuICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5vcGVuRW5jb3VudGVyKGVuY291bnRlciwgXCJyaWdodFwiKTtcbiAgICAgICAgfSlcbiAgICApO1xuXG4gICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT5cbiAgICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKFwiRWRpdFwiKVxuICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5lZGl0RW5jb3VudGVyKGVuY291bnRlcik7XG4gICAgICAgIH0pXG4gICAgKTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT5cbiAgICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKFwiRHVwbGljYXRlXCIpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmR1cGxpY2F0ZUVuY291bnRlcihlbmNvdW50ZXIpO1xuICAgICAgICB9KVxuICAgICk7XG5cbiAgICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZXZlbnQpO1xuICB9XG59Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQStCOzs7QUNJeEIsSUFBTSxlQUFlOzs7QUNBckIsSUFBTSxlQUFOLE1BQW1CO0FBQUEsRUFHeEIsWUFBWSxLQUFVO0FBQ3BCLFNBQUssTUFBTTtBQUFBLEVBQ2I7QUFBQSxFQUVBLGVBQWUsT0FBaUM7QUFDOUMsVUFBTSxRQUFRLE1BQU0sWUFBWSxFQUFFLEtBQUs7QUFFdkMsUUFBSSxDQUFDLE9BQU87QUFDUixhQUFPLEtBQUssZUFBZTtBQUFBLElBQy9CO0FBRUEsV0FBTyxLQUFLLGVBQWUsRUFBRTtBQUFBLE1BQU8sQ0FBQyxZQUNqQyxRQUFRLEtBQUssWUFBWSxFQUFFLFNBQVMsS0FBSztBQUFBLElBQzdDO0FBQUEsRUFDSjtBQUFBLEVBRUUsaUJBQW1DO0FBQ2pDLFVBQU0sUUFBUSxLQUFLLElBQUksTUFBTSxpQkFBaUI7QUFFOUMsVUFBTSxXQUE2QixDQUFDO0FBRXBDLGVBQVcsUUFBUSxPQUFPO0FBQ3hCLFlBQU0sVUFBVSxLQUFLLG1CQUFtQixJQUFJO0FBRTVDLFVBQUksU0FBUztBQUNYLGlCQUFTLEtBQUssT0FBTztBQUFBLE1BQ3ZCO0FBQUEsSUFDRjtBQUVBLFdBQU8sU0FBUztBQUFBLE1BQUssQ0FBQyxHQUFHLE1BQ3ZCLEVBQUUsS0FBSyxjQUFjLEVBQUUsSUFBSTtBQUFBLElBQzdCO0FBQUEsRUFDRjtBQUFBLEVBRUEsbUJBQW1CLE1BQW9DO0FBekN6RDtBQTBDSSxVQUFNLFFBQ0osS0FBSyxJQUFJLGNBQWMsYUFBYSxJQUFJO0FBRTFDLFVBQU0sY0FBYywrQkFBTztB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Q0wsS0FBSztBQUFBLFlBQ0w7QUFBQSxZQUNBO0FBQUEsVUFDRixFQUFFLEtBQUs7QUFBQSxRQUNUO0FBRUEsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGLENBQUM7QUFFRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLGVBQWUsQ0FBQyxhQUFhO0FBQzNCLGNBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxjQUFjO0FBRTlDLFlBQUksQ0FBQyxNQUFNO0FBQ1QsaUJBQU87QUFBQSxRQUNUO0FBRUEsY0FBTSxRQUFRLEtBQUssSUFBSSxjQUFjLGFBQWEsSUFBSTtBQUN0RCxjQUFNLGNBQWMsK0JBQU87QUFFM0IsYUFBSSwyQ0FBYSxvQkFBbUIsYUFBYTtBQUMvQyxpQkFBTztBQUFBLFFBQ1Q7QUFFQSxZQUFJLENBQUMsVUFBVTtBQUNiLGNBQUk7QUFBQSxZQUNGLEtBQUs7QUFBQSxZQUNMO0FBQUEsWUFDQSxLQUFLO0FBQUEsWUFDTCxLQUFLO0FBQUEsWUFDTDtBQUFBLFVBQ0YsRUFBRSxLQUFLO0FBQUEsUUFDVDtBQUVBLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBT0EsTUFBTSxlQUE4QjtBQUNsQyxTQUFLLFdBQVcsT0FBTztBQUFBLE1BQ3JCLENBQUM7QUFBQSxNQUNEO0FBQUEsTUFDQSxNQUFNLEtBQUssU0FBUztBQUFBLElBQ3RCO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSxlQUE4QjtBQUNsQyxVQUFNLEtBQUssU0FBUyxLQUFLLFFBQVE7QUFBQSxFQUNuQztBQUFBLEVBRUEsV0FBaUI7QUFDZixZQUFRLElBQUksaUNBQWlDO0FBQUEsRUFDL0M7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2IiLCAiX2MiLCAiaW1wb3J0X29ic2lkaWFuIiwgInNlY3Rpb24iLCAiX2EiLCAiX2IiLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
