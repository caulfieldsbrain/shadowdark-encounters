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
  var _a, _b, _c;
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
status: planned

partyLevel: ${(_a = encounter.partyLevel) != null ? _a : 1}
partySize: ${(_b = encounter.partySize) != null ? _b : 4}

terrain: ${yamlString(encounter.terrain)}
light: ${yamlString(encounter.light)}

monsters:
${monsterFrontmatter || "  []"}

initiativeMode: ${(_c = encounter.initiativeMode) != null ? _c : "individual_monsters"}
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
  constructor(app, monsterIndex, encounterService, fileToEdit, mode = fileToEdit ? "edit" : "create") {
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
    this.initiativeMode = "individual_monsters";
    this.setup = "";
    this.readAloud = "";
    this.tactics = "";
    this.treasure = "";
    this.notes = "";
    this.mode = "create";
    this.monsterIndex = monsterIndex;
    this.encounterService = encounterService;
    this.fileToEdit = fileToEdit;
    this.mode = mode;
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
        frontmatter.partySize ? `${frontmatter.partySize} PCs` : null,
        frontmatter.status ? `Status: ${frontmatter.status}` : null
      ].filter(Boolean).join(" \u2022 ")
    });
    this.renderDashboardStats(container, frontmatter);
    this.renderCompactMonsterRoster(container, frontmatter);
    this.renderInitiative(container, frontmatter);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL2NvbnN0YW50cy9wbHVnaW4udHMiLCAic3JjL3NlcnZpY2VzL01vbnN0ZXJJbmRleC50cyIsICJzcmMvc2VydmljZXMvRW5jb3VudGVyU2VydmljZS50cyIsICJzcmMvdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlLnRzIiwgInNyYy9tb2RhbHMvQ3JlYXRlRW5jb3VudGVyTW9kYWwudHMiLCAic3JjL2NvbXBvbmVudHMvTW9uc3RlclByZXZpZXdQb3BvdmVyLnRzIiwgInNyYy9yZW5kZXJlcnMvRW5jb3VudGVyUmVuZGVyZXIudHMiLCAic3JjL3N0YXRibG9ja3NDb21wYXQvbm9ybWFsaXplTW9uc3Rlci50cyIsICJzcmMvc3RhdGJsb2Nrc0NvbXBhdC9wYXJzZUZyb250TWF0dGVyLnRzIiwgInNyYy9zdGF0YmxvY2tzQ29tcGF0L3JlbmRlck1vbnN0ZXJCbG9jay50cyIsICJzcmMvc3RhdGJsb2Nrc0NvbXBhdC9zZXR0aW5ncy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgTm90aWNlLCBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgTW9uc3RlckluZGV4IH0gZnJvbSBcIi4vc2VydmljZXMvTW9uc3RlckluZGV4XCI7XG5pbXBvcnQgeyBFbmNvdW50ZXJTZXJ2aWNlIH0gZnJvbSBcIi4vc2VydmljZXMvRW5jb3VudGVyU2VydmljZVwiO1xuaW1wb3J0IHsgQ3JlYXRlRW5jb3VudGVyTW9kYWwgfSBmcm9tIFwiLi9tb2RhbHMvQ3JlYXRlRW5jb3VudGVyTW9kYWxcIjtcblxuaW1wb3J0IHsgRW5jb3VudGVyUmVuZGVyZXIgfSBmcm9tIFwiLi9yZW5kZXJlcnMvRW5jb3VudGVyUmVuZGVyZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXG4gIG1vbnN0ZXJJbmRleCE6IE1vbnN0ZXJJbmRleDtcblxuICBlbmNvdW50ZXJTZXJ2aWNlITogRW5jb3VudGVyU2VydmljZTtcblxuICBlbmNvdW50ZXJSZW5kZXJlciE6IEVuY291bnRlclJlbmRlcmVyO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgIGNvbnNvbGUubG9nKFwiTG9hZGluZyBTaGFkb3dkYXJrIEVuY291bnRlcnNcIik7XG5cbiAgICB0aGlzLm1vbnN0ZXJJbmRleCA9XG4gICAgICBuZXcgTW9uc3RlckluZGV4KHRoaXMuYXBwKTtcblxuICAgIHRoaXMuZW5jb3VudGVyU2VydmljZSA9XG4gICAgICBuZXcgRW5jb3VudGVyU2VydmljZSh0aGlzLmFwcCk7XG5cbiAgICB0aGlzLmVuY291bnRlclJlbmRlcmVyID0gbmV3IEVuY291bnRlclJlbmRlcmVyKHRoaXMpO1xuICAgIHRoaXMuZW5jb3VudGVyUmVuZGVyZXIucmVnaXN0ZXIoKTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJjcmVhdGUtc2hhZG93ZGFyay1lbmNvdW50ZXJcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlIFNoYWRvd2RhcmsgRW5jb3VudGVyXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICBuZXcgQ3JlYXRlRW5jb3VudGVyTW9kYWwoXG4gICAgICAgIHRoaXMuYXBwLFxuICAgICAgICB0aGlzLm1vbnN0ZXJJbmRleCxcbiAgICAgICAgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlXG4gICAgICApLm9wZW4oKTtcbiAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImR1cGxpY2F0ZS1zaGFkb3dkYXJrLWVuY291bnRlclwiLFxuICAgICAgbmFtZTogXCJEdXBsaWNhdGUgQ3VycmVudCBTaGFkb3dkYXJrIEVuY291bnRlclwiLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuXG4gICAgICAgIGlmICghZmlsZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgICAgIGNvbnN0IGZyb250bWF0dGVyID0gY2FjaGU/LmZyb250bWF0dGVyO1xuXG4gICAgICAgIGlmIChmcm9udG1hdHRlcj8uc2hhZG93ZGFya1R5cGUgIT09IFwiZW5jb3VudGVyXCIpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNoZWNraW5nKSB7XG4gICAgICAgICAgbmV3IENyZWF0ZUVuY291bnRlck1vZGFsKFxuICAgICAgICAgICAgdGhpcy5hcHAsXG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXJJbmRleCxcbiAgICAgICAgICAgIHRoaXMuZW5jb3VudGVyU2VydmljZSxcbiAgICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgICBcImR1cGxpY2F0ZVwiXG4gICAgICAgICAgKS5vcGVuKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJlZGl0LXNoYWRvd2RhcmstZW5jb3VudGVyXCIsXG4gICAgICBuYW1lOiBcIkVkaXQgQ3VycmVudCBTaGFkb3dkYXJrIEVuY291bnRlclwiLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuXG4gICAgICAgIGlmICghZmlsZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgICAgIGNvbnN0IGZyb250bWF0dGVyID0gY2FjaGU/LmZyb250bWF0dGVyO1xuXG4gICAgICAgIGlmIChmcm9udG1hdHRlcj8uc2hhZG93ZGFya1R5cGUgIT09IFwiZW5jb3VudGVyXCIpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNoZWNraW5nKSB7XG4gICAgICAgICAgbmV3IENyZWF0ZUVuY291bnRlck1vZGFsKFxuICAgICAgICAgICAgdGhpcy5hcHAsXG4gICAgICAgICAgICB0aGlzLm1vbnN0ZXJJbmRleCxcbiAgICAgICAgICAgIHRoaXMuZW5jb3VudGVyU2VydmljZSxcbiAgICAgICAgICAgIGZpbGVcbiAgICAgICAgICApLm9wZW4oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFwaSA9IHtcbiAgICBnZXRBbGxNb25zdGVyczogKCkgPT5cbiAgICAgICAgdGhpcy5tb25zdGVySW5kZXguZ2V0QWxsTW9uc3RlcnMoKVxuICAgIH07XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gICAgY29uc29sZS5sb2coXCJVbmxvYWRpbmcgU2hhZG93ZGFyayBFbmNvdW50ZXJzXCIpO1xuICB9XG59IiwgImV4cG9ydCBjb25zdCBQTFVHSU5fSUQgPSBcInNoYWRvd2RhcmstZW5jb3VudGVyc1wiO1xuXG5leHBvcnQgY29uc3QgRU5DT1VOVEVSX1RZUEUgPSBcImVuY291bnRlclwiO1xuXG5leHBvcnQgY29uc3QgTU9OU1RFUl9UWVBFID0gXCJtb25zdGVyXCI7IiwgImltcG9ydCB7IEFwcCwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IE1PTlNURVJfVFlQRSB9IGZyb20gXCIuLi9jb25zdGFudHMvcGx1Z2luXCI7XG5pbXBvcnQgeyBNb25zdGVyU3VtbWFyeSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmV4cG9ydCBjbGFzcyBNb25zdGVySW5kZXgge1xuICBhcHA6IEFwcDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICB9XG5cbiAgc2VhcmNoTW9uc3RlcnMocXVlcnk6IHN0cmluZyk6IE1vbnN0ZXJTdW1tYXJ5W10ge1xuICAgIGNvbnN0IGxvd2VyID0gcXVlcnkudG9Mb3dlckNhc2UoKS50cmltKCk7XG5cbiAgICBpZiAoIWxvd2VyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEFsbE1vbnN0ZXJzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0QWxsTW9uc3RlcnMoKS5maWx0ZXIoKG1vbnN0ZXIpID0+XG4gICAgICAgIG1vbnN0ZXIubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGxvd2VyKVxuICAgICk7XG59XG5cbiAgZ2V0QWxsTW9uc3RlcnMoKTogTW9uc3RlclN1bW1hcnlbXSB7XG4gICAgY29uc3QgZmlsZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG5cbiAgICBjb25zdCBtb25zdGVyczogTW9uc3RlclN1bW1hcnlbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBjb25zdCBtb25zdGVyID0gdGhpcy5nZXRNb25zdGVyRnJvbUZpbGUoZmlsZSk7XG5cbiAgICAgIGlmIChtb25zdGVyKSB7XG4gICAgICAgIG1vbnN0ZXJzLnB1c2gobW9uc3Rlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vbnN0ZXJzLnNvcnQoKGEsIGIpID0+XG4gICAgICBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpXG4gICAgKTtcbiAgfVxuXG4gIGdldE1vbnN0ZXJGcm9tRmlsZShmaWxlOiBURmlsZSk6IE1vbnN0ZXJTdW1tYXJ5IHwgbnVsbCB7XG4gICAgY29uc3QgY2FjaGUgPVxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG5cbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlcjtcblxuICAgIGlmICghZnJvbnRtYXR0ZXIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChmcm9udG1hdHRlci5zaGFkb3dkYXJrVHlwZSAhPT0gTU9OU1RFUl9UWVBFKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogZnJvbnRtYXR0ZXIubmFtZSB8fCBmaWxlLmJhc2VuYW1lLFxuICAgICAgcGF0aDogZmlsZS5wYXRoLFxuXG4gICAgICBsZXZlbDogZnJvbnRtYXR0ZXIubGV2ZWwsXG4gICAgICBhYzogZnJvbnRtYXR0ZXIuYWMsXG4gICAgICBocDogZnJvbnRtYXR0ZXIuaHAsXG4gICAgICBkZXg6IGZyb250bWF0dGVyLmRleCA/PyBmcm9udG1hdHRlci5zdGF0cz8uZGV4LFxuXG4gICAgICBhdGs6IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIuYXRrKVxuICAgICAgICA/IGZyb250bWF0dGVyLmF0a1swXVxuICAgICAgICA6IGZyb250bWF0dGVyLmF0ayxcblxuICAgICAgdHJhaXRzOiBBcnJheS5pc0FycmF5KGZyb250bWF0dGVyLnRyYWl0cylcbiAgICAgICAgPyBmcm9udG1hdHRlci50cmFpdHMuc2xpY2UoMCwgMilcbiAgICAgICAgOiBbXSxcblxuICAgICAgdGFnczogZnJvbnRtYXR0ZXIudGFncyB8fCBbXVxuICAgIH07XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBub3JtYWxpemVQYXRoLCBURmlsZSwgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBFbmNvdW50ZXJEYXRhIH0gZnJvbSBcIi4uL3R5cGVzL2VuY291bnRlcnNcIjtcbmltcG9ydCB7IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24gfSBmcm9tIFwiLi4vdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBFbmNvdW50ZXJTZXJ2aWNlIHtcbiAgYXBwOiBBcHA7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUVuY291bnRlck5vdGUoZW5jb3VudGVyOiBFbmNvdW50ZXJEYXRhKSB7XG4gICAgY29uc3QgY29udGVudCA9IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24oZW5jb3VudGVyKTtcblxuICAgIGNvbnN0IHNhZmVOYW1lID0gZW5jb3VudGVyLm5hbWVcbiAgICAgIC5yZXBsYWNlKC9bXFxcXC86Kj9cIjw+fF0vZywgXCJcIilcbiAgICAgIC50cmltKCk7XG5cbiAgICBjb25zdCBmb2xkZXJQYXRoID0gXCJFbmNvdW50ZXJzXCI7XG4gICAgY29uc3QgZmlsZVBhdGggPSBub3JtYWxpemVQYXRoKGAke2ZvbGRlclBhdGh9LyR7c2FmZU5hbWV9Lm1kYCk7XG5cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihmb2xkZXJQYXRoKTtcblxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUoZmlsZVBhdGgsIGNvbnRlbnQpO1xuXG4gICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUoZmlsZSk7XG5cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlcihwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcblxuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIocGF0aCk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVFbmNvdW50ZXJOb3RlKFxuICAgIGZpbGU6IFRGaWxlLFxuICAgIGVuY291bnRlcjogRW5jb3VudGVyRGF0YVxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjb250ZW50ID0gZ2VuZXJhdGVFbmNvdW50ZXJNYXJrZG93bihlbmNvdW50ZXIpO1xuXG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGNvbnRlbnQpO1xuICB9XG5cbn0iLCAiaW1wb3J0IHsgRW5jb3VudGVyRGF0YSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmZ1bmN0aW9uIHlhbWxTdHJpbmcodmFsdWU6IHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSA/PyBcIlwiKTtcbn1cblxuZnVuY3Rpb24gc2VjdGlvbih0aXRsZTogc3RyaW5nLCBjb250ZW50Pzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAjIyAke3RpdGxlfVxuXG4ke2NvbnRlbnQ/LnRyaW0oKSB8fCBcIlwifVxuYDtcbn1cblxuZnVuY3Rpb24gcm9sbEQyMCgpOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjApICsgMTtcbn1cblxuZnVuY3Rpb24gcGFyc2VNb2RpZmllcih2YWx1ZTogdW5rbm93bik6IG51bWJlciB7XG4gIGNvbnN0IHBhcnNlZCA9IE51bWJlcih2YWx1ZSk7XG4gIHJldHVybiBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSA/IHBhcnNlZCA6IDA7XG59XG5cbmZ1bmN0aW9uIGdldEhpZ2hlc3RNb25zdGVyRGV4KGVuY291bnRlcjogRW5jb3VudGVyRGF0YSk6IG51bWJlciB7XG4gIHJldHVybiBlbmNvdW50ZXIubW9uc3RlcnMucmVkdWNlKChoaWdoZXN0LCBtb25zdGVyKSA9PiB7XG4gICAgY29uc3QgZGV4ID0gcGFyc2VNb2RpZmllcihtb25zdGVyLmRleCk7XG5cbiAgICByZXR1cm4gTWF0aC5tYXgoaGlnaGVzdCwgZGV4KTtcbiAgfSwgMCk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhdGl2ZUVudHJpZXMoXG4gIGVuY291bnRlcjogRW5jb3VudGVyRGF0YVxuKTogeyBuYW1lOiBzdHJpbmc7IGluaXRpYXRpdmU6IG51bWJlciB9W10ge1xuICBjb25zdCBtb2RlID0gZW5jb3VudGVyLmluaXRpYXRpdmVNb2RlID8/IFwiaW5kaXZpZHVhbF9tb25zdGVyc1wiO1xuXG4gIGlmIChtb2RlID09PSBcIm5vbmVcIikge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGlmIChtb2RlID09PSBcInNoYWRvd2RhcmtfcmF3XCIpIHtcbiAgICBjb25zdCBoaWdoZXN0RGV4ID0gZ2V0SGlnaGVzdE1vbnN0ZXJEZXgoZW5jb3VudGVyKTtcblxuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwiR00gLyBNb25zdGVyc1wiLFxuICAgICAgICBpbml0aWF0aXZlOiByb2xsRDIwKCkgKyBoaWdoZXN0RGV4XG4gICAgICB9XG4gICAgXTtcbiAgfVxuXG4gIGNvbnN0IGVudHJpZXM6IHsgbmFtZTogc3RyaW5nOyBpbml0aWF0aXZlOiBudW1iZXIgfVtdID0gW107XG5cbiAgZm9yIChjb25zdCBtb25zdGVyIG9mIGVuY291bnRlci5tb25zdGVycykge1xuICAgIGNvbnN0IHF0eSA9IE1hdGgubWF4KDEsIE51bWJlcihtb25zdGVyLnF0eSA/PyAxKSk7XG4gICAgY29uc3QgZGV4TW9kID0gcGFyc2VNb2RpZmllcihtb25zdGVyLmRleCk7XG5cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBxdHk7IGkrKykge1xuICAgICAgZW50cmllcy5wdXNoKHtcbiAgICAgICAgbmFtZTogcXR5ID4gMSA/IGAke21vbnN0ZXIubmFtZX0gJHtpfWAgOiBtb25zdGVyLm5hbWUsXG4gICAgICAgIGluaXRpYXRpdmU6IHJvbGxEMjAoKSArIGRleE1vZFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGVudHJpZXMuc29ydCgoYSwgYikgPT4gYi5pbml0aWF0aXZlIC0gYS5pbml0aWF0aXZlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24oXG4gIGVuY291bnRlcjogRW5jb3VudGVyRGF0YVxuKTogc3RyaW5nIHtcbiAgY29uc3QgaW5pdGlhdGl2ZUVudHJpZXMgPSBnZW5lcmF0ZUluaXRpYXRpdmVFbnRyaWVzKGVuY291bnRlcik7XG5cbiAgY29uc3QgaW5pdGlhdGl2ZUZyb250bWF0dGVyID0gaW5pdGlhdGl2ZUVudHJpZXNcbiAgICAubWFwKChlbnRyeSkgPT4gYCAgLSBuYW1lOiAke3lhbWxTdHJpbmcoZW50cnkubmFtZSl9XG4gICAgaW5pdGlhdGl2ZTogJHtlbnRyeS5pbml0aWF0aXZlfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgY29uc3QgbW9uc3RlckZyb250bWF0dGVyID0gZW5jb3VudGVyLm1vbnN0ZXJzXG4gICAgLm1hcCgobW9uc3RlcikgPT4gYCAgLSBuYW1lOiAke3lhbWxTdHJpbmcobW9uc3Rlci5uYW1lKX1cbiAgICBxdHk6ICR7bW9uc3Rlci5xdHl9XG4gICAgcGF0aDogJHt5YW1sU3RyaW5nKG1vbnN0ZXIucGF0aCl9XG4gICAgbGV2ZWw6ICR7eWFtbFN0cmluZyhtb25zdGVyLmxldmVsKX1cbiAgICBhYzogJHt5YW1sU3RyaW5nKG1vbnN0ZXIuYWMpfVxuICAgIGhwOiAke3lhbWxTdHJpbmcobW9uc3Rlci5ocCl9XG4gICAgZGV4OiAke3lhbWxTdHJpbmcobW9uc3Rlci5kZXgpfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgcmV0dXJuIGAtLS1cbnNoYWRvd2RhcmtUeXBlOiBlbmNvdW50ZXJcbm5hbWU6ICR7eWFtbFN0cmluZyhlbmNvdW50ZXIubmFtZSl9XG5zdGF0dXM6IHBsYW5uZWRcblxucGFydHlMZXZlbDogJHtlbmNvdW50ZXIucGFydHlMZXZlbCA/PyAxfVxucGFydHlTaXplOiAke2VuY291bnRlci5wYXJ0eVNpemUgPz8gNH1cblxudGVycmFpbjogJHt5YW1sU3RyaW5nKGVuY291bnRlci50ZXJyYWluKX1cbmxpZ2h0OiAke3lhbWxTdHJpbmcoZW5jb3VudGVyLmxpZ2h0KX1cblxubW9uc3RlcnM6XG4ke21vbnN0ZXJGcm9udG1hdHRlciB8fCBcIiAgW11cIn1cblxuaW5pdGlhdGl2ZU1vZGU6ICR7ZW5jb3VudGVyLmluaXRpYXRpdmVNb2RlID8/IFwiaW5kaXZpZHVhbF9tb25zdGVyc1wifVxuaW5pdGlhdGl2ZTpcbiR7aW5pdGlhdGl2ZUZyb250bWF0dGVyIHx8IFwiICBbXVwifVxuXG50YWdzOlxuICAtIHNoYWRvd2RhcmsvZW5jb3VudGVyXG4tLS1cblxuJHtzZWN0aW9uKFwiU2V0dXBcIiwgZW5jb3VudGVyLnNldHVwKX1cbiR7c2VjdGlvbihcIlJlYWQtQWxvdWRcIiwgZW5jb3VudGVyLnJlYWRBbG91ZCl9XG4ke3NlY3Rpb24oXCJUYWN0aWNzXCIsIGVuY291bnRlci50YWN0aWNzKX1cbiR7c2VjdGlvbihcIlRyZWFzdXJlXCIsIGVuY291bnRlci50cmVhc3VyZSl9XG4ke3NlY3Rpb24oXCJOb3Rlc1wiLCBlbmNvdW50ZXIubm90ZXMpfVxuYDtcbn0iLCAiaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcsIE1vZGFsLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IHNob3dNb25zdGVyUHJldmlldyB9IGZyb20gXCIuLi9jb21wb25lbnRzL01vbnN0ZXJQcmV2aWV3UG9wb3ZlclwiO1xuaW1wb3J0IHsgRW5jb3VudGVyU2VydmljZSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9FbmNvdW50ZXJTZXJ2aWNlXCI7XG5pbXBvcnQgeyBNb25zdGVySW5kZXggfSBmcm9tIFwiLi4vc2VydmljZXMvTW9uc3RlckluZGV4XCI7XG5pbXBvcnQgeyBnZW5lcmF0ZUVuY291bnRlck1hcmtkb3duIH0gZnJvbSBcIi4uL3RlbXBsYXRlcy9lbmNvdW50ZXJUZW1wbGF0ZVwiO1xuaW1wb3J0IHtcbiAgRW5jb3VudGVyRGF0YSxcbiAgRW5jb3VudGVySW5pdGlhdGl2ZU1vZGUsXG4gIE1vbnN0ZXJSZWZlcmVuY2UsXG4gIE1vbnN0ZXJTdW1tYXJ5XG59IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbnR5cGUgRW5jb3VudGVyV2l6YXJkU3RlcCA9IFwibW9uc3RlcnNcIiB8IFwiZGV0YWlsc1wiIHwgXCJwcmV2aWV3XCI7XG50eXBlIEVuY291bnRlck1vZGFsTW9kZSA9IFwiY3JlYXRlXCIgfCBcImVkaXRcIiB8IFwiZHVwbGljYXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBDcmVhdGVFbmNvdW50ZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgbW9uc3RlckluZGV4OiBNb25zdGVySW5kZXg7XG4gIGVuY291bnRlclNlcnZpY2U6IEVuY291bnRlclNlcnZpY2U7XG5cbiAgY3VycmVudFN0ZXA6IEVuY291bnRlcldpemFyZFN0ZXAgPSBcIm1vbnN0ZXJzXCI7XG5cbiAgZW5jb3VudGVyTmFtZSA9IFwiXCI7XG4gIHNlbGVjdGVkTW9uc3RlcnM6IE1vbnN0ZXJSZWZlcmVuY2VbXSA9IFtdO1xuXG4gIG1vbnN0ZXJTZWFyY2ggPSBcIlwiO1xuICBsZXZlbEZpbHRlciA9IFwiXCI7XG4gIHRhZ0ZpbHRlciA9IFwiXCI7XG4gIHNvcnRNb2RlID0gXCJuYW1lLWFzY1wiO1xuXG4gIHBhcnR5TGV2ZWwgPSAxO1xuICBwYXJ0eVNpemUgPSA0O1xuXG4gIGluaXRpYXRpdmVNb2RlOiBFbmNvdW50ZXJJbml0aWF0aXZlTW9kZSA9IFwiaW5kaXZpZHVhbF9tb25zdGVyc1wiO1xuXG4gIHNldHVwID0gXCJcIjtcbiAgcmVhZEFsb3VkID0gXCJcIjtcbiAgdGFjdGljcyA9IFwiXCI7XG4gIHRyZWFzdXJlID0gXCJcIjtcbiAgbm90ZXMgPSBcIlwiO1xuXG4gIHByaXZhdGUgZmlsZVRvRWRpdD86IFRGaWxlO1xuICBwcml2YXRlIG1vZGU6IEVuY291bnRlck1vZGFsTW9kZSA9IFwiY3JlYXRlXCI7XG5cbiAgcHJpdmF0ZSBnZXQgaXNFZGl0aW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm1vZGUgPT09IFwiZWRpdFwiO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXQgaXNEdXBsaWNhdGluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5tb2RlID09PSBcImR1cGxpY2F0ZVwiO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgbW9uc3RlckluZGV4OiBNb25zdGVySW5kZXgsXG4gICAgZW5jb3VudGVyU2VydmljZTogRW5jb3VudGVyU2VydmljZSxcbiAgICBmaWxlVG9FZGl0PzogVEZpbGUsXG4gICAgbW9kZTogRW5jb3VudGVyTW9kYWxNb2RlID0gZmlsZVRvRWRpdCA/IFwiZWRpdFwiIDogXCJjcmVhdGVcIlxuICApIHtcbiAgICBzdXBlcihhcHApO1xuXG4gICAgdGhpcy5tb25zdGVySW5kZXggPSBtb25zdGVySW5kZXg7XG4gICAgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlID0gZW5jb3VudGVyU2VydmljZTtcbiAgICB0aGlzLmZpbGVUb0VkaXQgPSBmaWxlVG9FZGl0O1xuICAgIHRoaXMubW9kZSA9IG1vZGU7XG4gIH1cblxuICBhc3luYyBvbk9wZW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5tb2RhbEVsLmFkZENsYXNzKFwic2QtZW5jb3VudGVyLW1vZGFsXCIpO1xuXG4gICAgaWYgKHRoaXMuZmlsZVRvRWRpdCkge1xuICAgICAgYXdhaXQgdGhpcy5sb2FkRW5jb3VudGVyRnJvbUZpbGUodGhpcy5maWxlVG9FZGl0KTtcbiAgICB9XG5cbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcmVuZGVyKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuXG4gICAgY29udGVudEVsLmVtcHR5KCk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7XG4gICAgICB0ZXh0OiB0aGlzLmlzRWRpdGluZ1xuICAgICAgICA/IFwiRWRpdCBTaGFkb3dkYXJrIEVuY291bnRlclwiXG4gICAgICAgIDogdGhpcy5pc0R1cGxpY2F0aW5nXG4gICAgICAgICAgPyBcIkR1cGxpY2F0ZSBTaGFkb3dkYXJrIEVuY291bnRlclwiXG4gICAgICAgICAgOiBcIkNyZWF0ZSBTaGFkb3dkYXJrIEVuY291bnRlclwiXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlclN0ZXBJbmRpY2F0b3IoY29udGVudEVsKTtcblxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGVwID09PSBcIm1vbnN0ZXJzXCIpIHtcbiAgICAgIHRoaXMucmVuZGVyTW9uc3RlclN0ZXAoY29udGVudEVsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jdXJyZW50U3RlcCA9PT0gXCJkZXRhaWxzXCIpIHtcbiAgICAgIHRoaXMucmVuZGVyRGV0YWlsc1N0ZXAoY29udGVudEVsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnJlbmRlclByZXZpZXdTdGVwKGNvbnRlbnRFbCk7XG4gIH1cblxuICByZW5kZXJTdGVwSW5kaWNhdG9yKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXN0ZXAtaW5kaWNhdG9yXCIsXG4gICAgICB0ZXh0OlxuICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID09PSBcIm1vbnN0ZXJzXCJcbiAgICAgICAgICA/IFwiU3RlcCAxIG9mIDM6IEFkZCBNb25zdGVyc1wiXG4gICAgICAgICAgOiB0aGlzLmN1cnJlbnRTdGVwID09PSBcImRldGFpbHNcIlxuICAgICAgICAgICAgPyBcIlN0ZXAgMiBvZiAzOiBBZGQgRGV0YWlsc1wiXG4gICAgICAgICAgICA6IFwiU3RlcCAzIG9mIDM6IFByZXZpZXdcIlxuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyTW9uc3RlclN0ZXAoY29udGVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IG5hbWVSb3cgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItbmFtZS1yb3dcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgbmFtZUZpZWxkID0gbmFtZVJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1uYW1lLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIG5hbWVGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiRW5jb3VudGVyIE5hbWVcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgbmFtZUlucHV0ID0gbmFtZUZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJHb2JsaW4gQW1idXNoXCJcbiAgICB9KTtcblxuICAgIG5hbWVJbnB1dC52YWx1ZSA9IHRoaXMuZW5jb3VudGVyTmFtZTtcblxuICAgIG5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5lbmNvdW50ZXJOYW1lID0gbmFtZUlucHV0LnZhbHVlO1xuICAgIH0pO1xuXG4gICAgY29uc3QgYnVpbGRlckVsID0gY29udGVudEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWJ1aWxkZXJcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgYnJvd3NlckVsID0gYnVpbGRlckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWJyb3dzZXJcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgZHJhZnRFbCA9IGJ1aWxkZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1kcmFmdFwiXG4gICAgfSk7XG5cbiAgICBicm93c2VyRWwuY3JlYXRlRWwoXCJoM1wiLCB7XG4gICAgICB0ZXh0OiBcIk1vbnN0ZXIgQnJvd3NlclwiXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlckZpbHRlclJvdyhicm93c2VyRWwpO1xuXG4gICAgY29uc3QgcmVzdWx0c0VsID0gYnJvd3NlckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLW1vbnN0ZXItcmVzdWx0c1wiXG4gICAgfSk7XG5cbiAgICByZXN1bHRzRWwuZGF0YXNldC5yb2xlID0gXCJtb25zdGVyLXJlc3VsdHNcIjtcblxuICAgIGRyYWZ0RWwuY3JlYXRlRWwoXCJoM1wiLCB7XG4gICAgICB0ZXh0OiBcIkVuY291bnRlciBEcmFmdFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBzZWxlY3RlZEVsID0gZHJhZnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zZWxlY3RlZC1tb25zdGVyc1wiXG4gICAgfSk7XG5cbiAgICBzZWxlY3RlZEVsLmRhdGFzZXQucm9sZSA9IFwic2VsZWN0ZWQtbW9uc3RlcnNcIjtcblxuICAgIGNvbnN0IHN1bW1hcnlFbCA9IGRyYWZ0RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItc3VtbWFyeVwiXG4gICAgfSk7XG5cbiAgICBzdW1tYXJ5RWwuZGF0YXNldC5yb2xlID0gXCJlbmNvdW50ZXItc3VtbWFyeVwiO1xuXG4gICAgY29uc3QgYnV0dG9uRWwgPSBkcmFmdEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWNyZWF0ZS1idXR0b25cIlxuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJGb290ZXJCdXR0b25zKGJ1dHRvbkVsLCBbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIk5leHRcIixcbiAgICAgICAgY3RhOiB0cnVlLFxuICAgICAgICBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmVuY291bnRlck5hbWUudHJpbSgpKSB7XG4gICAgICAgICAgICBuZXcgTm90aWNlKFwiRW5jb3VudGVyIG5hbWUgaXMgcmVxdWlyZWQuXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPSBcImRldGFpbHNcIjtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXSk7XG5cbiAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgdGhpcy5yZW5kZXJTZWxlY3RlZE1vbnN0ZXJzKCk7XG4gICAgdGhpcy5yZW5kZXJFbmNvdW50ZXJTdW1tYXJ5KCk7XG4gIH1cblxuICByZW5kZXJGaWx0ZXJSb3coYnJvd3NlckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IGZpbHRlclJvdyA9IGJyb3dzZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1maWx0ZXItcm93XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlYXJjaEZpZWxkID0gZmlsdGVyUm93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBzZWFyY2hGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiU2VhcmNoXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlYXJjaElucHV0ID0gc2VhcmNoRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlNlYXJjaCBtb25zdGVycy4uLlwiXG4gICAgfSk7XG5cbiAgICBzZWFyY2hJbnB1dC52YWx1ZSA9IHRoaXMubW9uc3RlclNlYXJjaDtcblxuICAgIHNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLm1vbnN0ZXJTZWFyY2ggPSBzZWFyY2hJbnB1dC52YWx1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9uc3RlclJlc3VsdHMoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGxldmVsRmllbGQgPSBmaWx0ZXJSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZmlsdGVyLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIGxldmVsRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIkxldmVsXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGxldmVsU2VsZWN0ID0gbGV2ZWxGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiKTtcblxuICAgIGxldmVsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiQW55XCIsXG4gICAgICB2YWx1ZTogXCJcIlxuICAgIH0pO1xuXG4gICAgZm9yIChsZXQgbGV2ZWwgPSAwOyBsZXZlbCA8PSAxMDsgbGV2ZWwrKykge1xuICAgICAgbGV2ZWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgICB0ZXh0OiBTdHJpbmcobGV2ZWwpLFxuICAgICAgICB2YWx1ZTogU3RyaW5nKGxldmVsKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbGV2ZWxTZWxlY3QudmFsdWUgPSB0aGlzLmxldmVsRmlsdGVyO1xuXG4gICAgbGV2ZWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmxldmVsRmlsdGVyID0gbGV2ZWxTZWxlY3QudmFsdWU7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0YWdGaWVsZCA9IGZpbHRlclJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1maWx0ZXItZmllbGRcIlxuICAgIH0pO1xuXG4gICAgdGFnRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIlRhZ1wiXG4gICAgfSk7XG5cbiAgICBjb25zdCB0YWdTZWxlY3QgPSB0YWdGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiKTtcblxuICAgIHRhZ1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIkFueVwiLFxuICAgICAgdmFsdWU6IFwiXCJcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgdGFnIG9mIHRoaXMuZ2V0QXZhaWxhYmxlVGFncygpKSB7XG4gICAgICB0YWdTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgICB0ZXh0OiB0YWcsXG4gICAgICAgIHZhbHVlOiB0YWdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRhZ1NlbGVjdC52YWx1ZSA9IHRoaXMudGFnRmlsdGVyO1xuXG4gICAgdGFnU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgdGhpcy50YWdGaWx0ZXIgPSB0YWdTZWxlY3QudmFsdWU7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3J0RmllbGQgPSBmaWx0ZXJSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZmlsdGVyLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIHNvcnRGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiU29ydFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3J0U2VsZWN0ID0gc29ydEZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuXG4gICAgc29ydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIk5hbWUgQS1aXCIsXG4gICAgICB2YWx1ZTogXCJuYW1lLWFzY1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTmFtZSBaLUFcIixcbiAgICAgIHZhbHVlOiBcIm5hbWUtZGVzY1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTGV2ZWwgTG93LUhpZ2hcIixcbiAgICAgIHZhbHVlOiBcImxldmVsLWFzY1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTGV2ZWwgSGlnaC1Mb3dcIixcbiAgICAgIHZhbHVlOiBcImxldmVsLWRlc2NcIlxuICAgIH0pO1xuXG4gICAgc29ydFNlbGVjdC52YWx1ZSA9IHRoaXMuc29ydE1vZGU7XG5cbiAgICBzb3J0U2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5zb3J0TW9kZSA9IHNvcnRTZWxlY3QudmFsdWU7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJEZXRhaWxzU3RlcChjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgZGV0YWlsc0VsID0gY29udGVudEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRldGFpbHMtc3RlcFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBwYXJ0eVJvdyA9IGRldGFpbHNFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1wYXJ0eS1yb3dcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgbGV2ZWxGaWVsZCA9IHBhcnR5Um93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXBhcnR5LWZpZWxkXCJcbiAgICB9KTtcblxuICAgIGxldmVsRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIlBhcnR5IExldmVsXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGxldmVsSW5wdXQgPSBsZXZlbEZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJudW1iZXJcIlxuICAgIH0pO1xuXG4gICAgbGV2ZWxJbnB1dC52YWx1ZSA9IFN0cmluZyh0aGlzLnBhcnR5TGV2ZWwpO1xuXG4gICAgbGV2ZWxJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlcihsZXZlbElucHV0LnZhbHVlKTtcblxuICAgICAgdGhpcy5wYXJ0eUxldmVsID1cbiAgICAgICAgTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgJiYgcGFyc2VkID4gMFxuICAgICAgICAgID8gTWF0aC5mbG9vcihwYXJzZWQpXG4gICAgICAgICAgOiAxO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgc2l6ZUZpZWxkID0gcGFydHlSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcGFydHktZmllbGRcIlxuICAgIH0pO1xuXG4gICAgc2l6ZUZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJQYXJ0eSBTaXplXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNpemVJbnB1dCA9IHNpemVGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwibnVtYmVyXCJcbiAgICB9KTtcblxuICAgIHNpemVJbnB1dC52YWx1ZSA9IFN0cmluZyh0aGlzLnBhcnR5U2l6ZSk7XG5cbiAgICBzaXplSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIoc2l6ZUlucHV0LnZhbHVlKTtcblxuICAgICAgdGhpcy5wYXJ0eVNpemUgPVxuICAgICAgICBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPiAwXG4gICAgICAgICAgPyBNYXRoLmZsb29yKHBhcnNlZClcbiAgICAgICAgICA6IDQ7XG4gICAgfSk7XG5cbiAgICBjb25zdCBpbml0aWF0aXZlRmllbGQgPSBkZXRhaWxzRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZGV0YWlscy1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBpbml0aWF0aXZlRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIkluaXRpYXRpdmUgTW9kZVwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBpbml0aWF0aXZlU2VsZWN0ID0gaW5pdGlhdGl2ZUZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuXG4gICAgaW5pdGlhdGl2ZVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIkluZGl2aWR1YWwgTW9uc3RlcnNcIixcbiAgICAgIHZhbHVlOiBcImluZGl2aWR1YWxfbW9uc3RlcnNcIlxuICAgIH0pO1xuXG4gICAgaW5pdGlhdGl2ZVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIlNoYWRvd2RhcmsgUkFXXCIsXG4gICAgICB2YWx1ZTogXCJzaGFkb3dkYXJrX3Jhd1wiXG4gICAgfSk7XG5cbiAgICBpbml0aWF0aXZlU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTm9uZVwiLFxuICAgICAgdmFsdWU6IFwibm9uZVwiXG4gICAgfSk7XG5cbiAgICBpbml0aWF0aXZlU2VsZWN0LnZhbHVlID0gdGhpcy5pbml0aWF0aXZlTW9kZTtcblxuICAgIGluaXRpYXRpdmVTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmluaXRpYXRpdmVNb2RlID1cbiAgICAgICAgaW5pdGlhdGl2ZVNlbGVjdC52YWx1ZSBhcyBFbmNvdW50ZXJJbml0aWF0aXZlTW9kZTtcbiAgICB9KTtcblxuICAgIGRldGFpbHNFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJBZGQgb3B0aW9uYWwgR00tZmFjaW5nIGRldGFpbHMgZm9yIHRoaXMgZW5jb3VudGVyLlwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBkZXRhaWxzR3JpZCA9IGRldGFpbHNFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1kZXRhaWxzLWdyaWRcIlxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRUZXh0QXJlYUZpZWxkKGRldGFpbHNHcmlkLCBcIlNldHVwXCIsIHRoaXMuc2V0dXAsICh2YWx1ZSkgPT4ge1xuICAgICAgdGhpcy5zZXR1cCA9IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRUZXh0QXJlYUZpZWxkKGRldGFpbHNHcmlkLCBcIlJlYWQtQWxvdWRcIiwgdGhpcy5yZWFkQWxvdWQsICh2YWx1ZSkgPT4ge1xuICAgICAgdGhpcy5yZWFkQWxvdWQgPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkVGV4dEFyZWFGaWVsZChkZXRhaWxzR3JpZCwgXCJUYWN0aWNzXCIsIHRoaXMudGFjdGljcywgKHZhbHVlKSA9PiB7XG4gICAgICB0aGlzLnRhY3RpY3MgPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkVGV4dEFyZWFGaWVsZChkZXRhaWxzR3JpZCwgXCJUcmVhc3VyZVwiLCB0aGlzLnRyZWFzdXJlLCAodmFsdWUpID0+IHtcbiAgICAgIHRoaXMudHJlYXN1cmUgPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIGNvbnN0IG5vdGVzRmllbGQgPSBkZXRhaWxzRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZGV0YWlscy1maWVsZCBzZC1lbmNvdW50ZXItbm90ZXMtZmllbGRcIlxuICAgIH0pO1xuXG4gICAgbm90ZXNGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiTm90ZXNcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgbm90ZXNBcmVhID0gbm90ZXNGaWVsZC5jcmVhdGVFbChcInRleHRhcmVhXCIpO1xuXG4gICAgbm90ZXNBcmVhLnZhbHVlID0gdGhpcy5ub3RlcztcbiAgICBub3Rlc0FyZWEucm93cyA9IDQ7XG5cbiAgICBub3Rlc0FyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMubm90ZXMgPSBub3Rlc0FyZWEudmFsdWU7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlckZvb3RlckJ1dHRvbnMoY29udGVudEVsLCBbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIkJhY2tcIixcbiAgICAgICAgb25DbGljazogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPSBcIm1vbnN0ZXJzXCI7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiU2tpcCBEZXRhaWxzXCIsXG4gICAgICAgIG9uQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gXCJwcmV2aWV3XCI7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiUHJldmlld1wiLFxuICAgICAgICBjdGE6IHRydWUsXG4gICAgICAgIG9uQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gXCJwcmV2aWV3XCI7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0pO1xuICB9XG5cbiAgYWRkVGV4dEFyZWFGaWVsZChcbiAgICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQsXG4gICAgbGFiZWw6IHN0cmluZyxcbiAgICB2YWx1ZTogc3RyaW5nLFxuICAgIG9uQ2hhbmdlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBmaWVsZEVsID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZGV0YWlscy1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBmaWVsZEVsLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogbGFiZWxcbiAgICB9KTtcblxuICAgIGNvbnN0IHRleHRhcmVhID0gZmllbGRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIpO1xuXG4gICAgdGV4dGFyZWEudmFsdWUgPSB2YWx1ZTtcbiAgICB0ZXh0YXJlYS5yb3dzID0gNDtcblxuICAgIHRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICBvbkNoYW5nZSh0ZXh0YXJlYS52YWx1ZSk7XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJQcmV2aWV3U3RlcChjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgZW5jb3VudGVyID0gdGhpcy5nZXRFbmNvdW50ZXJEYXRhKCk7XG5cbiAgICBjb25zdCBwcmV2aWV3RWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcHJldmlldy1zdGVwXCJcbiAgICB9KTtcblxuICAgIHByZXZpZXdFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJQcmV2aWV3IHRoZSBtYXJrZG93biB0aGF0IHdpbGwgYmUgc2F2ZWQuXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IG1hcmtkb3duUHJldmlldyA9IHByZXZpZXdFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItbWFya2Rvd24tcHJldmlld1wiXG4gICAgfSk7XG5cbiAgICBtYXJrZG93blByZXZpZXcudmFsdWUgPSBnZW5lcmF0ZUVuY291bnRlck1hcmtkb3duKGVuY291bnRlcik7XG4gICAgbWFya2Rvd25QcmV2aWV3LnJlYWRPbmx5ID0gdHJ1ZTtcblxuICAgIHRoaXMucmVuZGVyRm9vdGVyQnV0dG9ucyhjb250ZW50RWwsIFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiQmFja1wiLFxuICAgICAgICBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IFwiZGV0YWlsc1wiO1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiB0aGlzLmlzRWRpdGluZ1xuICAgICAgICAgID8gXCJTYXZlIEVuY291bnRlclwiXG4gICAgICAgICAgOiB0aGlzLmlzRHVwbGljYXRpbmdcbiAgICAgICAgICAgID8gXCJDcmVhdGUgRHVwbGljYXRlXCJcbiAgICAgICAgICAgIDogXCJDcmVhdGUgRW5jb3VudGVyXCIsXG4gICAgICAgIGN0YTogdHJ1ZSxcbiAgICAgICAgb25DbGljazogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUVuY291bnRlcigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXSk7XG4gIH1cblxuICByZW5kZXJGb290ZXJCdXR0b25zKFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBidXR0b25zOiB7XG4gICAgICBsYWJlbDogc3RyaW5nO1xuICAgICAgY3RhPzogYm9vbGVhbjtcbiAgICAgIG9uQ2xpY2s6ICgpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICAgIH1bXVxuICApOiB2b2lkIHtcbiAgICBjb25zdCBmb290ZXJFbCA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXdpemFyZC1mb290ZXJcIlxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBidXR0b25Db25maWcgb2YgYnV0dG9ucykge1xuICAgICAgY29uc3QgYnV0dG9uID0gZm9vdGVyRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICB0ZXh0OiBidXR0b25Db25maWcubGFiZWxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoYnV0dG9uQ29uZmlnLmN0YSkge1xuICAgICAgICBidXR0b24uYWRkQ2xhc3MoXCJtb2QtY3RhXCIpO1xuICAgICAgfVxuXG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCBidXR0b25Db25maWcub25DbGljaygpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RW5jb3VudGVyRGF0YSgpOiBFbmNvdW50ZXJEYXRhIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogdGhpcy5lbmNvdW50ZXJOYW1lLnRyaW0oKSxcbiAgICAgIHBhcnR5TGV2ZWw6IHRoaXMucGFydHlMZXZlbCxcbiAgICAgIHBhcnR5U2l6ZTogdGhpcy5wYXJ0eVNpemUsXG4gICAgICBpbml0aWF0aXZlTW9kZTogdGhpcy5pbml0aWF0aXZlTW9kZSxcbiAgICAgIG1vbnN0ZXJzOiB0aGlzLnNlbGVjdGVkTW9uc3RlcnMsXG4gICAgICBzZXR1cDogdGhpcy5zZXR1cCxcbiAgICAgIHJlYWRBbG91ZDogdGhpcy5yZWFkQWxvdWQsXG4gICAgICB0YWN0aWNzOiB0aGlzLnRhY3RpY3MsXG4gICAgICB0cmVhc3VyZTogdGhpcy50cmVhc3VyZSxcbiAgICAgIG5vdGVzOiB0aGlzLm5vdGVzXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgbG9hZEVuY291bnRlckZyb21GaWxlKGZpbGU6IFRGaWxlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlcjtcblxuICAgIGlmICghZnJvbnRtYXR0ZXIgfHwgZnJvbnRtYXR0ZXIuc2hhZG93ZGFya1R5cGUgIT09IFwiZW5jb3VudGVyXCIpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJUaGlzIGZpbGUgaXMgbm90IGEgU2hhZG93ZGFyayBlbmNvdW50ZXIuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuaW5pdGlhdGl2ZU1vZGUgPVxuICAgICAgZnJvbnRtYXR0ZXIuaW5pdGlhdGl2ZU1vZGUgPT09IFwic2hhZG93ZGFya19yYXdcIiB8fFxuICAgICAgZnJvbnRtYXR0ZXIuaW5pdGlhdGl2ZU1vZGUgPT09IFwiaW5kaXZpZHVhbF9tb25zdGVyc1wiIHx8XG4gICAgICBmcm9udG1hdHRlci5pbml0aWF0aXZlTW9kZSA9PT0gXCJub25lXCJcbiAgICAgICAgPyBmcm9udG1hdHRlci5pbml0aWF0aXZlTW9kZVxuICAgICAgICA6IFwiaW5kaXZpZHVhbF9tb25zdGVyc1wiO1xuXG4gICAgdGhpcy5lbmNvdW50ZXJOYW1lID0gU3RyaW5nKGZyb250bWF0dGVyLm5hbWUgPz8gZmlsZS5iYXNlbmFtZSk7XG5cbiAgICBpZiAodGhpcy5pc0R1cGxpY2F0aW5nKSB7XG4gICAgICB0aGlzLmVuY291bnRlck5hbWUgPSBgJHt0aGlzLmVuY291bnRlck5hbWV9IENvcHlgO1xuICAgIH1cblxuICAgIHRoaXMucGFydHlMZXZlbCA9IE51bWJlcihmcm9udG1hdHRlci5wYXJ0eUxldmVsID8/IDEpO1xuICAgIHRoaXMucGFydHlTaXplID0gTnVtYmVyKGZyb250bWF0dGVyLnBhcnR5U2l6ZSA/PyA0KTtcblxuICAgIHRoaXMuc2VsZWN0ZWRNb25zdGVycyA9IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIubW9uc3RlcnMpXG4gICAgICA/IGZyb250bWF0dGVyLm1vbnN0ZXJzLm1hcCgobW9uc3RlcjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+ICh7XG4gICAgICAgICAgbmFtZTogU3RyaW5nKG1vbnN0ZXIubmFtZSA/PyBcIlVua25vd24gTW9uc3RlclwiKSxcbiAgICAgICAgICBwYXRoOiBTdHJpbmcobW9uc3Rlci5wYXRoID8/IFwiXCIpLFxuICAgICAgICAgIHF0eTogTnVtYmVyKG1vbnN0ZXIucXR5ID8/IDEpLFxuICAgICAgICAgIGxldmVsOiBTdHJpbmcobW9uc3Rlci5sZXZlbCA/PyBcIlwiKSxcbiAgICAgICAgICBhYzogU3RyaW5nKG1vbnN0ZXIuYWMgPz8gXCJcIiksXG4gICAgICAgICAgaHA6IFN0cmluZyhtb25zdGVyLmhwID8/IFwiXCIpLFxuICAgICAgICAgIGRleDogU3RyaW5nKG1vbnN0ZXIuZGV4ID8/IFwiXCIpXG4gICAgICAgIH0pKVxuICAgICAgOiBbXTtcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuXG4gICAgdGhpcy5zZXR1cCA9IHRoaXMuZXh0cmFjdFNlY3Rpb24oY29udGVudCwgXCJTZXR1cFwiKTtcbiAgICB0aGlzLnJlYWRBbG91ZCA9IHRoaXMuZXh0cmFjdFNlY3Rpb24oY29udGVudCwgXCJSZWFkLUFsb3VkXCIpO1xuICAgIHRoaXMudGFjdGljcyA9IHRoaXMuZXh0cmFjdFNlY3Rpb24oY29udGVudCwgXCJUYWN0aWNzXCIpO1xuICAgIHRoaXMudHJlYXN1cmUgPSB0aGlzLmV4dHJhY3RTZWN0aW9uKGNvbnRlbnQsIFwiVHJlYXN1cmVcIik7XG4gICAgdGhpcy5ub3RlcyA9IHRoaXMuZXh0cmFjdFNlY3Rpb24oY29udGVudCwgXCJOb3Rlc1wiKTtcbiAgfVxuXG4gIHByaXZhdGUgZXh0cmFjdFNlY3Rpb24oXG4gICAgY29udGVudDogc3RyaW5nLFxuICAgIGhlYWRpbmc6IHN0cmluZ1xuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgvXFxyP1xcbi8pO1xuXG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IGxpbmVzLmZpbmRJbmRleChcbiAgICAgIChsaW5lKSA9PiBsaW5lLnRyaW0oKSA9PT0gYCMjICR7aGVhZGluZ31gXG4gICAgKTtcblxuICAgIGlmIChzdGFydEluZGV4ID09PSAtMSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgY29uc3Qgc2VjdGlvbkxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXggKyAxOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGxpbmUgPSBsaW5lc1tpXTtcblxuICAgICAgaWYgKC9eIyNcXHMrLy50ZXN0KGxpbmUudHJpbSgpKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgc2VjdGlvbkxpbmVzLnB1c2gobGluZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlY3Rpb25MaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbiAgfVxuXG4gIGdldEF2YWlsYWJsZVRhZ3MoKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHRhZ1NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gICAgZm9yIChjb25zdCBtb25zdGVyIG9mIHRoaXMubW9uc3RlckluZGV4LmdldEFsbE1vbnN0ZXJzKCkpIHtcbiAgICAgIGZvciAoY29uc3QgdGFnIG9mIG1vbnN0ZXIudGFncyA/PyBbXSkge1xuICAgICAgICB0YWdTZXQuYWRkKFN0cmluZyh0YWcpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gWy4uLnRhZ1NldF0uc29ydCgoYSwgYikgPT4gYS5sb2NhbGVDb21wYXJlKGIpKTtcbiAgfVxuXG4gIHNvcnRNb25zdGVycyhtb25zdGVyczogTW9uc3RlclN1bW1hcnlbXSk6IE1vbnN0ZXJTdW1tYXJ5W10ge1xuICAgIHJldHVybiBbLi4ubW9uc3RlcnNdLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGNvbnN0IGFMZXZlbCA9IE51bWJlcihhLmxldmVsID8/IDk5OSk7XG4gICAgICBjb25zdCBiTGV2ZWwgPSBOdW1iZXIoYi5sZXZlbCA/PyA5OTkpO1xuXG4gICAgICBzd2l0Y2ggKHRoaXMuc29ydE1vZGUpIHtcbiAgICAgICAgY2FzZSBcIm5hbWUtZGVzY1wiOlxuICAgICAgICAgIHJldHVybiBiLm5hbWUubG9jYWxlQ29tcGFyZShhLm5hbWUpO1xuXG4gICAgICAgIGNhc2UgXCJsZXZlbC1hc2NcIjpcbiAgICAgICAgICByZXR1cm4gYUxldmVsIC0gYkxldmVsIHx8IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG5cbiAgICAgICAgY2FzZSBcImxldmVsLWRlc2NcIjpcbiAgICAgICAgICByZXR1cm4gYkxldmVsIC0gYUxldmVsIHx8IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG5cbiAgICAgICAgY2FzZSBcIm5hbWUtYXNjXCI6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJNb25zdGVyUmVzdWx0cygpOiB2b2lkIHtcbiAgICBjb25zdCByZXN1bHRzRWwgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFxuICAgICAgJ1tkYXRhLXJvbGU9XCJtb25zdGVyLXJlc3VsdHNcIl0nXG4gICAgKTtcblxuICAgIGlmICghKHJlc3VsdHNFbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlc3VsdHNFbC5lbXB0eSgpO1xuXG4gICAgbGV0IG1vbnN0ZXJzID0gdGhpcy5tb25zdGVySW5kZXguc2VhcmNoTW9uc3RlcnModGhpcy5tb25zdGVyU2VhcmNoKTtcblxuICAgIGlmICh0aGlzLmxldmVsRmlsdGVyKSB7XG4gICAgICBtb25zdGVycyA9IG1vbnN0ZXJzLmZpbHRlcigobW9uc3RlcikgPT5cbiAgICAgICAgU3RyaW5nKG1vbnN0ZXIubGV2ZWwgPz8gXCJcIikgPT09IHRoaXMubGV2ZWxGaWx0ZXJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudGFnRmlsdGVyKSB7XG4gICAgICBtb25zdGVycyA9IG1vbnN0ZXJzLmZpbHRlcigobW9uc3RlcikgPT5cbiAgICAgICAgKG1vbnN0ZXIudGFncyA/PyBbXSkuaW5jbHVkZXModGhpcy50YWdGaWx0ZXIpXG4gICAgICApO1xuICAgIH1cblxuICAgIG1vbnN0ZXJzID0gdGhpcy5zb3J0TW9uc3RlcnMobW9uc3RlcnMpO1xuICAgIG1vbnN0ZXJzID0gbW9uc3RlcnMuc2xpY2UoMCwgMTAwKTtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiBtb25zdGVycykge1xuICAgICAgY29uc3Qgcm93ID0gbmV3IERvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgICAgY29uc3Qgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICB3cmFwcGVyLmNsYXNzTmFtZSA9IFwic2QtZW5jb3VudGVyLW1vbnN0ZXItcm93XCI7XG5cbiAgICAgIGNvbnN0IGluZm8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgaW5mby5jbGFzc05hbWUgPSBcInNkLWVuY291bnRlci1tb25zdGVyLWluZm9cIjtcblxuICAgICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBuYW1lLmNsYXNzTmFtZSA9IFwic2QtZW5jb3VudGVyLW1vbnN0ZXItbmFtZVwiO1xuICAgICAgbmFtZS50ZXh0Q29udGVudCA9IG1vbnN0ZXIubmFtZTtcblxuICAgICAgY29uc3QgbWV0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBtZXRhLmNsYXNzTmFtZSA9IFwic2QtZW5jb3VudGVyLW1vbnN0ZXItbWV0YVwiO1xuICAgICAgbWV0YS50ZXh0Q29udGVudCA9XG4gICAgICAgIFtcbiAgICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgICBtb25zdGVyLmFjID8gYEFDICR7bW9uc3Rlci5hY31gIDogbnVsbCxcbiAgICAgICAgICBtb25zdGVyLmhwID8gYEhQICR7bW9uc3Rlci5ocH1gIDogbnVsbFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiIFx1MjAyMiBcIikgfHwgbW9uc3Rlci5wYXRoO1xuXG4gICAgICBpbmZvLmFwcGVuZENoaWxkKG5hbWUpO1xuICAgICAgaW5mby5hcHBlbmRDaGlsZChtZXRhKTtcblxuICAgICAgY29uc3QgYWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBhY3Rpb25zLmNsYXNzTmFtZSA9IFwic2QtZW5jb3VudGVyLW1vbnN0ZXItYWN0aW9uc1wiO1xuXG4gICAgICBjb25zdCBwcmV2aWV3QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgIHByZXZpZXdCdXR0b24udGV4dENvbnRlbnQgPSBcIlByZXZpZXdcIjtcblxuICAgICAgcHJldmlld0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIHNob3dNb25zdGVyUHJldmlldyh0aGlzLmFwcCwgZXZlbnQsIG1vbnN0ZXIpO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGFkZEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBhZGRCdXR0b24udGV4dENvbnRlbnQgPSBcIkFkZFwiO1xuICAgICAgYWRkQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJtb2QtY3RhXCIpO1xuXG4gICAgICBhZGRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5hZGRNb25zdGVyKG1vbnN0ZXIpO1xuICAgICAgfSk7XG5cbiAgICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQocHJldmlld0J1dHRvbik7XG4gICAgICBhY3Rpb25zLmFwcGVuZENoaWxkKGFkZEJ1dHRvbik7XG5cbiAgICAgIHdyYXBwZXIuYXBwZW5kQ2hpbGQoaW5mbyk7XG4gICAgICB3cmFwcGVyLmFwcGVuZENoaWxkKGFjdGlvbnMpO1xuXG4gICAgICByb3cuYXBwZW5kQ2hpbGQod3JhcHBlcik7XG4gICAgICByZXN1bHRzRWwuYXBwZW5kQ2hpbGQocm93KTtcbiAgICB9XG4gIH1cblxuICByZW5kZXJTZWxlY3RlZE1vbnN0ZXJzKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkRWwgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFxuICAgICAgJ1tkYXRhLXJvbGU9XCJzZWxlY3RlZC1tb25zdGVyc1wiXSdcbiAgICApO1xuXG4gICAgaWYgKCEoc2VsZWN0ZWRFbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGVjdGVkRWwuZW1wdHkoKTtcblxuICAgIGlmICh0aGlzLnNlbGVjdGVkTW9uc3RlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBzZWxlY3RlZEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IFwiTm8gbW9uc3RlcnMgc2VsZWN0ZWQgeWV0LlwiXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiB0aGlzLnNlbGVjdGVkTW9uc3RlcnMpIHtcbiAgICAgIGNvbnN0IHJvd0VsID0gc2VsZWN0ZWRFbC5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXNlbGVjdGVkLXJvd1wiXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgaW5mb0VsID0gcm93RWwuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zZWxlY3RlZC1pbmZvXCJcbiAgICAgIH0pO1xuXG4gICAgICBpbmZvRWwuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zZWxlY3RlZC1uYW1lXCIsXG4gICAgICAgIHRleHQ6IG1vbnN0ZXIubmFtZVxuICAgICAgfSk7XG5cbiAgICAgIGluZm9FbC5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXNlbGVjdGVkLXBhdGhcIixcbiAgICAgICAgdGV4dDogbW9uc3Rlci5wYXRoXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcXR5SW5wdXQgPSByb3dFbC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgdHlwZTogXCJudW1iZXJcIlxuICAgICAgfSk7XG5cbiAgICAgIHF0eUlucHV0LnZhbHVlID0gU3RyaW5nKG1vbnN0ZXIucXR5KTtcbiAgICAgIHF0eUlucHV0Lm1pbiA9IFwiMVwiO1xuXG4gICAgICBxdHlJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgcXR5ID0gTnVtYmVyKHF0eUlucHV0LnZhbHVlKTtcblxuICAgICAgICBtb25zdGVyLnF0eSA9XG4gICAgICAgICAgTnVtYmVyLmlzRmluaXRlKHF0eSkgJiYgcXR5ID4gMFxuICAgICAgICAgICAgPyBNYXRoLmZsb29yKHF0eSlcbiAgICAgICAgICAgIDogMTtcblxuICAgICAgICB0aGlzLnJlbmRlckVuY291bnRlclN1bW1hcnkoKTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZW1vdmVCdXR0b24gPSByb3dFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIHRleHQ6IFwiUmVtb3ZlXCJcbiAgICAgIH0pO1xuXG4gICAgICByZW1vdmVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZE1vbnN0ZXJzID0gdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLmZpbHRlcihcbiAgICAgICAgICAoc2VsZWN0ZWQpID0+IHNlbGVjdGVkLnBhdGggIT09IG1vbnN0ZXIucGF0aFxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMucmVuZGVyU2VsZWN0ZWRNb25zdGVycygpO1xuICAgICAgICB0aGlzLnJlbmRlckVuY291bnRlclN1bW1hcnkoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlckVuY291bnRlclN1bW1hcnkoKTogdm9pZCB7XG4gICAgY29uc3Qgc3VtbWFyeUVsID0gdGhpcy5jb250ZW50RWwucXVlcnlTZWxlY3RvcihcbiAgICAgICdbZGF0YS1yb2xlPVwiZW5jb3VudGVyLXN1bW1hcnlcIl0nXG4gICAgKTtcblxuICAgIGlmICghKHN1bW1hcnlFbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN1bW1hcnlFbC5lbXB0eSgpO1xuXG4gICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMuZ2V0RW5jb3VudGVyU3VtbWFyeSgpO1xuXG4gICAgc3VtbWFyeUVsLmNyZWF0ZUVsKFwiaDRcIiwge1xuICAgICAgdGV4dDogXCJFbmNvdW50ZXIgU3VtbWFyeVwiXG4gICAgfSk7XG5cbiAgICBzdW1tYXJ5RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBUb3RhbCBNb25zdGVyczogJHtzdW1tYXJ5LnRvdGFsTW9uc3RlcnN9YFxuICAgIH0pO1xuXG4gICAgc3VtbWFyeUVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgVW5pcXVlIE1vbnN0ZXJzOiAke3N1bW1hcnkudW5pcXVlTW9uc3RlcnN9YFxuICAgIH0pO1xuXG4gICAgc3VtbWFyeUVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgQXZlcmFnZSBNb25zdGVyIExldmVsOiAke3N1bW1hcnkuYXZlcmFnZUxldmVsLnRvRml4ZWQoMSl9YFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0RW5jb3VudGVyU3VtbWFyeSgpOiB7XG4gICAgdG90YWxNb25zdGVyczogbnVtYmVyO1xuICAgIHVuaXF1ZU1vbnN0ZXJzOiBudW1iZXI7XG4gICAgYXZlcmFnZUxldmVsOiBudW1iZXI7XG4gIH0ge1xuICAgIGNvbnN0IHRvdGFsTW9uc3RlcnMgPSB0aGlzLnNlbGVjdGVkTW9uc3RlcnMucmVkdWNlKFxuICAgICAgKHN1bSwgbW9uc3RlcikgPT4gc3VtICsgbW9uc3Rlci5xdHksXG4gICAgICAwXG4gICAgKTtcblxuICAgIGNvbnN0IHVuaXF1ZU1vbnN0ZXJzID0gdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLmxlbmd0aDtcblxuICAgIGxldCB0b3RhbExldmVscyA9IDA7XG4gICAgbGV0IGNvdW50ZWRNb25zdGVycyA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgdGhpcy5zZWxlY3RlZE1vbnN0ZXJzKSB7XG4gICAgICBjb25zdCBsZXZlbCA9IE51bWJlcihtb25zdGVyLmxldmVsKTtcblxuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4obGV2ZWwpKSB7XG4gICAgICAgIHRvdGFsTGV2ZWxzICs9IGxldmVsICogbW9uc3Rlci5xdHk7XG4gICAgICAgIGNvdW50ZWRNb25zdGVycyArPSBtb25zdGVyLnF0eTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhdmVyYWdlTGV2ZWwgPVxuICAgICAgY291bnRlZE1vbnN0ZXJzID4gMFxuICAgICAgICA/IHRvdGFsTGV2ZWxzIC8gY291bnRlZE1vbnN0ZXJzXG4gICAgICAgIDogMDtcblxuICAgIHJldHVybiB7XG4gICAgICB0b3RhbE1vbnN0ZXJzLFxuICAgICAgdW5pcXVlTW9uc3RlcnMsXG4gICAgICBhdmVyYWdlTGV2ZWxcbiAgICB9O1xuICB9XG5cbiAgYWRkTW9uc3Rlcihtb25zdGVyOiBNb25zdGVyU3VtbWFyeSk6IHZvaWQge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLmZpbmQoXG4gICAgICAoc2VsZWN0ZWQpID0+IHNlbGVjdGVkLnBhdGggPT09IG1vbnN0ZXIucGF0aFxuICAgICk7XG5cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIGV4aXN0aW5nLnF0eSArPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNlbGVjdGVkTW9uc3RlcnMucHVzaCh7XG4gICAgICAgIG5hbWU6IG1vbnN0ZXIubmFtZSxcbiAgICAgICAgcGF0aDogbW9uc3Rlci5wYXRoLFxuICAgICAgICBxdHk6IDEsXG4gICAgICAgIGxldmVsOiBtb25zdGVyLmxldmVsLFxuICAgICAgICBhYzogbW9uc3Rlci5hYyxcbiAgICAgICAgaHA6IG1vbnN0ZXIuaHAsXG4gICAgICAgIGRleDogbW9uc3Rlci5kZXhcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyU2VsZWN0ZWRNb25zdGVycygpO1xuICAgIHRoaXMucmVuZGVyRW5jb3VudGVyU3VtbWFyeSgpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZUVuY291bnRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5lbmNvdW50ZXJOYW1lLnRyaW0oKTtcblxuICAgIGlmICghbmFtZSkge1xuICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBuYW1lIGlzIHJlcXVpcmVkLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMuaXNFZGl0aW5nICYmIHRoaXMuZmlsZVRvRWRpdCkge1xuICAgICAgICBhd2FpdCB0aGlzLmVuY291bnRlclNlcnZpY2UudXBkYXRlRW5jb3VudGVyTm90ZShcbiAgICAgICAgICB0aGlzLmZpbGVUb0VkaXQsXG4gICAgICAgICAgdGhpcy5nZXRFbmNvdW50ZXJEYXRhKClcbiAgICAgICAgKTtcblxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT5cbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChyZXNvbHZlLCAzMDApXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmVuY291bnRlclNlcnZpY2UudXBkYXRlRW5jb3VudGVyTm90ZShcbiAgICAgICAgICB0aGlzLmZpbGVUb0VkaXQsXG4gICAgICAgICAgdGhpcy5nZXRFbmNvdW50ZXJEYXRhKClcbiAgICAgICAgKTtcblxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT5cbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChyZXNvbHZlLCAzMDApXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG5cbiAgICAgICAgYXdhaXQgdmlldz8ucHJldmlld01vZGUucmVyZW5kZXIodHJ1ZSk7XG5cbiAgICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBzYXZlZC5cIik7XG4gICAgICB9ZWxzZSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZW5jb3VudGVyU2VydmljZS5jcmVhdGVFbmNvdW50ZXJOb3RlKFxuICAgICAgICAgIHRoaXMuZ2V0RW5jb3VudGVyRGF0YSgpXG4gICAgICAgICk7XG5cbiAgICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgICB0aGlzLmlzRHVwbGljYXRpbmdcbiAgICAgICAgICAgID8gXCJFbmNvdW50ZXIgZHVwbGljYXRlZC5cIlxuICAgICAgICAgICAgOiBcIkVuY291bnRlciBjcmVhdGVkLlwiXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBzYXZlIGVuY291bnRlcjpcIiwgZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcIkZhaWxlZCB0byBzYXZlIGVuY291bnRlci4gQ2hlY2sgY29uc29sZS5cIik7XG4gICAgfVxuICB9XG59IiwgImltcG9ydCB7IEFwcCwgTWVudSwgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBNb25zdGVyU3VtbWFyeSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93TW9uc3RlclByZXZpZXcoXG4gIGFwcDogQXBwLFxuICBldmVudDogTW91c2VFdmVudCxcbiAgbW9uc3RlcjogTW9uc3RlclN1bW1hcnlcbik6IHZvaWQge1xuXG4gIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKG1vbnN0ZXIubmFtZSlcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChtb25zdGVyLnBhdGgpO1xuXG4gICAgICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgYXBwLndvcmtzcGFjZS5nZXRMZWFmKHRydWUpLm9wZW5GaWxlKGZpbGUpO1xuICAgICB9KTtcbiAgfSk7XG5cbiAgbWVudS5hZGRTZXBhcmF0b3IoKTtcblxuICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICBpdGVtLnNldFRpdGxlKFxuICAgICAgW1xuICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgbW9uc3Rlci5hYyA/IGBBQyAke21vbnN0ZXIuYWN9YCA6IG51bGwsXG4gICAgICAgIG1vbnN0ZXIuaHAgPyBgSFAgJHttb25zdGVyLmhwfWAgOiBudWxsXG4gICAgICBdXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLmpvaW4oXCIgXHUyMDIyIFwiKVxuICAgICk7XG5cbiAgICBpdGVtLnNldERpc2FibGVkKHRydWUpO1xuICB9KTtcblxuICBpZiAobW9uc3Rlci5hdGspIHtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uc2V0VGl0bGUoYEFUSzogJHttb25zdGVyLmF0a31gKTtcbiAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgfSk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHRyYWl0IG9mIG1vbnN0ZXIudHJhaXRzID8/IFtdKSB7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLnNldFRpdGxlKHRyYWl0KTtcbiAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgfSk7XG4gIH1cblxuICBtZW51LmFkZFNlcGFyYXRvcigpO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgIC5zZXRUaXRsZShcIkNvcHkgTW9uc3RlciBQYXRoXCIpXG4gICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KG1vbnN0ZXIucGF0aCk7XG5cbiAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgcGF0aCBjb3BpZWQuXCIpO1xuICAgICAgfSk7XG4gIH0pO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgIC5zZXRUaXRsZShcIk9wZW4gaW4gTmV3IFRhYlwiKVxuICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChtb25zdGVyLnBhdGgpO1xuICAgICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKS5vcGVuRmlsZShmaWxlKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICBpdGVtXG4gICAgICAuc2V0VGl0bGUoXCJPcGVuIHRvIHRoZSBSaWdodFwiKVxuICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuXG4gICAgICAgIGNvbnN0IGZpbGUgPVxuICAgICAgICAgIGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobW9uc3Rlci5wYXRoKTtcblxuICAgICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxlYWYgPVxuICAgICAgICAgIGFwcC53b3Jrc3BhY2UuZ2V0TGVhZihcInNwbGl0XCIsIFwidmVydGljYWxcIik7XG5cbiAgICAgICAgYXdhaXQgbGVhZi5vcGVuRmlsZShmaWxlKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZXZlbnQpO1xufSIsICJpbXBvcnQge1xuICBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0LFxuICBNZW51LFxuICBOb3RpY2UsXG4gIFRGaWxlXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBwYXJzZUZyb250bWF0dGVyIH0gZnJvbSBcIi4uL3N0YXRibG9ja3NDb21wYXQvcGFyc2VGcm9udE1hdHRlclwiO1xuaW1wb3J0IHsgcmVuZGVyTW9uc3RlckJsb2NrIH0gZnJvbSBcIi4uL3N0YXRibG9ja3NDb21wYXQvcmVuZGVyTW9uc3RlckJsb2NrXCI7XG5pbXBvcnQgeyBERUZBVUxUX1NUQVRCTE9DS19SRU5ERVJfU0VUVElOR1MgfSBmcm9tIFwiLi4vc3RhdGJsb2Nrc0NvbXBhdC9zZXR0aW5nc1wiO1xuXG5leHBvcnQgY2xhc3MgRW5jb3VudGVyUmVuZGVyZXIge1xuICBwbHVnaW46IFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKHBsdWdpbjogU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW4pIHtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGV4dHJhY3RTZWN0aW9uKFxuICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICBoZWFkaW5nOiBzdHJpbmdcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoL1xccj9cXG4vKTtcblxuICAgIGNvbnN0IHN0YXJ0SW5kZXggPSBsaW5lcy5maW5kSW5kZXgoXG4gICAgICAobGluZSkgPT4gbGluZS50cmltKCkgPT09IGAjIyAke2hlYWRpbmd9YFxuICAgICk7XG5cbiAgICBpZiAoc3RhcnRJbmRleCA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIGNvbnN0IHNlY3Rpb25MaW5lczogc3RyaW5nW10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydEluZGV4ICsgMTsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBsaW5lID0gbGluZXNbaV07XG5cbiAgICAgIGlmICgvXiMjXFxzKy8udGVzdChsaW5lLnRyaW0oKSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHNlY3Rpb25MaW5lcy5wdXNoKGxpbmUpO1xuICAgIH1cblxuICAgIHJldHVybiBzZWN0aW9uTGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG4gIH1cblxuICByZW5kZXJJbml0aWF0aXZlKFxuICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gICAgZnJvbnRtYXR0ZXI6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogdm9pZCB7XG4gICAgY29uc3QgaW5pdGlhdGl2ZSA9IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIuaW5pdGlhdGl2ZSlcbiAgICAgID8gZnJvbnRtYXR0ZXIuaW5pdGlhdGl2ZVxuICAgICAgOiBbXTtcblxuICAgIGlmIChpbml0aWF0aXZlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGluaXRpYXRpdmVFbCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1yZW5kZXJlZC1pbml0aWF0aXZlXCJcbiAgICB9KTtcblxuICAgIGluaXRpYXRpdmVFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IFwiSW5pdGlhdGl2ZVwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0RWwgPSBpbml0aWF0aXZlRWwuY3JlYXRlRWwoXCJ1bFwiKTtcblxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgaW5pdGlhdGl2ZSkge1xuICAgICAgY29uc3QgaXRlbUVsID0gbGlzdEVsLmNyZWF0ZUVsKFwibGlcIik7XG5cbiAgICAgIGl0ZW1FbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWluaXRpYXRpdmUtcm9sbFwiLFxuICAgICAgICB0ZXh0OiBTdHJpbmcoZW50cnkuaW5pdGlhdGl2ZSA/PyAwKVxuICAgICAgfSk7XG5cbiAgICAgIGl0ZW1FbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICB0ZXh0OiBTdHJpbmcoZW50cnkubmFtZSA/PyBcIlVua25vd25cIilcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJlZ2lzdGVyKCk6IHZvaWQge1xuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyTWFya2Rvd25Qb3N0UHJvY2Vzc29yKFxuICAgICAgKFxuICAgICAgICBlbDogSFRNTEVsZW1lbnQsXG4gICAgICAgIGN0eDogTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dFxuICAgICAgKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5wcm9jZXNzKGVsLCBjdHgpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBhc3luYyBwcm9jZXNzKFxuICAgIGVsOiBIVE1MRWxlbWVudCxcbiAgICBjdHg6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHRcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2VjdGlvbkluZm8gPSBjdHguZ2V0U2VjdGlvbkluZm8oZWwpO1xuXG4gICAgaWYgKCFzZWN0aW9uSW5mbyB8fCBzZWN0aW9uSW5mby5saW5lU3RhcnQgIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID1cbiAgICAgIHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoXG4gICAgICAgIGN0eC5zb3VyY2VQYXRoXG4gICAgICApO1xuXG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNhY2hlID1cbiAgICAgIHRoaXMucGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcblxuICAgIGNvbnN0IGZyb250bWF0dGVyID0gY2FjaGU/LmZyb250bWF0dGVyO1xuXG4gICAgaWYgKGZyb250bWF0dGVyPy5zaGFkb3dkYXJrVHlwZSAhPT0gXCJlbmNvdW50ZXJcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnBsdWdpbi5hcHAudmF1bHQucmVhZChmaWxlKTtcblxuICAgIGNvbnN0IGV4aXN0aW5nUmVuZGVyID0gZWwucXVlcnlTZWxlY3RvcihcbiAgICAgIFwiLnNkLWVuY291bnRlci1yZW5kZXJlZFwiXG4gICAgKTtcblxuICAgIGlmIChlbC5xdWVyeVNlbGVjdG9yKFwiLnNkLWVuY291bnRlci1yZW5kZXJlZFwiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRhaW5lciA9IGVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkXCJcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImgyXCIsIHtcbiAgICAgIHRleHQ6IGZyb250bWF0dGVyLm5hbWUgPz8gZmlsZS5iYXNlbmFtZVxuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkLW1ldGFcIixcbiAgICAgIHRleHQ6IFtcbiAgICAgICAgZnJvbnRtYXR0ZXIucGFydHlMZXZlbFxuICAgICAgICAgID8gYFBhcnR5IExldmVsICR7ZnJvbnRtYXR0ZXIucGFydHlMZXZlbH1gXG4gICAgICAgICAgOiBudWxsLFxuICAgICAgICBmcm9udG1hdHRlci5wYXJ0eVNpemVcbiAgICAgICAgICA/IGAke2Zyb250bWF0dGVyLnBhcnR5U2l6ZX0gUENzYFxuICAgICAgICAgIDogbnVsbCxcbiAgICAgICAgZnJvbnRtYXR0ZXIuc3RhdHVzXG4gICAgICAgICAgPyBgU3RhdHVzOiAke2Zyb250bWF0dGVyLnN0YXR1c31gXG4gICAgICAgICAgOiBudWxsXG4gICAgICBdXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLmpvaW4oXCIgXHUyMDIyIFwiKVxuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJEYXNoYm9hcmRTdGF0cyhjb250YWluZXIsIGZyb250bWF0dGVyKTtcbiAgICB0aGlzLnJlbmRlckNvbXBhY3RNb25zdGVyUm9zdGVyKGNvbnRhaW5lciwgZnJvbnRtYXR0ZXIpO1xuICAgIHRoaXMucmVuZGVySW5pdGlhdGl2ZShjb250YWluZXIsIGZyb250bWF0dGVyKTtcbiAgfVxuXG4gIGdldEVuY291bnRlckRpZmZpY3VsdHkoXG4gICAgZnJvbnRtYXR0ZXI6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXJ0eUxldmVsID0gTnVtYmVyKGZyb250bWF0dGVyLnBhcnR5TGV2ZWwgPz8gMSk7XG4gICAgY29uc3QgcGFydHlTaXplID0gTnVtYmVyKGZyb250bWF0dGVyLnBhcnR5U2l6ZSA/PyA0KTtcblxuICAgIGNvbnN0IG1vbnN0ZXJzID0gQXJyYXkuaXNBcnJheShmcm9udG1hdHRlci5tb25zdGVycylcbiAgICAgID8gZnJvbnRtYXR0ZXIubW9uc3RlcnNcbiAgICAgIDogW107XG5cbiAgICBjb25zdCBwYXJ0eVBvd2VyID0gcGFydHlMZXZlbCAqIHBhcnR5U2l6ZTtcblxuICAgIGNvbnN0IG1vbnN0ZXJQb3dlciA9IG1vbnN0ZXJzLnJlZHVjZShcbiAgICAgIChzdW06IG51bWJlciwgbW9uc3RlcjogUmVjb3JkPHN0cmluZywgYW55PikgPT4ge1xuICAgICAgICBjb25zdCBxdHkgPSBOdW1iZXIobW9uc3Rlci5xdHkgPz8gMSk7XG4gICAgICAgIGNvbnN0IGxldmVsID0gTnVtYmVyKG1vbnN0ZXIubGV2ZWwgPz8gMCk7XG5cbiAgICAgICAgcmV0dXJuIHN1bSArIHF0eSAqIGxldmVsO1xuICAgICAgfSxcbiAgICAgIDBcbiAgICApO1xuXG4gICAgaWYgKG1vbnN0ZXJQb3dlciA8PSAwKSB7XG4gICAgICByZXR1cm4gXCJOb25lXCI7XG4gICAgfVxuXG4gICAgY29uc3QgcmF0aW8gPSBtb25zdGVyUG93ZXIgLyBwYXJ0eVBvd2VyO1xuXG4gICAgaWYgKHJhdGlvIDwgMC41KSB7XG4gICAgICByZXR1cm4gXCJFYXN5XCI7XG4gICAgfVxuXG4gICAgaWYgKHJhdGlvIDwgMC44NSkge1xuICAgICAgcmV0dXJuIFwiU3RhbmRhcmRcIjtcbiAgICB9XG5cbiAgICBpZiAocmF0aW8gPCAxLjI1KSB7XG4gICAgICByZXR1cm4gXCJIYXJkXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiRGVhZGx5XCI7XG4gIH1cblxuICByZW5kZXJEYXNoYm9hcmRTdGF0cyhcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIGZyb250bWF0dGVyOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4gICk6IHZvaWQge1xuICAgIGNvbnN0IG1vbnN0ZXJzID0gQXJyYXkuaXNBcnJheShmcm9udG1hdHRlci5tb25zdGVycylcbiAgICAgID8gZnJvbnRtYXR0ZXIubW9uc3RlcnNcbiAgICAgIDogW107XG5cbiAgICBjb25zdCB0b3RhbE1vbnN0ZXJzID0gbW9uc3RlcnMucmVkdWNlKFxuICAgICAgKHN1bTogbnVtYmVyLCBtb25zdGVyOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSA9PlxuICAgICAgICBzdW0gKyBOdW1iZXIobW9uc3Rlci5xdHkgPz8gMSksXG4gICAgICAwXG4gICAgKTtcblxuICAgIGNvbnN0IHVuaXF1ZU1vbnN0ZXJzID0gbW9uc3RlcnMubGVuZ3RoO1xuXG4gICAgbGV0IHRvdGFsTGV2ZWxzID0gMDtcbiAgICBsZXQgY291bnRlZE1vbnN0ZXJzID0gMDtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiBtb25zdGVycykge1xuICAgICAgY29uc3QgbGV2ZWwgPSBOdW1iZXIobW9uc3Rlci5sZXZlbCk7XG5cbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKGxldmVsKSkge1xuICAgICAgICBjb25zdCBxdHkgPSBOdW1iZXIobW9uc3Rlci5xdHkgPz8gMSk7XG5cbiAgICAgICAgdG90YWxMZXZlbHMgKz0gbGV2ZWwgKiBxdHk7XG4gICAgICAgIGNvdW50ZWRNb25zdGVycyArPSBxdHk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYXZlcmFnZUxldmVsID1cbiAgICAgIGNvdW50ZWRNb25zdGVycyA+IDBcbiAgICAgICAgPyB0b3RhbExldmVscyAvIGNvdW50ZWRNb25zdGVyc1xuICAgICAgICA6IDA7XG5cbiAgICBjb25zdCBkaWZmaWN1bHR5ID1cbiAgICAgIHRoaXMuZ2V0RW5jb3VudGVyRGlmZmljdWx0eShmcm9udG1hdHRlcik7XG5cbiAgICBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcmVuZGVyZWQtc3RhdHNcIixcbiAgICAgIHRleHQ6XG4gICAgICAgIGAke3RvdGFsTW9uc3RlcnN9IE1vbnN0ZXJzYCArXG4gICAgICAgIGAgXHUyMDIyICR7dW5pcXVlTW9uc3RlcnN9IFVuaXF1ZWAgK1xuICAgICAgICBgIFx1MjAyMiBBdmcgTHYgJHthdmVyYWdlTGV2ZWwudG9GaXhlZCgxKX1gICtcbiAgICAgICAgYCBcdTIwMjIgJHtkaWZmaWN1bHR5fWBcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlckNvbXBhY3RNb25zdGVyUm9zdGVyKFxuICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gICAgZnJvbnRtYXR0ZXI6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogdm9pZCB7XG4gICAgY29uc3QgbW9uc3RlcnMgPSBBcnJheS5pc0FycmF5KGZyb250bWF0dGVyLm1vbnN0ZXJzKVxuICAgICAgPyBmcm9udG1hdHRlci5tb25zdGVyc1xuICAgICAgOiBbXTtcblxuICAgIGlmIChtb25zdGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkLWVtcHR5XCIsXG4gICAgICAgIHRleHQ6IFwiTm8gbW9uc3RlcnMgYWRkZWQuXCJcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgcm9zdGVyRWwgPSBjb250YWluZXIuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcmVuZGVyZWQtcm9zdGVyXCJcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiBtb25zdGVycykge1xuICAgICAgY29uc3QgcXR5ID0gbW9uc3Rlci5xdHkgPz8gMTtcbiAgICAgIGNvbnN0IG5hbWUgPSBtb25zdGVyLm5hbWUgPz8gXCJVbmtub3duIE1vbnN0ZXJcIjtcblxuICAgICAgY29uc3QgbWV0YSA9IFtcbiAgICAgICAgbW9uc3Rlci5sZXZlbCA/IGBMViAke21vbnN0ZXIubGV2ZWx9YCA6IG51bGwsXG4gICAgICAgIG1vbnN0ZXIuYWMgPyBgQUMgJHttb25zdGVyLmFjfWAgOiBudWxsLFxuICAgICAgICBtb25zdGVyLmhwID8gYEhQICR7bW9uc3Rlci5ocH1gIDogbnVsbFxuICAgICAgXVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5qb2luKFwiIFx1MjAyMiBcIik7XG5cbiAgICAgIGNvbnN0IHBpbGxFbCA9IHJvc3RlckVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcInNkLWVuY291bnRlci1yZW5kZXJlZC1tb25zdGVyXCIsXG4gICAgICAgIHRleHQ6IG1ldGFcbiAgICAgICAgICA/IGAke3F0eX14ICR7bmFtZX0gXHUyMDIyICR7bWV0YX1gXG4gICAgICAgICAgOiBgJHtxdHl9eCAke25hbWV9YFxuICAgICAgfSk7XG5cbiAgICAgIHBpbGxFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuc2hvd01vbnN0ZXJQaWxsTWVudShldmVudCwgbW9uc3Rlcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzaG93TW9uc3RlclBpbGxNZW51KFxuICAgIGV2ZW50OiBNb3VzZUV2ZW50LFxuICAgIG1vbnN0ZXI6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogdm9pZCB7XG4gICAgY29uc3QgcGF0aCA9IG1vbnN0ZXIucGF0aDtcbiAgICBjb25zdCBuYW1lID0gbW9uc3Rlci5uYW1lID8/IFwiVW5rbm93biBNb25zdGVyXCI7XG5cbiAgICBjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbVxuICAgICAgICAuc2V0VGl0bGUoYE9wZW4gJHtuYW1lfWApXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLm9wZW5Nb25zdGVyKHBhdGgsIFwiY3VycmVudFwiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKFwiT3BlbiBpbiBOZXcgVGFiXCIpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLm9wZW5Nb25zdGVyKHBhdGgsIFwibmV3LXRhYlwiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKFwiT3BlbiB0byB0aGUgUmlnaHRcIilcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMub3Blbk1vbnN0ZXIocGF0aCwgXCJyaWdodFwiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZShcIlByZXZpZXcgU3RhdGJsb2NrXCIpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNob3dNb25zdGVyU3RhdGJsb2NrUHJldmlldyhtb25zdGVyKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLnNldFRpdGxlKFxuICAgICAgICBbXG4gICAgICAgICAgbW9uc3Rlci5sZXZlbCA/IGBMViAke21vbnN0ZXIubGV2ZWx9YCA6IG51bGwsXG4gICAgICAgICAgbW9uc3Rlci5hYyA/IGBBQyAke21vbnN0ZXIuYWN9YCA6IG51bGwsXG4gICAgICAgICAgbW9uc3Rlci5ocCA/IGBIUCAke21vbnN0ZXIuaHB9YCA6IG51bGxcbiAgICAgICAgXVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAuam9pbihcIiBcdTIwMjIgXCIpIHx8IFwiTm8gc3RhdHMgYXZhaWxhYmxlXCJcbiAgICAgICk7XG5cbiAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgYXN5bmMgb3Blbk1vbnN0ZXIoXG4gICAgcGF0aDogdW5rbm93bixcbiAgICBtb2RlOiBcImN1cnJlbnRcIiB8IFwibmV3LXRhYlwiIHwgXCJyaWdodFwiXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gXCJzdHJpbmdcIiB8fCBwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPVxuICAgICAgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcblxuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJNb25zdGVyIGZpbGUgbm90IGZvdW5kLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobW9kZSA9PT0gXCJyaWdodFwiKSB7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlXG4gICAgICAgIC5nZXRMZWFmKFwic3BsaXRcIiwgXCJ2ZXJ0aWNhbFwiKVxuICAgICAgICAub3BlbkZpbGUoZmlsZSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobW9kZSA9PT0gXCJuZXctdGFiXCIpIHtcbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2VcbiAgICAgICAgLmdldExlYWYodHJ1ZSlcbiAgICAgICAgLm9wZW5GaWxlKGZpbGUpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZVxuICAgICAgLmdldExlYWYoZmFsc2UpXG4gICAgICAub3BlbkZpbGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBzaG93TW9uc3RlclN0YXRibG9ja1ByZXZpZXcoXG4gICAgbW9uc3RlcjogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwYXRoID0gbW9uc3Rlci5wYXRoO1xuXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiIHx8IHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9XG4gICAgICB0aGlzLnBsdWdpbi5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuXG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNhY2hlID1cbiAgICAgIHRoaXMucGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcblxuICAgIGNvbnN0IGZyb250bWF0dGVyID0gY2FjaGU/LmZyb250bWF0dGVyO1xuXG4gICAgaWYgKCFmcm9udG1hdHRlcikge1xuICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgaGFzIG5vIGZyb250bWF0dGVyLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBwYXJzZUZyb250bWF0dGVyKGZyb250bWF0dGVyKTtcblxuICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MgfHwgIXJlc3VsdC5kYXRhKSB7XG4gICAgICBuZXcgTm90aWNlKFwiQ291bGQgbm90IHBhcnNlIG1vbnN0ZXIuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpZXdFbCA9IGRvY3VtZW50LmJvZHkuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItc3RhdGJsb2NrLXByZXZpZXdcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgaW5uZXJFbCA9IHByZXZpZXdFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zdGF0YmxvY2stcHJldmlldy1pbm5lclwiXG4gICAgfSk7XG5cbiAgICByZW5kZXJNb25zdGVyQmxvY2soXG4gICAgICBpbm5lckVsLFxuICAgICAgcmVzdWx0LmRhdGEsXG4gICAgICBERUZBVUxUX1NUQVRCTE9DS19SRU5ERVJfU0VUVElOR1MsXG4gICAgICByZXN1bHQud2FybmluZ3NcbiAgICApO1xuXG4gICAgY29uc3QgY2xvc2VCdXR0b24gPSBwcmV2aWV3RWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zdGF0YmxvY2stcHJldmlldy1jbG9zZVwiLFxuICAgICAgdGV4dDogXCJcdTAwRDdcIlxuICAgIH0pO1xuXG4gICAgY2xvc2VCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHByZXZpZXdFbC5yZW1vdmUoKTtcbiAgICB9KTtcblxuICAgIHByZXZpZXdFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSBwcmV2aWV3RWwpIHtcbiAgICAgICAgcHJldmlld0VsLnJlbW92ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59IiwgImltcG9ydCB7IFNoYWRvd2RhcmtBdHRhY2ssIFNoYWRvd2RhcmtNb25zdGVyIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxudHlwZSBMb29zZU1vbnN0ZXIgPSBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiAmIHtcbiAgbmFtZT86IHVua25vd247XG4gIGxldmVsPzogdW5rbm93bjtcbiAgYWxpZ25tZW50PzogdW5rbm93bjtcbiAgdHlwZT86IHVua25vd247XG4gIGFjPzogdW5rbm93bjtcbiAgaHA/OiB1bmtub3duO1xuICBtdj86IHVua25vd247XG4gIGF0az86IHVua25vd247XG4gIHN0YXRzPzogdW5rbm93bjtcbiAgc3RyPzogdW5rbm93bjtcbiAgZGV4PzogdW5rbm93bjtcbiAgY29uPzogdW5rbm93bjtcbiAgaW50PzogdW5rbm93bjtcbiAgd2lzPzogdW5rbm93bjtcbiAgY2hhPzogdW5rbm93bjtcbiAgdHJhaXRzPzogdW5rbm93bjtcbiAgc3BlY2lhbHM/OiB1bmtub3duO1xuICBzcGVsbHM/OiB1bmtub3duO1xuICBnZWFyPzogdW5rbm93bjtcbiAgZGVzY3JpcHRpb24/OiB1bmtub3duO1xuICBzb3VyY2U/OiB1bmtub3duO1xuICB0YWdzPzogdW5rbm93bjtcbn07XG5cbmZ1bmN0aW9uIGFzU3RyaW5nKHZhbHVlOiB1bmtub3duLCBmYWxsYmFjayA9IFwiXCIpOiBzdHJpbmcge1xuICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmYWxsYmFjaztcbiAgfVxuXG4gIGlmIChcbiAgICB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgfHxcbiAgICB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgfHxcbiAgICB0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiXG4gICkge1xuICAgIHJldHVybiBTdHJpbmcodmFsdWUpLnRyaW0oKTtcbiAgfVxuXG4gIHJldHVybiBmYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTW9kaWZpZXIodmFsdWU6IHVua25vd24sIGZhbGxiYWNrID0gXCIrMFwiKTogc3RyaW5nIHtcbiAgY29uc3QgcmF3ID0gYXNTdHJpbmcodmFsdWUsIGZhbGxiYWNrKTtcbiAgaWYgKCFyYXcpIHJldHVybiBmYWxsYmFjaztcbiAgaWYgKC9eWystXVxcZCskLy50ZXN0KHJhdykpIHJldHVybiByYXc7XG4gIGlmICgvXlxcZCskLy50ZXN0KHJhdykpIHJldHVybiBgKyR7cmF3fWA7XG4gIGlmICgvXi1cXGQrJC8udGVzdChyYXcpKSByZXR1cm4gcmF3O1xuICByZXR1cm4gcmF3O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTdHJpbmdBcnJheSh2YWx1ZTogdW5rbm93bik6IHN0cmluZ1tdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLm1hcCgoaXRlbSkgPT4gYXNTdHJpbmcoaXRlbSkpLmZpbHRlcihCb29sZWFuKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gdmFsdWVcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG5cbiAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVBdHRhY2soaXRlbTogdW5rbm93bik6IFNoYWRvd2RhcmtBdHRhY2sgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiBpdGVtID09PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IGl0ZW0udHJpbSgpLFxuICAgICAgcmF3OiBpdGVtLnRyaW0oKVxuICAgIH07XG4gIH1cblxuICBpZiAoaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gXCJvYmplY3RcIikge1xuICAgIGNvbnN0IG9iaiA9IGl0ZW0gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgY29uc3QgbmFtZSA9IGFzU3RyaW5nKG9iai5uYW1lKTtcbiAgICBpZiAoIW5hbWUpIHJldHVybiBudWxsO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWUsXG4gICAgICBib251czogYXNTdHJpbmcob2JqLmJvbnVzKSxcbiAgICAgIGRhbWFnZTogYXNTdHJpbmcob2JqLmRhbWFnZSksXG4gICAgICByYW5nZTogYXNTdHJpbmcob2JqLnJhbmdlKSxcbiAgICAgIG5vdGVzOiBhc1N0cmluZyhvYmoubm90ZXMpXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVBdHRhY2tzKHZhbHVlOiB1bmtub3duKTogU2hhZG93ZGFya0F0dGFja1tdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlXG4gICAgICAubWFwKG5vcm1hbGl6ZUF0dGFjaylcbiAgICAgIC5maWx0ZXIoKGEpOiBhIGlzIFNoYWRvd2RhcmtBdHRhY2sgPT4gYSAhPT0gbnVsbCk7XG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHZhbHVlLnRyaW0oKSkge1xuICAgIHJldHVybiBbeyBuYW1lOiB2YWx1ZS50cmltKCksIHJhdzogdmFsdWUudHJpbSgpIH1dO1xuICB9XG5cbiAgcmV0dXJuIFtdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplTW9uc3RlcihcbiAgaW5wdXQ6IExvb3NlTW9uc3RlclxuKTogU2hhZG93ZGFya01vbnN0ZXIge1xuICBjb25zdCBuZXN0ZWRTdGF0cyA9IChpbnB1dC5zdGF0cyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCkgPz8ge307XG5cbiAgY29uc3Qgc3RyVmFsdWUgPSBpbnB1dC5zdHIgPz8gbmVzdGVkU3RhdHMuc3RyO1xuICBjb25zdCBkZXhWYWx1ZSA9IGlucHV0LmRleCA/PyBuZXN0ZWRTdGF0cy5kZXg7XG4gIGNvbnN0IGNvblZhbHVlID0gaW5wdXQuY29uID8/IG5lc3RlZFN0YXRzLmNvbjtcbiAgY29uc3QgaW50VmFsdWUgPSBpbnB1dC5pbnQgPz8gbmVzdGVkU3RhdHMuaW50O1xuICBjb25zdCB3aXNWYWx1ZSA9IGlucHV0LndpcyA/PyBuZXN0ZWRTdGF0cy53aXM7XG4gIGNvbnN0IGNoYVZhbHVlID0gaW5wdXQuY2hhID8/IG5lc3RlZFN0YXRzLmNoYTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IGFzU3RyaW5nKGlucHV0Lm5hbWUsIFwiVW5uYW1lZCBNb25zdGVyXCIpLFxuICAgIGxldmVsOiBhc1N0cmluZyhpbnB1dC5sZXZlbCwgXCI/XCIpLFxuICAgIGFsaWdubWVudDogYXNTdHJpbmcoaW5wdXQuYWxpZ25tZW50LCBcIlwiKSxcbiAgICB0eXBlOiBhc1N0cmluZyhpbnB1dC50eXBlLCBcIlwiKSxcbiAgICBhYzogYXNTdHJpbmcoaW5wdXQuYWMsIFwiP1wiKSxcbiAgICBocDogYXNTdHJpbmcoaW5wdXQuaHAsIFwiP1wiKSxcbiAgICBtdjogYXNTdHJpbmcoaW5wdXQubXYsIFwiXCIpLFxuICAgIGF0azogbm9ybWFsaXplQXR0YWNrcyhpbnB1dC5hdGspLFxuICAgIHN0YXRzOiB7XG4gICAgICBzdHI6IG5vcm1hbGl6ZU1vZGlmaWVyKHN0clZhbHVlLCBcIiswXCIpLFxuICAgICAgZGV4OiBub3JtYWxpemVNb2RpZmllcihkZXhWYWx1ZSwgXCIrMFwiKSxcbiAgICAgIGNvbjogbm9ybWFsaXplTW9kaWZpZXIoY29uVmFsdWUsIFwiKzBcIiksXG4gICAgICBpbnQ6IG5vcm1hbGl6ZU1vZGlmaWVyKGludFZhbHVlLCBcIiswXCIpLFxuICAgICAgd2lzOiBub3JtYWxpemVNb2RpZmllcih3aXNWYWx1ZSwgXCIrMFwiKSxcbiAgICAgIGNoYTogbm9ybWFsaXplTW9kaWZpZXIoY2hhVmFsdWUsIFwiKzBcIilcbiAgICB9LFxuICAgIHRyYWl0czogbm9ybWFsaXplU3RyaW5nQXJyYXkoaW5wdXQudHJhaXRzKSxcbiAgICBzcGVjaWFsczogbm9ybWFsaXplU3RyaW5nQXJyYXkoaW5wdXQuc3BlY2lhbHMpLFxuICAgIHNwZWxsczogbm9ybWFsaXplU3RyaW5nQXJyYXkoaW5wdXQuc3BlbGxzKSxcbiAgICBnZWFyOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC5nZWFyKSxcbiAgICBkZXNjcmlwdGlvbjogYXNTdHJpbmcoaW5wdXQuZGVzY3JpcHRpb24sIFwiXCIpLFxuICAgIHNvdXJjZTogYXNTdHJpbmcoaW5wdXQuc291cmNlLCBcIlwiKSxcbiAgICB0YWdzOiBub3JtYWxpemVTdHJpbmdBcnJheShpbnB1dC50YWdzKVxuICB9O1xufSIsICJpbXBvcnQgeyBQYXJzZVJlc3VsdCwgU2hhZG93ZGFya01vbnN0ZXIgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplTW9uc3RlciB9IGZyb20gXCIuL25vcm1hbGl6ZU1vbnN0ZXJcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRnJvbnRtYXR0ZXIoXG4gIGZyb250bWF0dGVyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuKTogUGFyc2VSZXN1bHQ8U2hhZG93ZGFya01vbnN0ZXI+IHtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcblxuICBpZiAoIWZyb250bWF0dGVyIHx8IHR5cGVvZiBmcm9udG1hdHRlciAhPT0gXCJvYmplY3RcIikge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yczogW1wiTm8gdmFsaWQgZnJvbnRtYXR0ZXIgZm91bmQuXCJdLFxuICAgICAgd2FybmluZ3NcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgbW9uc3RlciA9IG5vcm1hbGl6ZU1vbnN0ZXIoZnJvbnRtYXR0ZXIgYXMgUGFydGlhbDxTaGFkb3dkYXJrTW9uc3Rlcj4pO1xuXG4gIGlmICghbW9uc3Rlci5uYW1lIHx8IG1vbnN0ZXIubmFtZSA9PT0gXCJVbm5hbWVkIE1vbnN0ZXJcIikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJNb25zdGVyIGlzIG1pc3NpbmcgYSBuYW1lLlwiKTtcbiAgfVxuXG4gIGlmICghbW9uc3Rlci5hYyB8fCBtb25zdGVyLmFjID09PSBcIj9cIikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJNb25zdGVyIGlzIG1pc3NpbmcgQUMuXCIpO1xuICB9XG5cbiAgaWYgKCFtb25zdGVyLmhwIHx8IG1vbnN0ZXIuaHAgPT09IFwiP1wiKSB7XG4gICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaXMgbWlzc2luZyBIUC5cIik7XG4gIH1cblxuICBpZiAobW9uc3Rlci5hdGsubGVuZ3RoID09PSAwKSB7XG4gICAgd2FybmluZ3MucHVzaChcIk1vbnN0ZXIgaGFzIG5vIGF0dGFja3MgbGlzdGVkLlwiKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBkYXRhOiBtb25zdGVyLFxuICAgIGVycm9ycyxcbiAgICB3YXJuaW5nc1xuICB9O1xufSIsICJpbXBvcnQgeyBTaGFkb3dkYXJrTW9uc3RlciwgU2hhZG93ZGFya0F0dGFjayB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdzIH0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcblxudHlwZSBNb25zdGVyUmVuZGVyT3B0aW9ucyA9IHtcbiAgb25Sb2xsRGljZT86IChmb3JtdWxhOiBzdHJpbmcpID0+IHZvaWQ7XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVEaXYoY2xhc3NOYW1lPzogc3RyaW5nLCB0ZXh0Pzogc3RyaW5nKTogSFRNTERpdkVsZW1lbnQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgaWYgKHRleHQgIT09IHVuZGVmaW5lZCkgZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNwYW4oY2xhc3NOYW1lPzogc3RyaW5nLCB0ZXh0Pzogc3RyaW5nKTogSFRNTFNwYW5FbGVtZW50IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICBpZiAodGV4dCAhPT0gdW5kZWZpbmVkKSBlbC50ZXh0Q29udGVudCA9IHRleHQ7XG4gIHJldHVybiBlbDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTGlzdChjbGFzc05hbWU/OiBzdHJpbmcpOiBIVE1MVUxpc3RFbGVtZW50IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XG4gIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgcmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMaXN0SXRlbShjbGFzc05hbWU/OiBzdHJpbmcpOiBIVE1MTElFbGVtZW50IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgcmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiByZW5kZXJBdHRhY2tUZXh0KGF0dGFjazogU2hhZG93ZGFya0F0dGFjayk6IHN0cmluZyB7XG4gIGlmIChhdHRhY2sucmF3KSByZXR1cm4gYXR0YWNrLnJhdztcblxuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbYXR0YWNrLm5hbWVdO1xuXG4gIGlmIChhdHRhY2suYm9udXMpIHBhcnRzLnB1c2goYXR0YWNrLmJvbnVzKTtcbiAgaWYgKGF0dGFjay5kYW1hZ2UpIHBhcnRzLnB1c2goYCgke2F0dGFjay5kYW1hZ2V9KWApO1xuICBpZiAoYXR0YWNrLnJhbmdlKSBwYXJ0cy5wdXNoKGBbJHthdHRhY2sucmFuZ2V9XWApO1xuICBpZiAoYXR0YWNrLm5vdGVzKSBwYXJ0cy5wdXNoKGAtICR7YXR0YWNrLm5vdGVzfWApO1xuXG4gIHJldHVybiBwYXJ0cy5qb2luKFwiIFwiKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGdldEFsaWdubWVudExhYmVsKGFsaWdubWVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IGFsaWdubWVudC50cmltKCkudG9VcHBlckNhc2UoKTtcblxuICBzd2l0Y2ggKG5vcm1hbGl6ZWQpIHtcbiAgICBjYXNlIFwiTFwiOlxuICAgICAgcmV0dXJuIFwiTGF3ZnVsXCI7XG4gICAgY2FzZSBcIk5cIjpcbiAgICAgIHJldHVybiBcIk5ldXRyYWxcIjtcbiAgICBjYXNlIFwiQ1wiOlxuICAgICAgcmV0dXJuIFwiQ2hhb3RpY1wiO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG5mdW5jdGlvbiBzcGxpdEF0dGFja0Nvbm5lY3Rvcih0ZXh0OiBzdHJpbmcpOiB7IGNvbm5lY3Rvcjogc3RyaW5nIHwgbnVsbDsgYm9keTogc3RyaW5nIH0ge1xuICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCk7XG4gIGNvbnN0IG1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXihBTkR8T1IpXFxzKyguKykkL2kpO1xuXG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm4geyBjb25uZWN0b3I6IG51bGwsIGJvZHk6IHRyaW1tZWQgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY29ubmVjdG9yOiBtYXRjaFsxXS50b1VwcGVyQ2FzZSgpLFxuICAgIGJvZHk6IG1hdGNoWzJdLnRyaW0oKVxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVEaWNlRm9ybXVsYShmb3JtdWxhOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZm9ybXVsYS5yZXBsYWNlKC9cXHMrL2csIFwiXCIpO1xufVxuXG5mdW5jdGlvbiBhdHRhY2tCb251c1RvRm9ybXVsYShib251czogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IGJvbnVzLnRyaW0oKTtcbiAgcmV0dXJuIGAxZDIwJHtub3JtYWxpemVkfWA7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURpY2VSb2xsQnV0dG9uKFxuICB0ZXh0OiBzdHJpbmcsXG4gIGZvcm11bGE6IHN0cmluZyxcbiAgb25Sb2xsRGljZTogKGZvcm11bGE6IHN0cmluZykgPT4gdm9pZFxuKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidXR0b24udHlwZSA9IFwiYnV0dG9uXCI7XG4gIGJ1dHRvbi5jbGFzc05hbWUgPSBcInNkLW1vbnN0ZXItZGljZS1idXR0b25cIjtcbiAgYnV0dG9uLnRleHRDb250ZW50ID0gdGV4dDtcbiAgYnV0dG9uLnRpdGxlID0gYFJvbGwgJHtmb3JtdWxhfWA7XG5cbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZ0KSA9PiB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIG9uUm9sbERpY2UoZm9ybXVsYSk7XG4gIH0pO1xuXG4gIHJldHVybiBidXR0b247XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEF0dGFja0JvZHlXaXRoRGljZUJ1dHRvbnMoXG4gIHBhcmVudDogSFRNTEVsZW1lbnQsXG4gIGJvZHk6IHN0cmluZyxcbiAgb25Sb2xsRGljZTogKGZvcm11bGE6IHN0cmluZykgPT4gdm9pZFxuKTogdm9pZCB7XG4gIGNvbnN0IGF0dGFja0JvbnVzUmVnZXggPSAvKFsrLV1cXGQrKS87XG4gIGNvbnN0IGRhbWFnZVJlZ2V4ID0gL1xcYihcXGQrZFxcZCsoPzpcXHMqWystXVxccypcXGQrKT8pXFxiL2k7XG5cbiAgY29uc3QgcmVwbGFjZW1lbnRzOiBBcnJheTx7XG4gICAgc3RhcnQ6IG51bWJlcjtcbiAgICBlbmQ6IG51bWJlcjtcbiAgICB0ZXh0OiBzdHJpbmc7XG4gICAgZm9ybXVsYTogc3RyaW5nO1xuICB9PiA9IFtdO1xuXG4gIGNvbnN0IGJvbnVzTWF0Y2ggPSBhdHRhY2tCb251c1JlZ2V4LmV4ZWMoYm9keSk7XG4gIGlmIChib251c01hdGNoPy5pbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgdGV4dCA9IGJvbnVzTWF0Y2hbMV07XG4gICAgcmVwbGFjZW1lbnRzLnB1c2goe1xuICAgICAgc3RhcnQ6IGJvbnVzTWF0Y2guaW5kZXgsXG4gICAgICBlbmQ6IGJvbnVzTWF0Y2guaW5kZXggKyB0ZXh0Lmxlbmd0aCxcbiAgICAgIHRleHQsXG4gICAgICBmb3JtdWxhOiBhdHRhY2tCb251c1RvRm9ybXVsYSh0ZXh0KVxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgZGFtYWdlTWF0Y2ggPSBkYW1hZ2VSZWdleC5leGVjKGJvZHkpO1xuICBpZiAoZGFtYWdlTWF0Y2g/LmluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCB0ZXh0ID0gZGFtYWdlTWF0Y2hbMV07XG4gICAgcmVwbGFjZW1lbnRzLnB1c2goe1xuICAgICAgc3RhcnQ6IGRhbWFnZU1hdGNoLmluZGV4LFxuICAgICAgZW5kOiBkYW1hZ2VNYXRjaC5pbmRleCArIHRleHQubGVuZ3RoLFxuICAgICAgdGV4dCxcbiAgICAgIGZvcm11bGE6IG5vcm1hbGl6ZURpY2VGb3JtdWxhKHRleHQpXG4gICAgfSk7XG4gIH1cblxuICByZXBsYWNlbWVudHMuc29ydCgoYSwgYikgPT4gYS5zdGFydCAtIGIuc3RhcnQpO1xuXG4gIGxldCBjdXJzb3IgPSAwO1xuXG4gIGZvciAoY29uc3QgcmVwbGFjZW1lbnQgb2YgcmVwbGFjZW1lbnRzKSB7XG4gICAgaWYgKHJlcGxhY2VtZW50LnN0YXJ0IDwgY3Vyc29yKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAocmVwbGFjZW1lbnQuc3RhcnQgPiBjdXJzb3IpIHtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShib2R5LnNsaWNlKGN1cnNvciwgcmVwbGFjZW1lbnQuc3RhcnQpKSk7XG4gICAgfVxuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKFxuICAgICAgY3JlYXRlRGljZVJvbGxCdXR0b24ocmVwbGFjZW1lbnQudGV4dCwgcmVwbGFjZW1lbnQuZm9ybXVsYSwgb25Sb2xsRGljZSlcbiAgICApO1xuXG4gICAgY3Vyc29yID0gcmVwbGFjZW1lbnQuZW5kO1xuICB9XG5cbiAgaWYgKGN1cnNvciA8IGJvZHkubGVuZ3RoKSB7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGJvZHkuc2xpY2UoY3Vyc29yKSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFRleHRXaXRoRGFtYWdlRGljZUJ1dHRvbnMoXG4gIHBhcmVudDogSFRNTEVsZW1lbnQsXG4gIHRleHQ6IHN0cmluZyxcbiAgb25Sb2xsRGljZTogKGZvcm11bGE6IHN0cmluZykgPT4gdm9pZFxuKTogdm9pZCB7XG4gIGNvbnN0IGRhbWFnZVJlZ2V4ID0gL1xcYlxcZCtkXFxkKyg/OlxccypbKy1dXFxzKlxcZCspP1xcYi9naTtcblxuICBsZXQgY3Vyc29yID0gMDtcbiAgbGV0IG1hdGNoOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBkYW1hZ2VSZWdleC5leGVjKHRleHQpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGRpY2VUZXh0ID0gbWF0Y2hbMF07XG4gICAgY29uc3Qgc3RhcnQgPSBtYXRjaC5pbmRleDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGRpY2VUZXh0Lmxlbmd0aDtcblxuICAgIGlmIChzdGFydCA+IGN1cnNvcikge1xuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQuc2xpY2UoY3Vyc29yLCBzdGFydCkpKTtcbiAgICB9XG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoXG4gICAgICBjcmVhdGVEaWNlUm9sbEJ1dHRvbihkaWNlVGV4dCwgbm9ybWFsaXplRGljZUZvcm11bGEoZGljZVRleHQpLCBvblJvbGxEaWNlKVxuICAgICk7XG5cbiAgICBjdXJzb3IgPSBlbmQ7XG4gIH1cblxuICBpZiAoY3Vyc29yIDwgdGV4dC5sZW5ndGgpIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dC5zbGljZShjdXJzb3IpKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwZW5kUmVuZGVyZWRBdHRhY2soXG4gIGxpOiBIVE1MTElFbGVtZW50LFxuICBhdHRhY2tUZXh0OiBzdHJpbmcsXG4gIHNldHRpbmdzOiBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdzLFxuICBvcHRpb25zOiBNb25zdGVyUmVuZGVyT3B0aW9uc1xuKTogdm9pZCB7XG4gIGNvbnN0IHsgY29ubmVjdG9yLCBib2R5IH0gPSBzcGxpdEF0dGFja0Nvbm5lY3RvcihhdHRhY2tUZXh0KTtcblxuICBpZiAoY29ubmVjdG9yKSB7XG4gICAgbGkuYXBwZW5kQ2hpbGQoY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItYXR0YWNrLWNvbm5lY3RvclwiLCBgJHtjb25uZWN0b3J9IGApKTtcbiAgfVxuXG4gIGNvbnN0IGF0dGFja1RleHRFbCA9IGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLWF0dGFjay10ZXh0XCIpO1xuXG4gIGlmIChzZXR0aW5ncy5lbmFibGVEaWNlUm9sbGVySW50ZWdyYXRpb24gJiYgb3B0aW9ucy5vblJvbGxEaWNlKSB7XG4gICAgYXBwZW5kQXR0YWNrQm9keVdpdGhEaWNlQnV0dG9ucyhhdHRhY2tUZXh0RWwsIGJvZHksIG9wdGlvbnMub25Sb2xsRGljZSk7XG4gIH0gZWxzZSB7XG4gICAgYXR0YWNrVGV4dEVsLnRleHRDb250ZW50ID0gYm9keTtcbiAgfVxuXG4gIGxpLmFwcGVuZENoaWxkKGF0dGFja1RleHRFbCk7XG59XG5cbmZ1bmN0aW9uIHNwbGl0TGFiZWxBbmRCb2R5KHRleHQ6IHN0cmluZyk6IHsgbGFiZWw6IHN0cmluZzsgYm9keTogc3RyaW5nIH0ge1xuICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiB7IGxhYmVsOiBcIlwiLCBib2R5OiBcIlwiIH07XG4gIH1cblxuICBsZXQgbWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXkgfCBudWxsID0gbnVsbDtcblxuICAvLyAxKSBQYXJlbnRoZXRpY2FsIHNwZWxsLXN0eWxlIGxhYmVsIHVwIHRvIGZpcnN0IHBlcmlvZFxuICAvLyBFeGFtcGxlOiBcIlJheSBvZiBGcm9zdCAoSU5UIDE1KS4gVGFyZ2V0IHRha2VzLi4uXCJcbiAgbWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKC57MSwxMDB9P1xcKFteKV17MSw0MH1cXClcXC4pXFxzKiguKykkLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbDogbWF0Y2hbMV0udHJpbSgpLFxuICAgICAgYm9keTogbWF0Y2hbMl0udHJpbSgpXG4gICAgfTtcbiAgfVxuXG4gIC8vIDIpIFN0YW5kYXJkIHNlbnRlbmNlIGxhYmVsXG4gIC8vIEV4YW1wbGU6IFwiRGV2b3VyLiBVc2UgdHVybiB0byBkZXZvdXIuLi5cIlxuICBtYXRjaCA9IHRyaW1tZWQubWF0Y2goL14oW14uIT86XXsxLDgwfVsuIT9dKVxccyooLispJC8pO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGFiZWw6IG1hdGNoWzFdLnRyaW0oKSxcbiAgICAgIGJvZHk6IG1hdGNoWzJdLnRyaW0oKVxuICAgIH07XG4gIH1cblxuICAvLyAzKSBDb2xvbiBsYWJlbFxuICAvLyBFeGFtcGxlOiBcIkRldm91cjogVXNlIHR1cm4gdG8gZGV2b3VyLi4uXCJcbiAgbWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKFteOl17MSw4MH06KVxccyooLispJC8pO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGFiZWw6IG1hdGNoWzFdLnRyaW0oKSxcbiAgICAgIGJvZHk6IG1hdGNoWzJdLnRyaW0oKVxuICAgIH07XG4gIH1cblxuICAvLyA0KSBEYXNoIC8gZW0gZGFzaCBsYWJlbFxuICAvLyBFeGFtcGxlOiBcIlN0b3JtYmxvb2QgLSBFbGVjdHJpY2l0eSBpbW11bmUuXCJcbiAgLy8gRXhhbXBsZTogXCJTdG9ybWJsb29kIFx1MjAxNCBFbGVjdHJpY2l0eSBpbW11bmUuXCJcbiAgbWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKC57MSw4MH0/XFxzWy1cdTIwMTRdKVxccyooLispJC8pO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGFiZWw6IG1hdGNoWzFdLnRyaW0oKSxcbiAgICAgIGJvZHk6IG1hdGNoWzJdLnRyaW0oKVxuICAgIH07XG4gIH1cblxuICByZXR1cm4geyBsYWJlbDogXCJcIiwgYm9keTogdHJpbW1lZCB9O1xufVxuXG5mdW5jdGlvbiBhZGRTZWN0aW9uKFxuICBwYXJlbnQ6IEhUTUxFbGVtZW50LFxuICB0aXRsZTogc3RyaW5nLFxuICBpdGVtczogc3RyaW5nW10sXG4gIGNsYXNzTmFtZTogc3RyaW5nLFxuICBzZXR0aW5nczogU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyxcbiAgb3B0aW9uczogTW9uc3RlclJlbmRlck9wdGlvbnNcbik6IHZvaWQge1xuICBpZiAoaXRlbXMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgY29uc3Qgc2VjdGlvbiA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvblwiKTtcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb24tdGl0bGVcIiwgdGl0bGUpKTtcblxuICBjb25zdCBsaXN0ID0gY3JlYXRlTGlzdChjbGFzc05hbWUpO1xuXG4gIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgIGNvbnN0IGxpID0gY3JlYXRlTGlzdEl0ZW0oKTtcblxuICAgIGNvbnN0IHsgbGFiZWwsIGJvZHkgfSA9IHNwbGl0TGFiZWxBbmRCb2R5KGl0ZW0pO1xuXG4gICAgaWYgKGxhYmVsKSB7XG4gICAgICBsaS5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci1hYmlsaXR5LWxhYmVsXCIsIGxhYmVsKSk7XG4gICAgfVxuXG4gICAgaWYgKGJvZHkpIHtcbiAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICBsaS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIiBcIikpO1xuICAgICAgfVxuICAgICAgY29uc3QgYm9keUVsID0gY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItYWJpbGl0eS10ZXh0XCIpO1xuXG4gICAgICBpZiAoc2V0dGluZ3MuZW5hYmxlRGljZVJvbGxlckludGVncmF0aW9uICYmIG9wdGlvbnMub25Sb2xsRGljZSkge1xuXG4gICAgICAgIGFwcGVuZFRleHRXaXRoRGFtYWdlRGljZUJ1dHRvbnMoYm9keUVsLCBib2R5LCBvcHRpb25zLm9uUm9sbERpY2UpO1xuXG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIGJvZHlFbC50ZXh0Q29udGVudCA9IGJvZHk7XG5cbiAgICAgIH1cblxuICAgICAgbGkuYXBwZW5kQ2hpbGQoYm9keUVsKTtcbiAgICB9XG5cbiAgICBpZiAoIWxhYmVsKSB7XG4gICAgICBpZiAoc2V0dGluZ3MuZW5hYmxlRGljZVJvbGxlckludGVncmF0aW9uICYmIG9wdGlvbnMub25Sb2xsRGljZSkge1xuICAgICAgICBhcHBlbmRUZXh0V2l0aERhbWFnZURpY2VCdXR0b25zKGxpLCBpdGVtLCBvcHRpb25zLm9uUm9sbERpY2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGkudGV4dENvbnRlbnQgPSBpdGVtO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxpc3QuYXBwZW5kQ2hpbGQobGkpO1xuICB9XG5cbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChsaXN0KTtcbiAgcGFyZW50LmFwcGVuZENoaWxkKHNlY3Rpb24pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyTW9uc3RlckJsb2NrKFxuICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICBtb25zdGVyOiBTaGFkb3dkYXJrTW9uc3RlcixcbiAgc2V0dGluZ3M6IFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3MsXG4gIHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdLFxuICBvcHRpb25zOiBNb25zdGVyUmVuZGVyT3B0aW9ucyA9IHt9XG4pOiB2b2lkIHtcbiAgY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XG5cbiAgY29uc3QgY2FyZCA9IGNyZWF0ZURpdihcbiAgICBbXG4gICAgICBcInNkLW1vbnN0ZXItY2FyZFwiLFxuICAgICAgc2V0dGluZ3MuY29tcGFjdE1vZGUgPyBcImlzLWNvbXBhY3RcIiA6IFwiXCJcbiAgICBdXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAuam9pbihcIiBcIilcbiAgKTtcblxuICBjb25zdCBoZWFkZXIgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWhlYWRlclwiKTtcbiAgaGVhZGVyLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItbmFtZVwiLCBtb25zdGVyLm5hbWUpKTtcblxuICBjb25zdCBtZXRhID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1tZXRhXCIpO1xuICBjb25zdCBtZXRhUGFydHM6IEhUTUxFbGVtZW50W10gPSBbXTtcblxuICBpZiAobW9uc3Rlci5sZXZlbCkge1xuICAgIG1ldGFQYXJ0cy5wdXNoKGNyZWF0ZVNwYW4odW5kZWZpbmVkLCBgTGV2ZWwgJHttb25zdGVyLmxldmVsfWApKTtcbiAgfVxuXG4gIGlmIChtb25zdGVyLmFsaWdubWVudCkge1xuICAgIGNvbnN0IGFsaWdubWVudFNwYW4gPSBjcmVhdGVTcGFuKHVuZGVmaW5lZCwgYEFMICR7bW9uc3Rlci5hbGlnbm1lbnR9YCk7XG4gICAgY29uc3QgdG9vbHRpcCA9IGdldEFsaWdubWVudExhYmVsKG1vbnN0ZXIuYWxpZ25tZW50KTtcbiAgICBpZiAodG9vbHRpcCkge1xuICAgICAgYWxpZ25tZW50U3Bhbi50aXRsZSA9IHRvb2x0aXA7XG4gICAgfVxuICAgIG1ldGFQYXJ0cy5wdXNoKGFsaWdubWVudFNwYW4pO1xuICB9XG5cbiAgbWV0YVBhcnRzLmZvckVhY2goKHBhcnQsIGluZGV4KSA9PiB7XG4gICAgbWV0YS5hcHBlbmRDaGlsZChwYXJ0KTtcblxuICAgIGlmIChpbmRleCA8IG1ldGFQYXJ0cy5sZW5ndGggLSAxKSB7XG4gICAgICBtZXRhLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4odW5kZWZpbmVkLCBcIiBcdTIwMjIgXCIpKTtcbiAgICB9XG4gIH0pO1xuXG4gIGhlYWRlci5hcHBlbmRDaGlsZChtZXRhKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG4gIGNvbnN0IGNvcmUgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWNvcmVcIik7XG4gIGNvcmUuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1jb3JlLWl0ZW1cIiwgYEFDICR7bW9uc3Rlci5hY31gKSk7XG4gIGNvcmUuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1jb3JlLWl0ZW1cIiwgYEhQICR7bW9uc3Rlci5ocH1gKSk7XG5cbiAgaWYgKG1vbnN0ZXIubXYpIHtcbiAgICBjb3JlLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItY29yZS1pdGVtXCIsIGBNViAke21vbnN0ZXIubXZ9YCkpO1xuICB9XG5cbiAgY2FyZC5hcHBlbmRDaGlsZChjb3JlKTtcblxuICBpZiAobW9uc3Rlci5hdGsubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGF0a1NlY3Rpb24gPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb25cIik7XG4gICAgYXRrU2VjdGlvbi5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb24tdGl0bGVcIiwgXCJBVFRBQ0tTXCIpKTtcblxuICAgIGNvbnN0IGF0a0xpc3QgPSBjcmVhdGVMaXN0KFwic2QtbW9uc3Rlci1hdHRhY2tzXCIpO1xuICAgIGZvciAoY29uc3QgYXR0YWNrIG9mIG1vbnN0ZXIuYXRrKSB7XG4gICAgICBjb25zdCBsaSA9IGNyZWF0ZUxpc3RJdGVtKFwic2QtbW9uc3Rlci1hdHRhY2tcIik7XG4gICAgICBhcHBlbmRSZW5kZXJlZEF0dGFjayhsaSwgcmVuZGVyQXR0YWNrVGV4dChhdHRhY2spLCBzZXR0aW5ncywgb3B0aW9ucyk7XG4gICAgICBhdGtMaXN0LmFwcGVuZENoaWxkKGxpKTtcbiAgICB9XG5cbiAgICBhdGtTZWN0aW9uLmFwcGVuZENoaWxkKGF0a0xpc3QpO1xuICAgIGNhcmQuYXBwZW5kQ2hpbGQoYXRrU2VjdGlvbik7XG4gIH1cblxuICBjb25zdCBhYmlsaXRpZXMgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb25cIik7XG4gIGFiaWxpdGllcy5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb24tdGl0bGVcIiwgXCJBQklMSVRJRVNcIikpO1xuXG4gIGNvbnN0IGdyaWQgPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdGllc1wiKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYFNUUiAke21vbnN0ZXIuc3RhdHMuc3RyfWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYERFWCAke21vbnN0ZXIuc3RhdHMuZGV4fWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYENPTiAke21vbnN0ZXIuc3RhdHMuY29ufWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYElOVCAke21vbnN0ZXIuc3RhdHMuaW50fWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYFdJUyAke21vbnN0ZXIuc3RhdHMud2lzfWApKTtcbiAgZ3JpZC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWFiaWxpdHlcIiwgYENIQSAke21vbnN0ZXIuc3RhdHMuY2hhfWApKTtcblxuICBhYmlsaXRpZXMuYXBwZW5kQ2hpbGQoZ3JpZCk7XG4gIGNhcmQuYXBwZW5kQ2hpbGQoYWJpbGl0aWVzKTtcblxuICBhZGRTZWN0aW9uKGNhcmQsIFwiVFJBSVRTXCIsIG1vbnN0ZXIudHJhaXRzLCBcInNkLW1vbnN0ZXItbGlzdFwiLCBzZXR0aW5ncywgb3B0aW9ucyk7XG4gIGFkZFNlY3Rpb24oY2FyZCwgXCJTUEVDSUFMU1wiLCBtb25zdGVyLnNwZWNpYWxzLCBcInNkLW1vbnN0ZXItbGlzdFwiLCBzZXR0aW5ncywgb3B0aW9ucyk7XG4gIGFkZFNlY3Rpb24oY2FyZCwgXCJTUEVMTFNcIiwgbW9uc3Rlci5zcGVsbHMsIFwic2QtbW9uc3Rlci1saXN0XCIsIHNldHRpbmdzLCBvcHRpb25zKTtcbiAgYWRkU2VjdGlvbihjYXJkLCBcIkdFQVJcIiwgbW9uc3Rlci5nZWFyLCBcInNkLW1vbnN0ZXItbGlzdFwiLCBzZXR0aW5ncywgb3B0aW9ucyk7XG5cbiAgaWYgKG1vbnN0ZXIuZGVzY3JpcHRpb24pIHtcbiAgICBjb25zdCBkZXNjID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uXCIpO1xuICAgIGRlc2MuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1kZXNjcmlwdGlvblwiLCBtb25zdGVyLmRlc2NyaXB0aW9uKSk7XG4gICAgY2FyZC5hcHBlbmRDaGlsZChkZXNjKTtcbiAgfVxuXG4gIGlmIChzZXR0aW5ncy5zaG93U291cmNlICYmIG1vbnN0ZXIuc291cmNlKSB7XG4gICAgY29uc3Qgc291cmNlID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1mb290ZXJcIik7XG4gICAgc291cmNlLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLXNvdXJjZVwiLCBgU291cmNlOiAke21vbnN0ZXIuc291cmNlfWApKTtcbiAgICBjYXJkLmFwcGVuZENoaWxkKHNvdXJjZSk7XG4gIH1cblxuICBpZiAoc2V0dGluZ3Muc2hvd1RhZ3MgJiYgbW9uc3Rlci50YWdzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCB0YWdzID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci10YWdzXCIpO1xuICAgIGZvciAoY29uc3QgdGFnIG9mIG1vbnN0ZXIudGFncykge1xuICAgICAgdGFncy5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci10YWdcIiwgdGFnKSk7XG4gICAgfVxuICAgIGNhcmQuYXBwZW5kQ2hpbGQodGFncyk7XG4gIH1cblxuICBpZiAod2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHdhcm5pbmdCb3ggPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXdhcm5pbmctYm94XCIpO1xuICAgIGZvciAoY29uc3Qgd2FybmluZyBvZiB3YXJuaW5ncykge1xuICAgICAgd2FybmluZ0JveC5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXdhcm5pbmdcIiwgd2FybmluZykpO1xuICAgIH1cbiAgICBjYXJkLmFwcGVuZENoaWxkKHdhcm5pbmdCb3gpO1xuICB9XG5cbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNhcmQpO1xufSIsICJleHBvcnQgaW50ZXJmYWNlIFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3Mge1xuICBjb21wYWN0TW9kZTogYm9vbGVhbjtcbiAgc2hvd1NvdXJjZTogYm9vbGVhbjtcbiAgc2hvd1RhZ3M6IGJvb2xlYW47XG4gIGVuYWJsZURpY2VSb2xsZXJJbnRlZ3JhdGlvbjogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU1RBVEJMT0NLX1JFTkRFUl9TRVRUSU5HUzogU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyA9IHtcbiAgY29tcGFjdE1vZGU6IHRydWUsXG4gIHNob3dTb3VyY2U6IHRydWUsXG4gIHNob3dUYWdzOiB0cnVlLFxuICBlbmFibGVEaWNlUm9sbGVySW50ZWdyYXRpb246IGZhbHNlXG59OyJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQUErQjs7O0FDSXhCLElBQU0sZUFBZTs7O0FDQXJCLElBQU0sZUFBTixNQUFtQjtBQUFBLEVBR3hCLFlBQVksS0FBVTtBQUNwQixTQUFLLE1BQU07QUFBQSxFQUNiO0FBQUEsRUFFQSxlQUFlLE9BQWlDO0FBQzlDLFVBQU0sUUFBUSxNQUFNLFlBQVksRUFBRSxLQUFLO0FBRXZDLFFBQUksQ0FBQyxPQUFPO0FBQ1IsYUFBTyxLQUFLLGVBQWU7QUFBQSxJQUMvQjtBQUVBLFdBQU8sS0FBSyxlQUFlLEVBQUU7QUFBQSxNQUFPLENBQUMsWUFDakMsUUFBUSxLQUFLLFlBQVksRUFBRSxTQUFTLEtBQUs7QUFBQSxJQUM3QztBQUFBLEVBQ0o7QUFBQSxFQUVFLGlCQUFtQztBQUNqQyxVQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0saUJBQWlCO0FBRTlDLFVBQU0sV0FBNkIsQ0FBQztBQUVwQyxlQUFXLFFBQVEsT0FBTztBQUN4QixZQUFNLFVBQVUsS0FBSyxtQkFBbUIsSUFBSTtBQUU1QyxVQUFJLFNBQVM7QUFDWCxpQkFBUyxLQUFLLE9BQU87QUFBQSxNQUN2QjtBQUFBLElBQ0Y7QUFFQSxXQUFPLFNBQVM7QUFBQSxNQUFLLENBQUMsR0FBRyxNQUN2QixFQUFFLEtBQUssY0FBYyxFQUFFLElBQUk7QUFBQSxJQUM3QjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLG1CQUFtQixNQUFvQztBQXpDekQ7QUEwQ0ksVUFBTSxRQUNKLEtBQUssSUFBSSxjQUFjLGFBQWEsSUFBSTtBQUUxQyxVQUFNLGNBQWMsK0JBQU87QUFFM0IsUUFBSSxDQUFDLGFBQWE7QUFDaEIsYUFBTztBQUFBLElBQ1Q7QUFFQSxRQUFJLFlBQVksbUJBQW1CLGNBQWM7QUFDL0MsYUFBTztBQUFBLElBQ1Q7QUFFQSxXQUFPO0FBQUEsTUFDTCxNQUFNLFlBQVksUUFBUSxLQUFLO0FBQUEsTUFDL0IsTUFBTSxLQUFLO0FBQUEsTUFFWCxPQUFPLFlBQVk7QUFBQSxNQUNuQixJQUFJLFlBQVk7QUFBQSxNQUNoQixJQUFJLFlBQVk7QUFBQSxNQUNoQixNQUFLLGlCQUFZLFFBQVosYUFBbUIsaUJBQVksVUFBWixtQkFBbUI7QUFBQSxNQUUzQyxLQUFLLE1BQU0sUUFBUSxZQUFZLEdBQUcsSUFDOUIsWUFBWSxJQUFJLENBQUMsSUFDakIsWUFBWTtBQUFBLE1BRWhCLFFBQVEsTUFBTSxRQUFRLFlBQVksTUFBTSxJQUNwQyxZQUFZLE9BQU8sTUFBTSxHQUFHLENBQUMsSUFDN0IsQ0FBQztBQUFBLE1BRUwsTUFBTSxZQUFZLFFBQVEsQ0FBQztBQUFBLElBQzdCO0FBQUEsRUFDRjtBQUNGOzs7QUMzRUEsc0JBQW1EOzs7QUNFbkQsU0FBUyxXQUFXLE9BQTRDO0FBQzlELFNBQU8sS0FBSyxVQUFVLHdCQUFTLEVBQUU7QUFDbkM7QUFFQSxTQUFTLFFBQVEsT0FBZSxTQUEwQjtBQUN4RCxTQUFPLE1BQU0sS0FBSztBQUFBO0FBQUEsR0FFbEIsbUNBQVMsV0FBVSxFQUFFO0FBQUE7QUFFdkI7QUFFQSxTQUFTLFVBQWtCO0FBQ3pCLFNBQU8sS0FBSyxNQUFNLEtBQUssT0FBTyxJQUFJLEVBQUUsSUFBSTtBQUMxQztBQUVBLFNBQVMsY0FBYyxPQUF3QjtBQUM3QyxRQUFNLFNBQVMsT0FBTyxLQUFLO0FBQzNCLFNBQU8sT0FBTyxTQUFTLE1BQU0sSUFBSSxTQUFTO0FBQzVDO0FBRUEsU0FBUyxxQkFBcUIsV0FBa0M7QUFDOUQsU0FBTyxVQUFVLFNBQVMsT0FBTyxDQUFDLFNBQVMsWUFBWTtBQUNyRCxVQUFNLE1BQU0sY0FBYyxRQUFRLEdBQUc7QUFFckMsV0FBTyxLQUFLLElBQUksU0FBUyxHQUFHO0FBQUEsRUFDOUIsR0FBRyxDQUFDO0FBQ047QUFFQSxTQUFTLDBCQUNQLFdBQ3dDO0FBaEMxQztBQWlDRSxRQUFNLFFBQU8sZUFBVSxtQkFBVixZQUE0QjtBQUV6QyxNQUFJLFNBQVMsUUFBUTtBQUNuQixXQUFPLENBQUM7QUFBQSxFQUNWO0FBRUEsTUFBSSxTQUFTLGtCQUFrQjtBQUM3QixVQUFNLGFBQWEscUJBQXFCLFNBQVM7QUFFakQsV0FBTztBQUFBLE1BQ0w7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLFlBQVksUUFBUSxJQUFJO0FBQUEsTUFDMUI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUVBLFFBQU0sVUFBa0QsQ0FBQztBQUV6RCxhQUFXLFdBQVcsVUFBVSxVQUFVO0FBQ3hDLFVBQU0sTUFBTSxLQUFLLElBQUksR0FBRyxRQUFPLGFBQVEsUUFBUixZQUFlLENBQUMsQ0FBQztBQUNoRCxVQUFNLFNBQVMsY0FBYyxRQUFRLEdBQUc7QUFFeEMsYUFBUyxJQUFJLEdBQUcsS0FBSyxLQUFLLEtBQUs7QUFDN0IsY0FBUSxLQUFLO0FBQUEsUUFDWCxNQUFNLE1BQU0sSUFBSSxHQUFHLFFBQVEsSUFBSSxJQUFJLENBQUMsS0FBSyxRQUFRO0FBQUEsUUFDakQsWUFBWSxRQUFRLElBQUk7QUFBQSxNQUMxQixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFFQSxTQUFPLFFBQVEsS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLGFBQWEsRUFBRSxVQUFVO0FBQzNEO0FBRU8sU0FBUywwQkFDZCxXQUNRO0FBckVWO0FBc0VFLFFBQU0sb0JBQW9CLDBCQUEwQixTQUFTO0FBRTdELFFBQU0sd0JBQXdCLGtCQUMzQixJQUFJLENBQUMsVUFBVSxhQUFhLFdBQVcsTUFBTSxJQUFJLENBQUM7QUFBQSxrQkFDckMsTUFBTSxVQUFVLEVBQUUsRUFDL0IsS0FBSyxJQUFJO0FBRVosUUFBTSxxQkFBcUIsVUFBVSxTQUNsQyxJQUFJLENBQUMsWUFBWSxhQUFhLFdBQVcsUUFBUSxJQUFJLENBQUM7QUFBQSxXQUNoRCxRQUFRLEdBQUc7QUFBQSxZQUNWLFdBQVcsUUFBUSxJQUFJLENBQUM7QUFBQSxhQUN2QixXQUFXLFFBQVEsS0FBSyxDQUFDO0FBQUEsVUFDNUIsV0FBVyxRQUFRLEVBQUUsQ0FBQztBQUFBLFVBQ3RCLFdBQVcsUUFBUSxFQUFFLENBQUM7QUFBQSxXQUNyQixXQUFXLFFBQVEsR0FBRyxDQUFDLEVBQUUsRUFDL0IsS0FBSyxJQUFJO0FBRVosU0FBTztBQUFBO0FBQUEsUUFFRCxXQUFXLFVBQVUsSUFBSSxDQUFDO0FBQUE7QUFBQTtBQUFBLGVBR3BCLGVBQVUsZUFBVixZQUF3QixDQUFDO0FBQUEsY0FDMUIsZUFBVSxjQUFWLFlBQXVCLENBQUM7QUFBQTtBQUFBLFdBRTFCLFdBQVcsVUFBVSxPQUFPLENBQUM7QUFBQSxTQUMvQixXQUFXLFVBQVUsS0FBSyxDQUFDO0FBQUE7QUFBQTtBQUFBLEVBR2xDLHNCQUFzQixNQUFNO0FBQUE7QUFBQSxtQkFFWixlQUFVLG1CQUFWLFlBQTRCLHFCQUFxQjtBQUFBO0FBQUEsRUFFakUseUJBQXlCLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNL0IsUUFBUSxTQUFTLFVBQVUsS0FBSyxDQUFDO0FBQUEsRUFDakMsUUFBUSxjQUFjLFVBQVUsU0FBUyxDQUFDO0FBQUEsRUFDMUMsUUFBUSxXQUFXLFVBQVUsT0FBTyxDQUFDO0FBQUEsRUFDckMsUUFBUSxZQUFZLFVBQVUsUUFBUSxDQUFDO0FBQUEsRUFDdkMsUUFBUSxTQUFTLFVBQVUsS0FBSyxDQUFDO0FBQUE7QUFFbkM7OztBRDlHTyxJQUFNLG1CQUFOLE1BQXVCO0FBQUEsRUFHNUIsWUFBWSxLQUFVO0FBQ3BCLFNBQUssTUFBTTtBQUFBLEVBQ2I7QUFBQSxFQUVBLE1BQU0sb0JBQW9CLFdBQTBCO0FBQ2xELFVBQU0sVUFBVSwwQkFBMEIsU0FBUztBQUVuRCxVQUFNLFdBQVcsVUFBVSxLQUN4QixRQUFRLGlCQUFpQixFQUFFLEVBQzNCLEtBQUs7QUFFUixVQUFNLGFBQWE7QUFDbkIsVUFBTSxlQUFXLCtCQUFjLEdBQUcsVUFBVSxJQUFJLFFBQVEsS0FBSztBQUU3RCxVQUFNLEtBQUssYUFBYSxVQUFVO0FBRWxDLFVBQU0sT0FBTyxNQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sVUFBVSxPQUFPO0FBRTFELFVBQU0sS0FBSyxJQUFJLFVBQVUsUUFBUSxJQUFJLEVBQUUsU0FBUyxJQUFJO0FBRXBELFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLGFBQWEsTUFBNkI7QUFDOUMsVUFBTSxXQUFXLEtBQUssSUFBSSxNQUFNLHNCQUFzQixJQUFJO0FBRTFELFFBQUksb0JBQW9CLHlCQUFTO0FBQy9CO0FBQUEsSUFDRjtBQUVBLFVBQU0sS0FBSyxJQUFJLE1BQU0sYUFBYSxJQUFJO0FBQUEsRUFDeEM7QUFBQSxFQUVBLE1BQU0sb0JBQ0osTUFDQSxXQUNlO0FBQ2YsVUFBTSxVQUFVLDBCQUEwQixTQUFTO0FBRW5ELFVBQU0sS0FBSyxJQUFJLE1BQU0sT0FBTyxNQUFNLE9BQU87QUFBQSxFQUMzQztBQUVGOzs7QUVsREEsSUFBQUMsbUJBQXdEOzs7QUNBeEQsSUFBQUMsbUJBQXlDO0FBSWxDLFNBQVMsbUJBQ2QsS0FDQSxPQUNBLFNBQ007QUFSUjtBQVVFLFFBQU0sT0FBTyxJQUFJLHNCQUFLO0FBRXRCLE9BQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsU0FDSyxTQUFTLFFBQVEsSUFBSSxFQUNyQixRQUFRLFlBQVk7QUFDckIsWUFBTSxPQUFPLElBQUksTUFBTSxzQkFBc0IsUUFBUSxJQUFJO0FBRXpELFVBQUksRUFBRSxnQkFBZ0IseUJBQVE7QUFDNUIsWUFBSSx3QkFBTyx5QkFBeUI7QUFDcEM7QUFBQSxNQUNGO0FBRUEsWUFBTSxJQUFJLFVBQVUsUUFBUSxJQUFJLEVBQUUsU0FBUyxJQUFJO0FBQUEsSUFDbEQsQ0FBQztBQUFBLEVBQ0osQ0FBQztBQUVELE9BQUssYUFBYTtBQUVsQixPQUFLLFFBQVEsQ0FBQyxTQUFTO0FBQ3JCLFNBQUs7QUFBQSxNQUNIO0FBQUEsUUFDRSxRQUFRLFFBQVEsTUFBTSxRQUFRLEtBQUssS0FBSztBQUFBLFFBQ3hDLFFBQVEsS0FBSyxNQUFNLFFBQVEsRUFBRSxLQUFLO0FBQUEsUUFDbEMsUUFBUSxLQUFLLE1BQU0sUUFBUSxFQUFFLEtBQUs7QUFBQSxNQUNwQyxFQUNHLE9BQU8sT0FBTyxFQUNkLEtBQUssVUFBSztBQUFBLElBQ2Y7QUFFQSxTQUFLLFlBQVksSUFBSTtBQUFBLEVBQ3ZCLENBQUM7QUFFRCxNQUFJLFFBQVEsS0FBSztBQUNmLFNBQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsV0FBSyxTQUFTLFFBQVEsUUFBUSxHQUFHLEVBQUU7QUFDbkMsV0FBSyxZQUFZLElBQUk7QUFBQSxJQUN2QixDQUFDO0FBQUEsRUFDSDtBQUVBLGFBQVcsVUFBUyxhQUFRLFdBQVIsWUFBa0IsQ0FBQyxHQUFHO0FBQ3hDLFNBQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsV0FBSyxTQUFTLEtBQUs7QUFDbkIsV0FBSyxZQUFZLElBQUk7QUFBQSxJQUN2QixDQUFDO0FBQUEsRUFDSDtBQUVBLE9BQUssYUFBYTtBQUVsQixPQUFLLFFBQVEsQ0FBQyxTQUFTO0FBQ3JCLFNBQ0csU0FBUyxtQkFBbUIsRUFDNUIsUUFBUSxNQUFNO0FBQ2IsZ0JBQVUsVUFBVSxVQUFVLFFBQVEsSUFBSTtBQUUxQyxVQUFJLHdCQUFPLHNCQUFzQjtBQUFBLElBQ25DLENBQUM7QUFBQSxFQUNMLENBQUM7QUFFRCxPQUFLLFFBQVEsQ0FBQyxTQUFTO0FBQ3JCLFNBQ0csU0FBUyxpQkFBaUIsRUFDMUIsUUFBUSxZQUFZO0FBQ25CLFlBQU0sT0FBTyxJQUFJLE1BQU0sc0JBQXNCLFFBQVEsSUFBSTtBQUN6RCxVQUFJLEVBQUUsZ0JBQWdCLHlCQUFRO0FBQzVCLFlBQUksd0JBQU8seUJBQXlCO0FBQ3BDO0FBQUEsTUFDRjtBQUVBLFlBQU0sSUFBSSxVQUFVLFFBQVEsSUFBSSxFQUFFLFNBQVMsSUFBSTtBQUFBLElBQ2pELENBQUM7QUFBQSxFQUNMLENBQUM7QUFFRCxPQUFLLFFBQVEsQ0FBQyxTQUFTO0FBQ3JCLFNBQ0csU0FBUyxtQkFBbUIsRUFDNUIsUUFBUSxZQUFZO0FBRW5CLFlBQU0sT0FDSixJQUFJLE1BQU0sc0JBQXNCLFFBQVEsSUFBSTtBQUU5QyxVQUFJLEVBQUUsZ0JBQWdCLHlCQUFRO0FBQzVCLFlBQUksd0JBQU8seUJBQXlCO0FBQ3BDO0FBQUEsTUFDRjtBQUVBLFlBQU0sT0FDSixJQUFJLFVBQVUsUUFBUSxTQUFTLFVBQVU7QUFFM0MsWUFBTSxLQUFLLFNBQVMsSUFBSTtBQUFBLElBQzFCLENBQUM7QUFBQSxFQUNMLENBQUM7QUFFRCxPQUFLLGlCQUFpQixLQUFLO0FBQzdCOzs7QUR4Rk8sSUFBTSx1QkFBTixjQUFtQyx1QkFBTTtBQUFBLEVBb0M5QyxZQUNFLEtBQ0EsY0FDQSxrQkFDQSxZQUNBLE9BQTJCLGFBQWEsU0FBUyxVQUNqRDtBQUNBLFVBQU0sR0FBRztBQXZDWCx1QkFBbUM7QUFFbkMseUJBQWdCO0FBQ2hCLDRCQUF1QyxDQUFDO0FBRXhDLHlCQUFnQjtBQUNoQix1QkFBYztBQUNkLHFCQUFZO0FBQ1osb0JBQVc7QUFFWCxzQkFBYTtBQUNiLHFCQUFZO0FBRVosMEJBQTBDO0FBRTFDLGlCQUFRO0FBQ1IscUJBQVk7QUFDWixtQkFBVTtBQUNWLG9CQUFXO0FBQ1gsaUJBQVE7QUFHUixTQUFRLE9BQTJCO0FBbUJqQyxTQUFLLGVBQWU7QUFDcEIsU0FBSyxtQkFBbUI7QUFDeEIsU0FBSyxhQUFhO0FBQ2xCLFNBQUssT0FBTztBQUFBLEVBQ2Q7QUFBQSxFQXJCQSxJQUFZLFlBQXFCO0FBQy9CLFdBQU8sS0FBSyxTQUFTO0FBQUEsRUFDdkI7QUFBQSxFQUVBLElBQVksZ0JBQXlCO0FBQ25DLFdBQU8sS0FBSyxTQUFTO0FBQUEsRUFDdkI7QUFBQSxFQWlCQSxNQUFNLFNBQXdCO0FBQzVCLFNBQUssUUFBUSxTQUFTLG9CQUFvQjtBQUUxQyxRQUFJLEtBQUssWUFBWTtBQUNuQixZQUFNLEtBQUssc0JBQXNCLEtBQUssVUFBVTtBQUFBLElBQ2xEO0FBRUEsU0FBSyxPQUFPO0FBQUEsRUFDZDtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxTQUFLLFVBQVUsTUFBTTtBQUFBLEVBQ3ZCO0FBQUEsRUFFQSxTQUFlO0FBQ2IsVUFBTSxFQUFFLFVBQVUsSUFBSTtBQUV0QixjQUFVLE1BQU07QUFFaEIsY0FBVSxTQUFTLE1BQU07QUFBQSxNQUN2QixNQUFNLEtBQUssWUFDUCw4QkFDQSxLQUFLLGdCQUNILG1DQUNBO0FBQUEsSUFDUixDQUFDO0FBRUQsU0FBSyxvQkFBb0IsU0FBUztBQUVsQyxRQUFJLEtBQUssZ0JBQWdCLFlBQVk7QUFDbkMsV0FBSyxrQkFBa0IsU0FBUztBQUNoQztBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUssZ0JBQWdCLFdBQVc7QUFDbEMsV0FBSyxrQkFBa0IsU0FBUztBQUNoQztBQUFBLElBQ0Y7QUFFQSxTQUFLLGtCQUFrQixTQUFTO0FBQUEsRUFDbEM7QUFBQSxFQUVBLG9CQUFvQixhQUFnQztBQUNsRCxnQkFBWSxTQUFTLEtBQUs7QUFBQSxNQUN4QixLQUFLO0FBQUEsTUFDTCxNQUNFLEtBQUssZ0JBQWdCLGFBQ2pCLDhCQUNBLEtBQUssZ0JBQWdCLFlBQ25CLDZCQUNBO0FBQUEsSUFDVixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsa0JBQWtCLFdBQThCO0FBQzlDLFVBQU0sVUFBVSxVQUFVLFVBQVU7QUFBQSxNQUNsQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsVUFBTSxZQUFZLFFBQVEsVUFBVTtBQUFBLE1BQ2xDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxjQUFVLFNBQVMsU0FBUztBQUFBLE1BQzFCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLFlBQVksVUFBVSxTQUFTLFNBQVM7QUFBQSxNQUM1QyxNQUFNO0FBQUEsTUFDTixhQUFhO0FBQUEsSUFDZixDQUFDO0FBRUQsY0FBVSxRQUFRLEtBQUs7QUFFdkIsY0FBVSxpQkFBaUIsU0FBUyxNQUFNO0FBQ3hDLFdBQUssZ0JBQWdCLFVBQVU7QUFBQSxJQUNqQyxDQUFDO0FBRUQsVUFBTSxZQUFZLFVBQVUsVUFBVTtBQUFBLE1BQ3BDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxVQUFNLFlBQVksVUFBVSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFVBQU0sVUFBVSxVQUFVLFVBQVU7QUFBQSxNQUNsQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsY0FBVSxTQUFTLE1BQU07QUFBQSxNQUN2QixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsU0FBSyxnQkFBZ0IsU0FBUztBQUU5QixVQUFNLFlBQVksVUFBVSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGNBQVUsUUFBUSxPQUFPO0FBRXpCLFlBQVEsU0FBUyxNQUFNO0FBQUEsTUFDckIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sYUFBYSxRQUFRLFVBQVU7QUFBQSxNQUNuQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsZUFBVyxRQUFRLE9BQU87QUFFMUIsVUFBTSxZQUFZLFFBQVEsVUFBVTtBQUFBLE1BQ2xDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxjQUFVLFFBQVEsT0FBTztBQUV6QixVQUFNLFdBQVcsUUFBUSxVQUFVO0FBQUEsTUFDakMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFNBQUssb0JBQW9CLFVBQVU7QUFBQSxNQUNqQztBQUFBLFFBQ0UsT0FBTztBQUFBLFFBQ1AsS0FBSztBQUFBLFFBQ0wsU0FBUyxNQUFNO0FBQ2IsY0FBSSxDQUFDLEtBQUssY0FBYyxLQUFLLEdBQUc7QUFDOUIsZ0JBQUksd0JBQU8sNkJBQTZCO0FBQ3hDO0FBQUEsVUFDRjtBQUVBLGVBQUssY0FBYztBQUNuQixlQUFLLE9BQU87QUFBQSxRQUNkO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUVELFNBQUsscUJBQXFCO0FBQzFCLFNBQUssdUJBQXVCO0FBQzVCLFNBQUssdUJBQXVCO0FBQUEsRUFDOUI7QUFBQSxFQUVBLGdCQUFnQixXQUE4QjtBQUM1QyxVQUFNLFlBQVksVUFBVSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFVBQU0sY0FBYyxVQUFVLFVBQVU7QUFBQSxNQUN0QyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsZ0JBQVksU0FBUyxTQUFTO0FBQUEsTUFDNUIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sY0FBYyxZQUFZLFNBQVMsU0FBUztBQUFBLE1BQ2hELE1BQU07QUFBQSxNQUNOLGFBQWE7QUFBQSxJQUNmLENBQUM7QUFFRCxnQkFBWSxRQUFRLEtBQUs7QUFFekIsZ0JBQVksaUJBQWlCLFNBQVMsTUFBTTtBQUMxQyxXQUFLLGdCQUFnQixZQUFZO0FBQ2pDLFdBQUsscUJBQXFCO0FBQUEsSUFDNUIsQ0FBQztBQUVELFVBQU0sYUFBYSxVQUFVLFVBQVU7QUFBQSxNQUNyQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsZUFBVyxTQUFTLFNBQVM7QUFBQSxNQUMzQixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsVUFBTSxjQUFjLFdBQVcsU0FBUyxRQUFRO0FBRWhELGdCQUFZLFNBQVMsVUFBVTtBQUFBLE1BQzdCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxhQUFTLFFBQVEsR0FBRyxTQUFTLElBQUksU0FBUztBQUN4QyxrQkFBWSxTQUFTLFVBQVU7QUFBQSxRQUM3QixNQUFNLE9BQU8sS0FBSztBQUFBLFFBQ2xCLE9BQU8sT0FBTyxLQUFLO0FBQUEsTUFDckIsQ0FBQztBQUFBLElBQ0g7QUFFQSxnQkFBWSxRQUFRLEtBQUs7QUFFekIsZ0JBQVksaUJBQWlCLFVBQVUsTUFBTTtBQUMzQyxXQUFLLGNBQWMsWUFBWTtBQUMvQixXQUFLLHFCQUFxQjtBQUFBLElBQzVCLENBQUM7QUFFRCxVQUFNLFdBQVcsVUFBVSxVQUFVO0FBQUEsTUFDbkMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGFBQVMsU0FBUyxTQUFTO0FBQUEsTUFDekIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sWUFBWSxTQUFTLFNBQVMsUUFBUTtBQUU1QyxjQUFVLFNBQVMsVUFBVTtBQUFBLE1BQzNCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxlQUFXLE9BQU8sS0FBSyxpQkFBaUIsR0FBRztBQUN6QyxnQkFBVSxTQUFTLFVBQVU7QUFBQSxRQUMzQixNQUFNO0FBQUEsUUFDTixPQUFPO0FBQUEsTUFDVCxDQUFDO0FBQUEsSUFDSDtBQUVBLGNBQVUsUUFBUSxLQUFLO0FBRXZCLGNBQVUsaUJBQWlCLFVBQVUsTUFBTTtBQUN6QyxXQUFLLFlBQVksVUFBVTtBQUMzQixXQUFLLHFCQUFxQjtBQUFBLElBQzVCLENBQUM7QUFFRCxVQUFNLFlBQVksVUFBVSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGNBQVUsU0FBUyxTQUFTO0FBQUEsTUFDMUIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sYUFBYSxVQUFVLFNBQVMsUUFBUTtBQUU5QyxlQUFXLFNBQVMsVUFBVTtBQUFBLE1BQzVCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxlQUFXLFNBQVMsVUFBVTtBQUFBLE1BQzVCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxlQUFXLFNBQVMsVUFBVTtBQUFBLE1BQzVCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxlQUFXLFNBQVMsVUFBVTtBQUFBLE1BQzVCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxlQUFXLFFBQVEsS0FBSztBQUV4QixlQUFXLGlCQUFpQixVQUFVLE1BQU07QUFDMUMsV0FBSyxXQUFXLFdBQVc7QUFDM0IsV0FBSyxxQkFBcUI7QUFBQSxJQUM1QixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsa0JBQWtCLFdBQThCO0FBQzlDLFVBQU0sWUFBWSxVQUFVLFVBQVU7QUFBQSxNQUNwQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsVUFBTSxXQUFXLFVBQVUsVUFBVTtBQUFBLE1BQ25DLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxVQUFNLGFBQWEsU0FBUyxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGVBQVcsU0FBUyxTQUFTO0FBQUEsTUFDM0IsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sYUFBYSxXQUFXLFNBQVMsU0FBUztBQUFBLE1BQzlDLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxlQUFXLFFBQVEsT0FBTyxLQUFLLFVBQVU7QUFFekMsZUFBVyxpQkFBaUIsVUFBVSxNQUFNO0FBQzFDLFlBQU0sU0FBUyxPQUFPLFdBQVcsS0FBSztBQUV0QyxXQUFLLGFBQ0gsT0FBTyxTQUFTLE1BQU0sS0FBSyxTQUFTLElBQ2hDLEtBQUssTUFBTSxNQUFNLElBQ2pCO0FBQUEsSUFDUixDQUFDO0FBRUQsVUFBTSxZQUFZLFNBQVMsVUFBVTtBQUFBLE1BQ25DLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxjQUFVLFNBQVMsU0FBUztBQUFBLE1BQzFCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLFlBQVksVUFBVSxTQUFTLFNBQVM7QUFBQSxNQUM1QyxNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsY0FBVSxRQUFRLE9BQU8sS0FBSyxTQUFTO0FBRXZDLGNBQVUsaUJBQWlCLFVBQVUsTUFBTTtBQUN6QyxZQUFNLFNBQVMsT0FBTyxVQUFVLEtBQUs7QUFFckMsV0FBSyxZQUNILE9BQU8sU0FBUyxNQUFNLEtBQUssU0FBUyxJQUNoQyxLQUFLLE1BQU0sTUFBTSxJQUNqQjtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sa0JBQWtCLFVBQVUsVUFBVTtBQUFBLE1BQzFDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxvQkFBZ0IsU0FBUyxTQUFTO0FBQUEsTUFDaEMsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sbUJBQW1CLGdCQUFnQixTQUFTLFFBQVE7QUFFMUQscUJBQWlCLFNBQVMsVUFBVTtBQUFBLE1BQ2xDLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxxQkFBaUIsU0FBUyxVQUFVO0FBQUEsTUFDbEMsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLElBQ1QsQ0FBQztBQUVELHFCQUFpQixTQUFTLFVBQVU7QUFBQSxNQUNsQyxNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsSUFDVCxDQUFDO0FBRUQscUJBQWlCLFFBQVEsS0FBSztBQUU5QixxQkFBaUIsaUJBQWlCLFVBQVUsTUFBTTtBQUNoRCxXQUFLLGlCQUNILGlCQUFpQjtBQUFBLElBQ3JCLENBQUM7QUFFRCxjQUFVLFNBQVMsS0FBSztBQUFBLE1BQ3RCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLGNBQWMsVUFBVSxVQUFVO0FBQUEsTUFDdEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFNBQUssaUJBQWlCLGFBQWEsU0FBUyxLQUFLLE9BQU8sQ0FBQyxVQUFVO0FBQ2pFLFdBQUssUUFBUTtBQUFBLElBQ2YsQ0FBQztBQUVELFNBQUssaUJBQWlCLGFBQWEsY0FBYyxLQUFLLFdBQVcsQ0FBQyxVQUFVO0FBQzFFLFdBQUssWUFBWTtBQUFBLElBQ25CLENBQUM7QUFFRCxTQUFLLGlCQUFpQixhQUFhLFdBQVcsS0FBSyxTQUFTLENBQUMsVUFBVTtBQUNyRSxXQUFLLFVBQVU7QUFBQSxJQUNqQixDQUFDO0FBRUQsU0FBSyxpQkFBaUIsYUFBYSxZQUFZLEtBQUssVUFBVSxDQUFDLFVBQVU7QUFDdkUsV0FBSyxXQUFXO0FBQUEsSUFDbEIsQ0FBQztBQUVELFVBQU0sYUFBYSxVQUFVLFVBQVU7QUFBQSxNQUNyQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsZUFBVyxTQUFTLFNBQVM7QUFBQSxNQUMzQixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsVUFBTSxZQUFZLFdBQVcsU0FBUyxVQUFVO0FBRWhELGNBQVUsUUFBUSxLQUFLO0FBQ3ZCLGNBQVUsT0FBTztBQUVqQixjQUFVLGlCQUFpQixTQUFTLE1BQU07QUFDeEMsV0FBSyxRQUFRLFVBQVU7QUFBQSxJQUN6QixDQUFDO0FBRUQsU0FBSyxvQkFBb0IsV0FBVztBQUFBLE1BQ2xDO0FBQUEsUUFDRSxPQUFPO0FBQUEsUUFDUCxTQUFTLE1BQU07QUFDYixlQUFLLGNBQWM7QUFDbkIsZUFBSyxPQUFPO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsUUFDRSxPQUFPO0FBQUEsUUFDUCxTQUFTLE1BQU07QUFDYixlQUFLLGNBQWM7QUFDbkIsZUFBSyxPQUFPO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsUUFDRSxPQUFPO0FBQUEsUUFDUCxLQUFLO0FBQUEsUUFDTCxTQUFTLE1BQU07QUFDYixlQUFLLGNBQWM7QUFDbkIsZUFBSyxPQUFPO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxpQkFDRSxhQUNBLE9BQ0EsT0FDQSxVQUNNO0FBQ04sVUFBTSxVQUFVLFlBQVksVUFBVTtBQUFBLE1BQ3BDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxZQUFRLFNBQVMsU0FBUztBQUFBLE1BQ3hCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLFdBQVcsUUFBUSxTQUFTLFVBQVU7QUFFNUMsYUFBUyxRQUFRO0FBQ2pCLGFBQVMsT0FBTztBQUVoQixhQUFTLGlCQUFpQixTQUFTLE1BQU07QUFDdkMsZUFBUyxTQUFTLEtBQUs7QUFBQSxJQUN6QixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsa0JBQWtCLFdBQThCO0FBQzlDLFVBQU0sWUFBWSxLQUFLLGlCQUFpQjtBQUV4QyxVQUFNLFlBQVksVUFBVSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sa0JBQWtCLFVBQVUsU0FBUyxZQUFZO0FBQUEsTUFDckQsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELG9CQUFnQixRQUFRLDBCQUEwQixTQUFTO0FBQzNELG9CQUFnQixXQUFXO0FBRTNCLFNBQUssb0JBQW9CLFdBQVc7QUFBQSxNQUNsQztBQUFBLFFBQ0UsT0FBTztBQUFBLFFBQ1AsU0FBUyxNQUFNO0FBQ2IsZUFBSyxjQUFjO0FBQ25CLGVBQUssT0FBTztBQUFBLFFBQ2Q7QUFBQSxNQUNGO0FBQUEsTUFDQTtBQUFBLFFBQ0UsT0FBTyxLQUFLLFlBQ1IsbUJBQ0EsS0FBSyxnQkFDSCxxQkFDQTtBQUFBLFFBQ04sS0FBSztBQUFBLFFBQ0wsU0FBUyxZQUFZO0FBQ25CLGdCQUFNLEtBQUssY0FBYztBQUFBLFFBQzNCO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLG9CQUNFLGFBQ0EsU0FLTTtBQUNOLFVBQU0sV0FBVyxZQUFZLFVBQVU7QUFBQSxNQUNyQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsZUFBVyxnQkFBZ0IsU0FBUztBQUNsQyxZQUFNLFNBQVMsU0FBUyxTQUFTLFVBQVU7QUFBQSxRQUN6QyxNQUFNLGFBQWE7QUFBQSxNQUNyQixDQUFDO0FBRUQsVUFBSSxhQUFhLEtBQUs7QUFDcEIsZUFBTyxTQUFTLFNBQVM7QUFBQSxNQUMzQjtBQUVBLGFBQU8saUJBQWlCLFNBQVMsTUFBTTtBQUNyQyxhQUFLLGFBQWEsUUFBUTtBQUFBLE1BQzVCLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUFBLEVBRUEsbUJBQWtDO0FBQ2hDLFdBQU87QUFBQSxNQUNMLE1BQU0sS0FBSyxjQUFjLEtBQUs7QUFBQSxNQUM5QixZQUFZLEtBQUs7QUFBQSxNQUNqQixXQUFXLEtBQUs7QUFBQSxNQUNoQixnQkFBZ0IsS0FBSztBQUFBLE1BQ3JCLFVBQVUsS0FBSztBQUFBLE1BQ2YsT0FBTyxLQUFLO0FBQUEsTUFDWixXQUFXLEtBQUs7QUFBQSxNQUNoQixTQUFTLEtBQUs7QUFBQSxNQUNkLFVBQVUsS0FBSztBQUFBLE1BQ2YsT0FBTyxLQUFLO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQWMsc0JBQXNCLE1BQTRCO0FBL2tCbEU7QUFnbEJJLFVBQU0sUUFBUSxLQUFLLElBQUksY0FBYyxhQUFhLElBQUk7QUFDdEQsVUFBTSxjQUFjLCtCQUFPO0FBRTNCLFFBQUksQ0FBQyxlQUFlLFlBQVksbUJBQW1CLGFBQWE7QUFDOUQsVUFBSSx3QkFBTywwQ0FBMEM7QUFDckQ7QUFBQSxJQUNGO0FBRUEsU0FBSyxpQkFDSCxZQUFZLG1CQUFtQixvQkFDL0IsWUFBWSxtQkFBbUIseUJBQy9CLFlBQVksbUJBQW1CLFNBQzNCLFlBQVksaUJBQ1o7QUFFTixTQUFLLGdCQUFnQixRQUFPLGlCQUFZLFNBQVosWUFBb0IsS0FBSyxRQUFRO0FBRTdELFFBQUksS0FBSyxlQUFlO0FBQ3RCLFdBQUssZ0JBQWdCLEdBQUcsS0FBSyxhQUFhO0FBQUEsSUFDNUM7QUFFQSxTQUFLLGFBQWEsUUFBTyxpQkFBWSxlQUFaLFlBQTBCLENBQUM7QUFDcEQsU0FBSyxZQUFZLFFBQU8saUJBQVksY0FBWixZQUF5QixDQUFDO0FBRWxELFNBQUssbUJBQW1CLE1BQU0sUUFBUSxZQUFZLFFBQVEsSUFDdEQsWUFBWSxTQUFTLElBQUksQ0FBQyxZQUFrQztBQXptQnBFLFVBQUFDLEtBQUFDLEtBQUFDLEtBQUE7QUF5bUJ3RTtBQUFBLFFBQzlELE1BQU0sUUFBT0YsTUFBQSxRQUFRLFNBQVIsT0FBQUEsTUFBZ0IsaUJBQWlCO0FBQUEsUUFDOUMsTUFBTSxRQUFPQyxNQUFBLFFBQVEsU0FBUixPQUFBQSxNQUFnQixFQUFFO0FBQUEsUUFDL0IsS0FBSyxRQUFPQyxNQUFBLFFBQVEsUUFBUixPQUFBQSxNQUFlLENBQUM7QUFBQSxRQUM1QixPQUFPLFFBQU8sYUFBUSxVQUFSLFlBQWlCLEVBQUU7QUFBQSxRQUNqQyxJQUFJLFFBQU8sYUFBUSxPQUFSLFlBQWMsRUFBRTtBQUFBLFFBQzNCLElBQUksUUFBTyxhQUFRLE9BQVIsWUFBYyxFQUFFO0FBQUEsUUFDM0IsS0FBSyxRQUFPLGFBQVEsUUFBUixZQUFlLEVBQUU7QUFBQSxNQUMvQjtBQUFBLEtBQUUsSUFDRixDQUFDO0FBRUwsVUFBTSxVQUFVLE1BQU0sS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJO0FBRTlDLFNBQUssUUFBUSxLQUFLLGVBQWUsU0FBUyxPQUFPO0FBQ2pELFNBQUssWUFBWSxLQUFLLGVBQWUsU0FBUyxZQUFZO0FBQzFELFNBQUssVUFBVSxLQUFLLGVBQWUsU0FBUyxTQUFTO0FBQ3JELFNBQUssV0FBVyxLQUFLLGVBQWUsU0FBUyxVQUFVO0FBQ3ZELFNBQUssUUFBUSxLQUFLLGVBQWUsU0FBUyxPQUFPO0FBQUEsRUFDbkQ7QUFBQSxFQUVRLGVBQ04sU0FDQSxTQUNRO0FBQ1IsVUFBTSxRQUFRLFFBQVEsTUFBTSxPQUFPO0FBRW5DLFVBQU0sYUFBYSxNQUFNO0FBQUEsTUFDdkIsQ0FBQyxTQUFTLEtBQUssS0FBSyxNQUFNLE1BQU0sT0FBTztBQUFBLElBQ3pDO0FBRUEsUUFBSSxlQUFlLElBQUk7QUFDckIsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLGVBQXlCLENBQUM7QUFFaEMsYUFBUyxJQUFJLGFBQWEsR0FBRyxJQUFJLE1BQU0sUUFBUSxLQUFLO0FBQ2xELFlBQU0sT0FBTyxNQUFNLENBQUM7QUFFcEIsVUFBSSxTQUFTLEtBQUssS0FBSyxLQUFLLENBQUMsR0FBRztBQUM5QjtBQUFBLE1BQ0Y7QUFFQSxtQkFBYSxLQUFLLElBQUk7QUFBQSxJQUN4QjtBQUVBLFdBQU8sYUFBYSxLQUFLLElBQUksRUFBRSxLQUFLO0FBQUEsRUFDdEM7QUFBQSxFQUVBLG1CQUE2QjtBQTFwQi9CO0FBMnBCSSxVQUFNLFNBQVMsb0JBQUksSUFBWTtBQUUvQixlQUFXLFdBQVcsS0FBSyxhQUFhLGVBQWUsR0FBRztBQUN4RCxpQkFBVyxRQUFPLGFBQVEsU0FBUixZQUFnQixDQUFDLEdBQUc7QUFDcEMsZUFBTyxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQUEsTUFDeEI7QUFBQSxJQUNGO0FBRUEsV0FBTyxDQUFDLEdBQUcsTUFBTSxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQztBQUFBLEVBQ3REO0FBQUEsRUFFQSxhQUFhLFVBQThDO0FBQ3pELFdBQU8sQ0FBQyxHQUFHLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNO0FBdnFCeEM7QUF3cUJNLFlBQU0sU0FBUyxRQUFPLE9BQUUsVUFBRixZQUFXLEdBQUc7QUFDcEMsWUFBTSxTQUFTLFFBQU8sT0FBRSxVQUFGLFlBQVcsR0FBRztBQUVwQyxjQUFRLEtBQUssVUFBVTtBQUFBLFFBQ3JCLEtBQUs7QUFDSCxpQkFBTyxFQUFFLEtBQUssY0FBYyxFQUFFLElBQUk7QUFBQSxRQUVwQyxLQUFLO0FBQ0gsaUJBQU8sU0FBUyxVQUFVLEVBQUUsS0FBSyxjQUFjLEVBQUUsSUFBSTtBQUFBLFFBRXZELEtBQUs7QUFDSCxpQkFBTyxTQUFTLFVBQVUsRUFBRSxLQUFLLGNBQWMsRUFBRSxJQUFJO0FBQUEsUUFFdkQsS0FBSztBQUFBLFFBQ0w7QUFDRSxpQkFBTyxFQUFFLEtBQUssY0FBYyxFQUFFLElBQUk7QUFBQSxNQUN0QztBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLHVCQUE2QjtBQUMzQixVQUFNLFlBQVksS0FBSyxVQUFVO0FBQUEsTUFDL0I7QUFBQSxJQUNGO0FBRUEsUUFBSSxFQUFFLHFCQUFxQixjQUFjO0FBQ3ZDO0FBQUEsSUFDRjtBQUVBLGNBQVUsTUFBTTtBQUVoQixRQUFJLFdBQVcsS0FBSyxhQUFhLGVBQWUsS0FBSyxhQUFhO0FBRWxFLFFBQUksS0FBSyxhQUFhO0FBQ3BCLGlCQUFXLFNBQVM7QUFBQSxRQUFPLENBQUMsWUFBUztBQTFzQjNDO0FBMnNCUSx5QkFBTyxhQUFRLFVBQVIsWUFBaUIsRUFBRSxNQUFNLEtBQUs7QUFBQTtBQUFBLE1BQ3ZDO0FBQUEsSUFDRjtBQUVBLFFBQUksS0FBSyxXQUFXO0FBQ2xCLGlCQUFXLFNBQVM7QUFBQSxRQUFPLENBQUMsWUFBUztBQWh0QjNDO0FBaXRCUyxnQ0FBUSxTQUFSLFlBQWdCLENBQUMsR0FBRyxTQUFTLEtBQUssU0FBUztBQUFBO0FBQUEsTUFDOUM7QUFBQSxJQUNGO0FBRUEsZUFBVyxLQUFLLGFBQWEsUUFBUTtBQUNyQyxlQUFXLFNBQVMsTUFBTSxHQUFHLEdBQUc7QUFFaEMsZUFBVyxXQUFXLFVBQVU7QUFDOUIsWUFBTSxNQUFNLElBQUksaUJBQWlCO0FBRWpDLFlBQU0sVUFBVSxTQUFTLGNBQWMsS0FBSztBQUM1QyxjQUFRLFlBQVk7QUFFcEIsWUFBTSxPQUFPLFNBQVMsY0FBYyxLQUFLO0FBQ3pDLFdBQUssWUFBWTtBQUVqQixZQUFNLE9BQU8sU0FBUyxjQUFjLEtBQUs7QUFDekMsV0FBSyxZQUFZO0FBQ2pCLFdBQUssY0FBYyxRQUFRO0FBRTNCLFlBQU0sT0FBTyxTQUFTLGNBQWMsS0FBSztBQUN6QyxXQUFLLFlBQVk7QUFDakIsV0FBSyxjQUNIO0FBQUEsUUFDRSxRQUFRLFFBQVEsTUFBTSxRQUFRLEtBQUssS0FBSztBQUFBLFFBQ3hDLFFBQVEsS0FBSyxNQUFNLFFBQVEsRUFBRSxLQUFLO0FBQUEsUUFDbEMsUUFBUSxLQUFLLE1BQU0sUUFBUSxFQUFFLEtBQUs7QUFBQSxNQUNwQyxFQUNHLE9BQU8sT0FBTyxFQUNkLEtBQUssVUFBSyxLQUFLLFFBQVE7QUFFNUIsV0FBSyxZQUFZLElBQUk7QUFDckIsV0FBSyxZQUFZLElBQUk7QUFFckIsWUFBTSxVQUFVLFNBQVMsY0FBYyxLQUFLO0FBQzVDLGNBQVEsWUFBWTtBQUVwQixZQUFNLGdCQUFnQixTQUFTLGNBQWMsUUFBUTtBQUNyRCxvQkFBYyxjQUFjO0FBRTVCLG9CQUFjLGlCQUFpQixTQUFTLENBQUMsVUFBVTtBQUNqRCwyQkFBbUIsS0FBSyxLQUFLLE9BQU8sT0FBTztBQUFBLE1BQzdDLENBQUM7QUFFRCxZQUFNLFlBQVksU0FBUyxjQUFjLFFBQVE7QUFDakQsZ0JBQVUsY0FBYztBQUN4QixnQkFBVSxVQUFVLElBQUksU0FBUztBQUVqQyxnQkFBVSxpQkFBaUIsU0FBUyxNQUFNO0FBQ3hDLGFBQUssV0FBVyxPQUFPO0FBQUEsTUFDekIsQ0FBQztBQUVELGNBQVEsWUFBWSxhQUFhO0FBQ2pDLGNBQVEsWUFBWSxTQUFTO0FBRTdCLGNBQVEsWUFBWSxJQUFJO0FBQ3hCLGNBQVEsWUFBWSxPQUFPO0FBRTNCLFVBQUksWUFBWSxPQUFPO0FBQ3ZCLGdCQUFVLFlBQVksR0FBRztBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUFBLEVBRUEseUJBQStCO0FBQzdCLFVBQU0sYUFBYSxLQUFLLFVBQVU7QUFBQSxNQUNoQztBQUFBLElBQ0Y7QUFFQSxRQUFJLEVBQUUsc0JBQXNCLGNBQWM7QUFDeEM7QUFBQSxJQUNGO0FBRUEsZUFBVyxNQUFNO0FBRWpCLFFBQUksS0FBSyxpQkFBaUIsV0FBVyxHQUFHO0FBQ3RDLGlCQUFXLFNBQVMsS0FBSztBQUFBLFFBQ3ZCLE1BQU07QUFBQSxNQUNSLENBQUM7QUFFRDtBQUFBLElBQ0Y7QUFFQSxlQUFXLFdBQVcsS0FBSyxrQkFBa0I7QUFDM0MsWUFBTSxRQUFRLFdBQVcsVUFBVTtBQUFBLFFBQ2pDLEtBQUs7QUFBQSxNQUNQLENBQUM7QUFFRCxZQUFNLFNBQVMsTUFBTSxVQUFVO0FBQUEsUUFDN0IsS0FBSztBQUFBLE1BQ1AsQ0FBQztBQUVELGFBQU8sVUFBVTtBQUFBLFFBQ2YsS0FBSztBQUFBLFFBQ0wsTUFBTSxRQUFRO0FBQUEsTUFDaEIsQ0FBQztBQUVELGFBQU8sVUFBVTtBQUFBLFFBQ2YsS0FBSztBQUFBLFFBQ0wsTUFBTSxRQUFRO0FBQUEsTUFDaEIsQ0FBQztBQUVELFlBQU0sV0FBVyxNQUFNLFNBQVMsU0FBUztBQUFBLFFBQ3ZDLE1BQU07QUFBQSxNQUNSLENBQUM7QUFFRCxlQUFTLFFBQVEsT0FBTyxRQUFRLEdBQUc7QUFDbkMsZUFBUyxNQUFNO0FBRWYsZUFBUyxpQkFBaUIsVUFBVSxNQUFNO0FBQ3hDLGNBQU0sTUFBTSxPQUFPLFNBQVMsS0FBSztBQUVqQyxnQkFBUSxNQUNOLE9BQU8sU0FBUyxHQUFHLEtBQUssTUFBTSxJQUMxQixLQUFLLE1BQU0sR0FBRyxJQUNkO0FBRU4sYUFBSyx1QkFBdUI7QUFBQSxNQUM5QixDQUFDO0FBRUQsWUFBTSxlQUFlLE1BQU0sU0FBUyxVQUFVO0FBQUEsUUFDNUMsTUFBTTtBQUFBLE1BQ1IsQ0FBQztBQUVELG1CQUFhLGlCQUFpQixTQUFTLE1BQU07QUFDM0MsYUFBSyxtQkFBbUIsS0FBSyxpQkFBaUI7QUFBQSxVQUM1QyxDQUFDLGFBQWEsU0FBUyxTQUFTLFFBQVE7QUFBQSxRQUMxQztBQUVBLGFBQUssdUJBQXVCO0FBQzVCLGFBQUssdUJBQXVCO0FBQUEsTUFDOUIsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQUEsRUFFQSx5QkFBK0I7QUFDN0IsVUFBTSxZQUFZLEtBQUssVUFBVTtBQUFBLE1BQy9CO0FBQUEsSUFDRjtBQUVBLFFBQUksRUFBRSxxQkFBcUIsY0FBYztBQUN2QztBQUFBLElBQ0Y7QUFFQSxjQUFVLE1BQU07QUFFaEIsVUFBTSxVQUFVLEtBQUssb0JBQW9CO0FBRXpDLGNBQVUsU0FBUyxNQUFNO0FBQUEsTUFDdkIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsTUFBTSxtQkFBbUIsUUFBUSxhQUFhO0FBQUEsSUFDaEQsQ0FBQztBQUVELGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsTUFBTSxvQkFBb0IsUUFBUSxjQUFjO0FBQUEsSUFDbEQsQ0FBQztBQUVELGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsTUFBTSwwQkFBMEIsUUFBUSxhQUFhLFFBQVEsQ0FBQyxDQUFDO0FBQUEsSUFDakUsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLHNCQUlFO0FBQ0EsVUFBTSxnQkFBZ0IsS0FBSyxpQkFBaUI7QUFBQSxNQUMxQyxDQUFDLEtBQUssWUFBWSxNQUFNLFFBQVE7QUFBQSxNQUNoQztBQUFBLElBQ0Y7QUFFQSxVQUFNLGlCQUFpQixLQUFLLGlCQUFpQjtBQUU3QyxRQUFJLGNBQWM7QUFDbEIsUUFBSSxrQkFBa0I7QUFFdEIsZUFBVyxXQUFXLEtBQUssa0JBQWtCO0FBQzNDLFlBQU0sUUFBUSxPQUFPLFFBQVEsS0FBSztBQUVsQyxVQUFJLENBQUMsT0FBTyxNQUFNLEtBQUssR0FBRztBQUN4Qix1QkFBZSxRQUFRLFFBQVE7QUFDL0IsMkJBQW1CLFFBQVE7QUFBQSxNQUM3QjtBQUFBLElBQ0Y7QUFFQSxVQUFNLGVBQ0osa0JBQWtCLElBQ2QsY0FBYyxrQkFDZDtBQUVOLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsV0FBVyxTQUErQjtBQUN4QyxVQUFNLFdBQVcsS0FBSyxpQkFBaUI7QUFBQSxNQUNyQyxDQUFDLGFBQWEsU0FBUyxTQUFTLFFBQVE7QUFBQSxJQUMxQztBQUVBLFFBQUksVUFBVTtBQUNaLGVBQVMsT0FBTztBQUFBLElBQ2xCLE9BQU87QUFDTCxXQUFLLGlCQUFpQixLQUFLO0FBQUEsUUFDekIsTUFBTSxRQUFRO0FBQUEsUUFDZCxNQUFNLFFBQVE7QUFBQSxRQUNkLEtBQUs7QUFBQSxRQUNMLE9BQU8sUUFBUTtBQUFBLFFBQ2YsSUFBSSxRQUFRO0FBQUEsUUFDWixJQUFJLFFBQVE7QUFBQSxRQUNaLEtBQUssUUFBUTtBQUFBLE1BQ2YsQ0FBQztBQUFBLElBQ0g7QUFFQSxTQUFLLHVCQUF1QjtBQUM1QixTQUFLLHVCQUF1QjtBQUFBLEVBQzlCO0FBQUEsRUFFQSxNQUFNLGdCQUErQjtBQUNuQyxVQUFNLE9BQU8sS0FBSyxjQUFjLEtBQUs7QUFFckMsUUFBSSxDQUFDLE1BQU07QUFDVCxVQUFJLHdCQUFPLDZCQUE2QjtBQUN4QztBQUFBLElBQ0Y7QUFFQSxRQUFJO0FBQ0YsVUFBSSxLQUFLLGFBQWEsS0FBSyxZQUFZO0FBQ3JDLGNBQU0sS0FBSyxpQkFBaUI7QUFBQSxVQUMxQixLQUFLO0FBQUEsVUFDTCxLQUFLLGlCQUFpQjtBQUFBLFFBQ3hCO0FBRUEsY0FBTSxJQUFJO0FBQUEsVUFBUSxDQUFDLFlBQ2pCLE9BQU8sV0FBVyxTQUFTLEdBQUc7QUFBQSxRQUNoQztBQUVBLGNBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxRQUFRLEtBQUs7QUFFN0MsY0FBTSxLQUFLLGlCQUFpQjtBQUFBLFVBQzFCLEtBQUs7QUFBQSxVQUNMLEtBQUssaUJBQWlCO0FBQUEsUUFDeEI7QUFFQSxjQUFNLElBQUk7QUFBQSxVQUFRLENBQUMsWUFDakIsT0FBTyxXQUFXLFNBQVMsR0FBRztBQUFBLFFBQ2hDO0FBRUEsY0FBTSxPQUFPLEtBQUssSUFBSSxVQUFVLG9CQUFvQiw2QkFBWTtBQUVoRSxlQUFNLDZCQUFNLFlBQVksU0FBUztBQUVqQyxZQUFJLHdCQUFPLGtCQUFrQjtBQUFBLE1BQy9CLE9BQU07QUFDSixjQUFNLEtBQUssaUJBQWlCO0FBQUEsVUFDMUIsS0FBSyxpQkFBaUI7QUFBQSxRQUN4QjtBQUVBLFlBQUk7QUFBQSxVQUNGLEtBQUssZ0JBQ0QsMEJBQ0E7QUFBQSxRQUNOO0FBQUEsTUFDRjtBQUVBLFdBQUssTUFBTTtBQUFBLElBQ2IsU0FBUyxPQUFPO0FBQ2QsY0FBUSxNQUFNLDZCQUE2QixLQUFLO0FBQ2hELFVBQUksd0JBQU8sMENBQTBDO0FBQUEsSUFDdkQ7QUFBQSxFQUNGO0FBQ0Y7OztBRXIrQkEsSUFBQUMsbUJBS087OztBQ3NCUCxTQUFTLFNBQVMsT0FBZ0IsV0FBVyxJQUFZO0FBQ3ZELE1BQUksVUFBVSxRQUFRLFVBQVUsUUFBVztBQUN6QyxXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQ0UsT0FBTyxVQUFVLFlBQ2pCLE9BQU8sVUFBVSxZQUNqQixPQUFPLFVBQVUsV0FDakI7QUFDQSxXQUFPLE9BQU8sS0FBSyxFQUFFLEtBQUs7QUFBQSxFQUM1QjtBQUVBLFNBQU87QUFDVDtBQUVBLFNBQVMsa0JBQWtCLE9BQWdCLFdBQVcsTUFBYztBQUNsRSxRQUFNLE1BQU0sU0FBUyxPQUFPLFFBQVE7QUFDcEMsTUFBSSxDQUFDO0FBQUssV0FBTztBQUNqQixNQUFJLFlBQVksS0FBSyxHQUFHO0FBQUcsV0FBTztBQUNsQyxNQUFJLFFBQVEsS0FBSyxHQUFHO0FBQUcsV0FBTyxJQUFJLEdBQUc7QUFDckMsTUFBSSxTQUFTLEtBQUssR0FBRztBQUFHLFdBQU87QUFDL0IsU0FBTztBQUNUO0FBRUEsU0FBUyxxQkFBcUIsT0FBMEI7QUFDdEQsTUFBSSxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3hCLFdBQU8sTUFBTSxJQUFJLENBQUMsU0FBUyxTQUFTLElBQUksQ0FBQyxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQzNEO0FBRUEsTUFBSSxPQUFPLFVBQVUsVUFBVTtBQUM3QixXQUFPLE1BQ0osTUFBTSxJQUFJLEVBQ1YsSUFBSSxDQUFDLFNBQVMsS0FBSyxLQUFLLENBQUMsRUFDekIsT0FBTyxPQUFPO0FBQUEsRUFDbkI7QUFFQSxTQUFPLENBQUM7QUFDVjtBQUVBLFNBQVMsZ0JBQWdCLE1BQXdDO0FBQy9ELE1BQUksT0FBTyxTQUFTLFVBQVU7QUFDNUIsV0FBTztBQUFBLE1BQ0wsTUFBTSxLQUFLLEtBQUs7QUFBQSxNQUNoQixLQUFLLEtBQUssS0FBSztBQUFBLElBQ2pCO0FBQUEsRUFDRjtBQUVBLE1BQUksUUFBUSxPQUFPLFNBQVMsVUFBVTtBQUNwQyxVQUFNLE1BQU07QUFDWixVQUFNLE9BQU8sU0FBUyxJQUFJLElBQUk7QUFDOUIsUUFBSSxDQUFDO0FBQU0sYUFBTztBQUVsQixXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0EsT0FBTyxTQUFTLElBQUksS0FBSztBQUFBLE1BQ3pCLFFBQVEsU0FBUyxJQUFJLE1BQU07QUFBQSxNQUMzQixPQUFPLFNBQVMsSUFBSSxLQUFLO0FBQUEsTUFDekIsT0FBTyxTQUFTLElBQUksS0FBSztBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUVBLFNBQU87QUFDVDtBQUVBLFNBQVMsaUJBQWlCLE9BQW9DO0FBQzVELE1BQUksTUFBTSxRQUFRLEtBQUssR0FBRztBQUN4QixXQUFPLE1BQ0osSUFBSSxlQUFlLEVBQ25CLE9BQU8sQ0FBQyxNQUE2QixNQUFNLElBQUk7QUFBQSxFQUNwRDtBQUVBLE1BQUksT0FBTyxVQUFVLFlBQVksTUFBTSxLQUFLLEdBQUc7QUFDN0MsV0FBTyxDQUFDLEVBQUUsTUFBTSxNQUFNLEtBQUssR0FBRyxLQUFLLE1BQU0sS0FBSyxFQUFFLENBQUM7QUFBQSxFQUNuRDtBQUVBLFNBQU8sQ0FBQztBQUNWO0FBRU8sU0FBUyxpQkFDZCxPQUNtQjtBQTVHckI7QUE2R0UsUUFBTSxlQUFlLFdBQU0sVUFBTixZQUF1RCxDQUFDO0FBRTdFLFFBQU0sWUFBVyxXQUFNLFFBQU4sWUFBYSxZQUFZO0FBQzFDLFFBQU0sWUFBVyxXQUFNLFFBQU4sWUFBYSxZQUFZO0FBQzFDLFFBQU0sWUFBVyxXQUFNLFFBQU4sWUFBYSxZQUFZO0FBQzFDLFFBQU0sWUFBVyxXQUFNLFFBQU4sWUFBYSxZQUFZO0FBQzFDLFFBQU0sWUFBVyxXQUFNLFFBQU4sWUFBYSxZQUFZO0FBQzFDLFFBQU0sWUFBVyxXQUFNLFFBQU4sWUFBYSxZQUFZO0FBRTFDLFNBQU87QUFBQSxJQUNMLE1BQU0sU0FBUyxNQUFNLE1BQU0saUJBQWlCO0FBQUEsSUFDNUMsT0FBTyxTQUFTLE1BQU0sT0FBTyxHQUFHO0FBQUEsSUFDaEMsV0FBVyxTQUFTLE1BQU0sV0FBVyxFQUFFO0FBQUEsSUFDdkMsTUFBTSxTQUFTLE1BQU0sTUFBTSxFQUFFO0FBQUEsSUFDN0IsSUFBSSxTQUFTLE1BQU0sSUFBSSxHQUFHO0FBQUEsSUFDMUIsSUFBSSxTQUFTLE1BQU0sSUFBSSxHQUFHO0FBQUEsSUFDMUIsSUFBSSxTQUFTLE1BQU0sSUFBSSxFQUFFO0FBQUEsSUFDekIsS0FBSyxpQkFBaUIsTUFBTSxHQUFHO0FBQUEsSUFDL0IsT0FBTztBQUFBLE1BQ0wsS0FBSyxrQkFBa0IsVUFBVSxJQUFJO0FBQUEsTUFDckMsS0FBSyxrQkFBa0IsVUFBVSxJQUFJO0FBQUEsTUFDckMsS0FBSyxrQkFBa0IsVUFBVSxJQUFJO0FBQUEsTUFDckMsS0FBSyxrQkFBa0IsVUFBVSxJQUFJO0FBQUEsTUFDckMsS0FBSyxrQkFBa0IsVUFBVSxJQUFJO0FBQUEsTUFDckMsS0FBSyxrQkFBa0IsVUFBVSxJQUFJO0FBQUEsSUFDdkM7QUFBQSxJQUNBLFFBQVEscUJBQXFCLE1BQU0sTUFBTTtBQUFBLElBQ3pDLFVBQVUscUJBQXFCLE1BQU0sUUFBUTtBQUFBLElBQzdDLFFBQVEscUJBQXFCLE1BQU0sTUFBTTtBQUFBLElBQ3pDLE1BQU0scUJBQXFCLE1BQU0sSUFBSTtBQUFBLElBQ3JDLGFBQWEsU0FBUyxNQUFNLGFBQWEsRUFBRTtBQUFBLElBQzNDLFFBQVEsU0FBUyxNQUFNLFFBQVEsRUFBRTtBQUFBLElBQ2pDLE1BQU0scUJBQXFCLE1BQU0sSUFBSTtBQUFBLEVBQ3ZDO0FBQ0Y7OztBQzVJTyxTQUFTLGlCQUNkLGFBQ2dDO0FBQ2hDLFFBQU0sU0FBbUIsQ0FBQztBQUMxQixRQUFNLFdBQXFCLENBQUM7QUFFNUIsTUFBSSxDQUFDLGVBQWUsT0FBTyxnQkFBZ0IsVUFBVTtBQUNuRCxXQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxRQUFRLENBQUMsNkJBQTZCO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUVBLFFBQU0sVUFBVSxpQkFBaUIsV0FBeUM7QUFFMUUsTUFBSSxDQUFDLFFBQVEsUUFBUSxRQUFRLFNBQVMsbUJBQW1CO0FBQ3ZELGFBQVMsS0FBSyw0QkFBNEI7QUFBQSxFQUM1QztBQUVBLE1BQUksQ0FBQyxRQUFRLE1BQU0sUUFBUSxPQUFPLEtBQUs7QUFDckMsYUFBUyxLQUFLLHdCQUF3QjtBQUFBLEVBQ3hDO0FBRUEsTUFBSSxDQUFDLFFBQVEsTUFBTSxRQUFRLE9BQU8sS0FBSztBQUNyQyxhQUFTLEtBQUssd0JBQXdCO0FBQUEsRUFDeEM7QUFFQSxNQUFJLFFBQVEsSUFBSSxXQUFXLEdBQUc7QUFDNUIsYUFBUyxLQUFLLGdDQUFnQztBQUFBLEVBQ2hEO0FBRUEsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLElBQ1QsTUFBTTtBQUFBLElBQ047QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUNGOzs7QUNsQ0EsU0FBUyxVQUFVLFdBQW9CLE1BQStCO0FBQ3BFLFFBQU0sS0FBSyxTQUFTLGNBQWMsS0FBSztBQUN2QyxNQUFJO0FBQVcsT0FBRyxZQUFZO0FBQzlCLE1BQUksU0FBUztBQUFXLE9BQUcsY0FBYztBQUN6QyxTQUFPO0FBQ1Q7QUFFQSxTQUFTLFdBQVcsV0FBb0IsTUFBZ0M7QUFDdEUsUUFBTSxLQUFLLFNBQVMsY0FBYyxNQUFNO0FBQ3hDLE1BQUk7QUFBVyxPQUFHLFlBQVk7QUFDOUIsTUFBSSxTQUFTO0FBQVcsT0FBRyxjQUFjO0FBQ3pDLFNBQU87QUFDVDtBQUVBLFNBQVMsV0FBVyxXQUFzQztBQUN4RCxRQUFNLEtBQUssU0FBUyxjQUFjLElBQUk7QUFDdEMsTUFBSTtBQUFXLE9BQUcsWUFBWTtBQUM5QixTQUFPO0FBQ1Q7QUFFQSxTQUFTLGVBQWUsV0FBbUM7QUFDekQsUUFBTSxLQUFLLFNBQVMsY0FBYyxJQUFJO0FBQ3RDLE1BQUk7QUFBVyxPQUFHLFlBQVk7QUFDOUIsU0FBTztBQUNUO0FBRUEsU0FBUyxpQkFBaUIsUUFBa0M7QUFDMUQsTUFBSSxPQUFPO0FBQUssV0FBTyxPQUFPO0FBRTlCLFFBQU0sUUFBa0IsQ0FBQyxPQUFPLElBQUk7QUFFcEMsTUFBSSxPQUFPO0FBQU8sVUFBTSxLQUFLLE9BQU8sS0FBSztBQUN6QyxNQUFJLE9BQU87QUFBUSxVQUFNLEtBQUssSUFBSSxPQUFPLE1BQU0sR0FBRztBQUNsRCxNQUFJLE9BQU87QUFBTyxVQUFNLEtBQUssSUFBSSxPQUFPLEtBQUssR0FBRztBQUNoRCxNQUFJLE9BQU87QUFBTyxVQUFNLEtBQUssS0FBSyxPQUFPLEtBQUssRUFBRTtBQUVoRCxTQUFPLE1BQU0sS0FBSyxHQUFHLEVBQUUsS0FBSztBQUM5QjtBQUVBLFNBQVMsa0JBQWtCLFdBQTJCO0FBQ3BELFFBQU0sYUFBYSxVQUFVLEtBQUssRUFBRSxZQUFZO0FBRWhELFVBQVEsWUFBWTtBQUFBLElBQ2xCLEtBQUs7QUFDSCxhQUFPO0FBQUEsSUFDVCxLQUFLO0FBQ0gsYUFBTztBQUFBLElBQ1QsS0FBSztBQUNILGFBQU87QUFBQSxJQUNUO0FBQ0UsYUFBTztBQUFBLEVBQ1g7QUFDRjtBQUVBLFNBQVMscUJBQXFCLE1BQTBEO0FBQ3RGLFFBQU0sVUFBVSxLQUFLLEtBQUs7QUFDMUIsUUFBTSxRQUFRLFFBQVEsTUFBTSxvQkFBb0I7QUFFaEQsTUFBSSxDQUFDLE9BQU87QUFDVixXQUFPLEVBQUUsV0FBVyxNQUFNLE1BQU0sUUFBUTtBQUFBLEVBQzFDO0FBRUEsU0FBTztBQUFBLElBQ0wsV0FBVyxNQUFNLENBQUMsRUFBRSxZQUFZO0FBQUEsSUFDaEMsTUFBTSxNQUFNLENBQUMsRUFBRSxLQUFLO0FBQUEsRUFDdEI7QUFDRjtBQUVBLFNBQVMscUJBQXFCLFNBQXlCO0FBQ3JELFNBQU8sUUFBUSxRQUFRLFFBQVEsRUFBRTtBQUNuQztBQUVBLFNBQVMscUJBQXFCLE9BQXVCO0FBQ25ELFFBQU0sYUFBYSxNQUFNLEtBQUs7QUFDOUIsU0FBTyxPQUFPLFVBQVU7QUFDMUI7QUFFQSxTQUFTLHFCQUNQLE1BQ0EsU0FDQSxZQUNtQjtBQUNuQixRQUFNLFNBQVMsU0FBUyxjQUFjLFFBQVE7QUFDOUMsU0FBTyxPQUFPO0FBQ2QsU0FBTyxZQUFZO0FBQ25CLFNBQU8sY0FBYztBQUNyQixTQUFPLFFBQVEsUUFBUSxPQUFPO0FBRTlCLFNBQU8saUJBQWlCLFNBQVMsQ0FBQyxRQUFRO0FBQ3hDLFFBQUksZUFBZTtBQUNuQixRQUFJLGdCQUFnQjtBQUNwQixlQUFXLE9BQU87QUFBQSxFQUNwQixDQUFDO0FBRUQsU0FBTztBQUNUO0FBRUEsU0FBUyxnQ0FDUCxRQUNBLE1BQ0EsWUFDTTtBQUNOLFFBQU0sbUJBQW1CO0FBQ3pCLFFBQU0sY0FBYztBQUVwQixRQUFNLGVBS0QsQ0FBQztBQUVOLFFBQU0sYUFBYSxpQkFBaUIsS0FBSyxJQUFJO0FBQzdDLE9BQUkseUNBQVksV0FBVSxRQUFXO0FBQ25DLFVBQU0sT0FBTyxXQUFXLENBQUM7QUFDekIsaUJBQWEsS0FBSztBQUFBLE1BQ2hCLE9BQU8sV0FBVztBQUFBLE1BQ2xCLEtBQUssV0FBVyxRQUFRLEtBQUs7QUFBQSxNQUM3QjtBQUFBLE1BQ0EsU0FBUyxxQkFBcUIsSUFBSTtBQUFBLElBQ3BDLENBQUM7QUFBQSxFQUNIO0FBRUEsUUFBTSxjQUFjLFlBQVksS0FBSyxJQUFJO0FBQ3pDLE9BQUksMkNBQWEsV0FBVSxRQUFXO0FBQ3BDLFVBQU0sT0FBTyxZQUFZLENBQUM7QUFDMUIsaUJBQWEsS0FBSztBQUFBLE1BQ2hCLE9BQU8sWUFBWTtBQUFBLE1BQ25CLEtBQUssWUFBWSxRQUFRLEtBQUs7QUFBQSxNQUM5QjtBQUFBLE1BQ0EsU0FBUyxxQkFBcUIsSUFBSTtBQUFBLElBQ3BDLENBQUM7QUFBQSxFQUNIO0FBRUEsZUFBYSxLQUFLLENBQUMsR0FBRyxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUs7QUFFN0MsTUFBSSxTQUFTO0FBRWIsYUFBVyxlQUFlLGNBQWM7QUFDdEMsUUFBSSxZQUFZLFFBQVEsUUFBUTtBQUM5QjtBQUFBLElBQ0Y7QUFFQSxRQUFJLFlBQVksUUFBUSxRQUFRO0FBQzlCLGFBQU8sWUFBWSxTQUFTLGVBQWUsS0FBSyxNQUFNLFFBQVEsWUFBWSxLQUFLLENBQUMsQ0FBQztBQUFBLElBQ25GO0FBRUEsV0FBTztBQUFBLE1BQ0wscUJBQXFCLFlBQVksTUFBTSxZQUFZLFNBQVMsVUFBVTtBQUFBLElBQ3hFO0FBRUEsYUFBUyxZQUFZO0FBQUEsRUFDdkI7QUFFQSxNQUFJLFNBQVMsS0FBSyxRQUFRO0FBQ3hCLFdBQU8sWUFBWSxTQUFTLGVBQWUsS0FBSyxNQUFNLE1BQU0sQ0FBQyxDQUFDO0FBQUEsRUFDaEU7QUFDRjtBQUVBLFNBQVMsZ0NBQ1AsUUFDQSxNQUNBLFlBQ007QUFDTixRQUFNLGNBQWM7QUFFcEIsTUFBSSxTQUFTO0FBQ2IsTUFBSTtBQUVKLFVBQVEsUUFBUSxZQUFZLEtBQUssSUFBSSxPQUFPLE1BQU07QUFDaEQsVUFBTSxXQUFXLE1BQU0sQ0FBQztBQUN4QixVQUFNLFFBQVEsTUFBTTtBQUNwQixVQUFNLE1BQU0sUUFBUSxTQUFTO0FBRTdCLFFBQUksUUFBUSxRQUFRO0FBQ2xCLGFBQU8sWUFBWSxTQUFTLGVBQWUsS0FBSyxNQUFNLFFBQVEsS0FBSyxDQUFDLENBQUM7QUFBQSxJQUN2RTtBQUVBLFdBQU87QUFBQSxNQUNMLHFCQUFxQixVQUFVLHFCQUFxQixRQUFRLEdBQUcsVUFBVTtBQUFBLElBQzNFO0FBRUEsYUFBUztBQUFBLEVBQ1g7QUFFQSxNQUFJLFNBQVMsS0FBSyxRQUFRO0FBQ3hCLFdBQU8sWUFBWSxTQUFTLGVBQWUsS0FBSyxNQUFNLE1BQU0sQ0FBQyxDQUFDO0FBQUEsRUFDaEU7QUFDRjtBQUVBLFNBQVMscUJBQ1AsSUFDQSxZQUNBLFVBQ0EsU0FDTTtBQUNOLFFBQU0sRUFBRSxXQUFXLEtBQUssSUFBSSxxQkFBcUIsVUFBVTtBQUUzRCxNQUFJLFdBQVc7QUFDYixPQUFHLFlBQVksV0FBVywrQkFBK0IsR0FBRyxTQUFTLEdBQUcsQ0FBQztBQUFBLEVBQzNFO0FBRUEsUUFBTSxlQUFlLFdBQVcsd0JBQXdCO0FBRXhELE1BQUksU0FBUywrQkFBK0IsUUFBUSxZQUFZO0FBQzlELG9DQUFnQyxjQUFjLE1BQU0sUUFBUSxVQUFVO0FBQUEsRUFDeEUsT0FBTztBQUNMLGlCQUFhLGNBQWM7QUFBQSxFQUM3QjtBQUVBLEtBQUcsWUFBWSxZQUFZO0FBQzdCO0FBRUEsU0FBUyxrQkFBa0IsTUFBK0M7QUFDeEUsUUFBTSxVQUFVLEtBQUssS0FBSztBQUMxQixNQUFJLENBQUMsU0FBUztBQUNaLFdBQU8sRUFBRSxPQUFPLElBQUksTUFBTSxHQUFHO0FBQUEsRUFDL0I7QUFFQSxNQUFJLFFBQWlDO0FBSXJDLFVBQVEsUUFBUSxNQUFNLHNDQUFzQztBQUM1RCxNQUFJLE9BQU87QUFDVCxXQUFPO0FBQUEsTUFDTCxPQUFPLE1BQU0sQ0FBQyxFQUFFLEtBQUs7QUFBQSxNQUNyQixNQUFNLE1BQU0sQ0FBQyxFQUFFLEtBQUs7QUFBQSxJQUN0QjtBQUFBLEVBQ0Y7QUFJQSxVQUFRLFFBQVEsTUFBTSwrQkFBK0I7QUFDckQsTUFBSSxPQUFPO0FBQ1QsV0FBTztBQUFBLE1BQ0wsT0FBTyxNQUFNLENBQUMsRUFBRSxLQUFLO0FBQUEsTUFDckIsTUFBTSxNQUFNLENBQUMsRUFBRSxLQUFLO0FBQUEsSUFDdEI7QUFBQSxFQUNGO0FBSUEsVUFBUSxRQUFRLE1BQU0sd0JBQXdCO0FBQzlDLE1BQUksT0FBTztBQUNULFdBQU87QUFBQSxNQUNMLE9BQU8sTUFBTSxDQUFDLEVBQUUsS0FBSztBQUFBLE1BQ3JCLE1BQU0sTUFBTSxDQUFDLEVBQUUsS0FBSztBQUFBLElBQ3RCO0FBQUEsRUFDRjtBQUtBLFVBQVEsUUFBUSxNQUFNLDJCQUEyQjtBQUNqRCxNQUFJLE9BQU87QUFDVCxXQUFPO0FBQUEsTUFDTCxPQUFPLE1BQU0sQ0FBQyxFQUFFLEtBQUs7QUFBQSxNQUNyQixNQUFNLE1BQU0sQ0FBQyxFQUFFLEtBQUs7QUFBQSxJQUN0QjtBQUFBLEVBQ0Y7QUFFQSxTQUFPLEVBQUUsT0FBTyxJQUFJLE1BQU0sUUFBUTtBQUNwQztBQUVBLFNBQVMsV0FDUCxRQUNBLE9BQ0EsT0FDQSxXQUNBLFVBQ0EsU0FDTTtBQUNOLE1BQUksTUFBTSxXQUFXO0FBQUc7QUFFeEIsUUFBTUMsV0FBVSxVQUFVLG9CQUFvQjtBQUM5QyxFQUFBQSxTQUFRLFlBQVksVUFBVSw0QkFBNEIsS0FBSyxDQUFDO0FBRWhFLFFBQU0sT0FBTyxXQUFXLFNBQVM7QUFFakMsYUFBVyxRQUFRLE9BQU87QUFDeEIsVUFBTSxLQUFLLGVBQWU7QUFFMUIsVUFBTSxFQUFFLE9BQU8sS0FBSyxJQUFJLGtCQUFrQixJQUFJO0FBRTlDLFFBQUksT0FBTztBQUNULFNBQUcsWUFBWSxXQUFXLDRCQUE0QixLQUFLLENBQUM7QUFBQSxJQUM5RDtBQUVBLFFBQUksTUFBTTtBQUNSLFVBQUksT0FBTztBQUNULFdBQUcsWUFBWSxTQUFTLGVBQWUsR0FBRyxDQUFDO0FBQUEsTUFDN0M7QUFDQSxZQUFNLFNBQVMsV0FBVyx5QkFBeUI7QUFFbkQsVUFBSSxTQUFTLCtCQUErQixRQUFRLFlBQVk7QUFFOUQsd0NBQWdDLFFBQVEsTUFBTSxRQUFRLFVBQVU7QUFBQSxNQUVsRSxPQUFPO0FBRUwsZUFBTyxjQUFjO0FBQUEsTUFFdkI7QUFFQSxTQUFHLFlBQVksTUFBTTtBQUFBLElBQ3ZCO0FBRUEsUUFBSSxDQUFDLE9BQU87QUFDVixVQUFJLFNBQVMsK0JBQStCLFFBQVEsWUFBWTtBQUM5RCx3Q0FBZ0MsSUFBSSxNQUFNLFFBQVEsVUFBVTtBQUFBLE1BQzlELE9BQU87QUFDTCxXQUFHLGNBQWM7QUFBQSxNQUNuQjtBQUFBLElBQ0Y7QUFFQSxTQUFLLFlBQVksRUFBRTtBQUFBLEVBQ3JCO0FBRUEsRUFBQUEsU0FBUSxZQUFZLElBQUk7QUFDeEIsU0FBTyxZQUFZQSxRQUFPO0FBQzVCO0FBRU8sU0FBUyxtQkFDZCxXQUNBLFNBQ0EsVUFDQSxXQUFxQixDQUFDLEdBQ3RCLFVBQWdDLENBQUMsR0FDM0I7QUFDTixZQUFVLFlBQVk7QUFFdEIsUUFBTSxPQUFPO0FBQUEsSUFDWDtBQUFBLE1BQ0U7QUFBQSxNQUNBLFNBQVMsY0FBYyxlQUFlO0FBQUEsSUFDeEMsRUFDRyxPQUFPLE9BQU8sRUFDZCxLQUFLLEdBQUc7QUFBQSxFQUNiO0FBRUEsUUFBTSxTQUFTLFVBQVUsbUJBQW1CO0FBQzVDLFNBQU8sWUFBWSxVQUFVLG1CQUFtQixRQUFRLElBQUksQ0FBQztBQUU3RCxRQUFNLE9BQU8sVUFBVSxpQkFBaUI7QUFDeEMsUUFBTSxZQUEyQixDQUFDO0FBRWxDLE1BQUksUUFBUSxPQUFPO0FBQ2pCLGNBQVUsS0FBSyxXQUFXLFFBQVcsU0FBUyxRQUFRLEtBQUssRUFBRSxDQUFDO0FBQUEsRUFDaEU7QUFFQSxNQUFJLFFBQVEsV0FBVztBQUNyQixVQUFNLGdCQUFnQixXQUFXLFFBQVcsTUFBTSxRQUFRLFNBQVMsRUFBRTtBQUNyRSxVQUFNLFVBQVUsa0JBQWtCLFFBQVEsU0FBUztBQUNuRCxRQUFJLFNBQVM7QUFDWCxvQkFBYyxRQUFRO0FBQUEsSUFDeEI7QUFDQSxjQUFVLEtBQUssYUFBYTtBQUFBLEVBQzlCO0FBRUEsWUFBVSxRQUFRLENBQUMsTUFBTSxVQUFVO0FBQ2pDLFNBQUssWUFBWSxJQUFJO0FBRXJCLFFBQUksUUFBUSxVQUFVLFNBQVMsR0FBRztBQUNoQyxXQUFLLFlBQVksV0FBVyxRQUFXLFVBQUssQ0FBQztBQUFBLElBQy9DO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxZQUFZLElBQUk7QUFDdkIsT0FBSyxZQUFZLE1BQU07QUFFdkIsUUFBTSxPQUFPLFVBQVUsaUJBQWlCO0FBQ3hDLE9BQUssWUFBWSxVQUFVLHdCQUF3QixNQUFNLFFBQVEsRUFBRSxFQUFFLENBQUM7QUFDdEUsT0FBSyxZQUFZLFVBQVUsd0JBQXdCLE1BQU0sUUFBUSxFQUFFLEVBQUUsQ0FBQztBQUV0RSxNQUFJLFFBQVEsSUFBSTtBQUNkLFNBQUssWUFBWSxVQUFVLHdCQUF3QixNQUFNLFFBQVEsRUFBRSxFQUFFLENBQUM7QUFBQSxFQUN4RTtBQUVBLE9BQUssWUFBWSxJQUFJO0FBRXJCLE1BQUksUUFBUSxJQUFJLFNBQVMsR0FBRztBQUMxQixVQUFNLGFBQWEsVUFBVSxvQkFBb0I7QUFDakQsZUFBVyxZQUFZLFVBQVUsNEJBQTRCLFNBQVMsQ0FBQztBQUV2RSxVQUFNLFVBQVUsV0FBVyxvQkFBb0I7QUFDL0MsZUFBVyxVQUFVLFFBQVEsS0FBSztBQUNoQyxZQUFNLEtBQUssZUFBZSxtQkFBbUI7QUFDN0MsMkJBQXFCLElBQUksaUJBQWlCLE1BQU0sR0FBRyxVQUFVLE9BQU87QUFDcEUsY0FBUSxZQUFZLEVBQUU7QUFBQSxJQUN4QjtBQUVBLGVBQVcsWUFBWSxPQUFPO0FBQzlCLFNBQUssWUFBWSxVQUFVO0FBQUEsRUFDN0I7QUFFQSxRQUFNLFlBQVksVUFBVSxvQkFBb0I7QUFDaEQsWUFBVSxZQUFZLFVBQVUsNEJBQTRCLFdBQVcsQ0FBQztBQUV4RSxRQUFNLE9BQU8sVUFBVSxzQkFBc0I7QUFDN0MsT0FBSyxZQUFZLFVBQVUsc0JBQXNCLE9BQU8sUUFBUSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQzVFLE9BQUssWUFBWSxVQUFVLHNCQUFzQixPQUFPLFFBQVEsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUM1RSxPQUFLLFlBQVksVUFBVSxzQkFBc0IsT0FBTyxRQUFRLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDNUUsT0FBSyxZQUFZLFVBQVUsc0JBQXNCLE9BQU8sUUFBUSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQzVFLE9BQUssWUFBWSxVQUFVLHNCQUFzQixPQUFPLFFBQVEsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUM1RSxPQUFLLFlBQVksVUFBVSxzQkFBc0IsT0FBTyxRQUFRLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFFNUUsWUFBVSxZQUFZLElBQUk7QUFDMUIsT0FBSyxZQUFZLFNBQVM7QUFFMUIsYUFBVyxNQUFNLFVBQVUsUUFBUSxRQUFRLG1CQUFtQixVQUFVLE9BQU87QUFDL0UsYUFBVyxNQUFNLFlBQVksUUFBUSxVQUFVLG1CQUFtQixVQUFVLE9BQU87QUFDbkYsYUFBVyxNQUFNLFVBQVUsUUFBUSxRQUFRLG1CQUFtQixVQUFVLE9BQU87QUFDL0UsYUFBVyxNQUFNLFFBQVEsUUFBUSxNQUFNLG1CQUFtQixVQUFVLE9BQU87QUFFM0UsTUFBSSxRQUFRLGFBQWE7QUFDdkIsVUFBTSxPQUFPLFVBQVUsb0JBQW9CO0FBQzNDLFNBQUssWUFBWSxVQUFVLDBCQUEwQixRQUFRLFdBQVcsQ0FBQztBQUN6RSxTQUFLLFlBQVksSUFBSTtBQUFBLEVBQ3ZCO0FBRUEsTUFBSSxTQUFTLGNBQWMsUUFBUSxRQUFRO0FBQ3pDLFVBQU0sU0FBUyxVQUFVLG1CQUFtQjtBQUM1QyxXQUFPLFlBQVksV0FBVyxxQkFBcUIsV0FBVyxRQUFRLE1BQU0sRUFBRSxDQUFDO0FBQy9FLFNBQUssWUFBWSxNQUFNO0FBQUEsRUFDekI7QUFFQSxNQUFJLFNBQVMsWUFBWSxRQUFRLEtBQUssU0FBUyxHQUFHO0FBQ2hELFVBQU0sT0FBTyxVQUFVLGlCQUFpQjtBQUN4QyxlQUFXLE9BQU8sUUFBUSxNQUFNO0FBQzlCLFdBQUssWUFBWSxXQUFXLGtCQUFrQixHQUFHLENBQUM7QUFBQSxJQUNwRDtBQUNBLFNBQUssWUFBWSxJQUFJO0FBQUEsRUFDdkI7QUFFQSxNQUFJLFNBQVMsU0FBUyxHQUFHO0FBQ3ZCLFVBQU0sYUFBYSxVQUFVLHdCQUF3QjtBQUNyRCxlQUFXLFdBQVcsVUFBVTtBQUM5QixpQkFBVyxZQUFZLFVBQVUsc0JBQXNCLE9BQU8sQ0FBQztBQUFBLElBQ2pFO0FBQ0EsU0FBSyxZQUFZLFVBQVU7QUFBQSxFQUM3QjtBQUVBLFlBQVUsWUFBWSxJQUFJO0FBQzVCOzs7QUM1Yk8sSUFBTSxvQ0FBa0U7QUFBQSxFQUM3RSxhQUFhO0FBQUEsRUFDYixZQUFZO0FBQUEsRUFDWixVQUFVO0FBQUEsRUFDViw2QkFBNkI7QUFDL0I7OztBSkRPLElBQU0sb0JBQU4sTUFBd0I7QUFBQSxFQUc3QixZQUFZLFFBQW9DO0FBQzlDLFNBQUssU0FBUztBQUFBLEVBQ2hCO0FBQUEsRUFFQSxlQUNFLFNBQ0EsU0FDUTtBQUNSLFVBQU0sUUFBUSxRQUFRLE1BQU0sT0FBTztBQUVuQyxVQUFNLGFBQWEsTUFBTTtBQUFBLE1BQ3ZCLENBQUMsU0FBUyxLQUFLLEtBQUssTUFBTSxNQUFNLE9BQU87QUFBQSxJQUN6QztBQUVBLFFBQUksZUFBZSxJQUFJO0FBQ3JCLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxlQUF5QixDQUFDO0FBRWhDLGFBQVMsSUFBSSxhQUFhLEdBQUcsSUFBSSxNQUFNLFFBQVEsS0FBSztBQUNsRCxZQUFNLE9BQU8sTUFBTSxDQUFDO0FBRXBCLFVBQUksU0FBUyxLQUFLLEtBQUssS0FBSyxDQUFDLEdBQUc7QUFDOUI7QUFBQSxNQUNGO0FBRUEsbUJBQWEsS0FBSyxJQUFJO0FBQUEsSUFDeEI7QUFFQSxXQUFPLGFBQWEsS0FBSyxJQUFJLEVBQUUsS0FBSztBQUFBLEVBQ3RDO0FBQUEsRUFFQSxpQkFDRSxXQUNBLGFBQ007QUFsRFY7QUFtREksVUFBTSxhQUFhLE1BQU0sUUFBUSxZQUFZLFVBQVUsSUFDbkQsWUFBWSxhQUNaLENBQUM7QUFFTCxRQUFJLFdBQVcsV0FBVyxHQUFHO0FBQzNCO0FBQUEsSUFDRjtBQUVBLFVBQU0sZUFBZSxVQUFVLFVBQVU7QUFBQSxNQUN2QyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsaUJBQWEsU0FBUyxNQUFNO0FBQUEsTUFDMUIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sU0FBUyxhQUFhLFNBQVMsSUFBSTtBQUV6QyxlQUFXLFNBQVMsWUFBWTtBQUM5QixZQUFNLFNBQVMsT0FBTyxTQUFTLElBQUk7QUFFbkMsYUFBTyxTQUFTLFFBQVE7QUFBQSxRQUN0QixLQUFLO0FBQUEsUUFDTCxNQUFNLFFBQU8sV0FBTSxlQUFOLFlBQW9CLENBQUM7QUFBQSxNQUNwQyxDQUFDO0FBRUQsYUFBTyxTQUFTLFFBQVE7QUFBQSxRQUN0QixNQUFNLFFBQU8sV0FBTSxTQUFOLFlBQWMsU0FBUztBQUFBLE1BQ3RDLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUFBLEVBRUEsV0FBaUI7QUFDZixTQUFLLE9BQU87QUFBQSxNQUNWLENBQ0UsSUFDQSxRQUNHO0FBQ0gsYUFBSyxLQUFLLFFBQVEsSUFBSSxHQUFHO0FBQUEsTUFDM0I7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSxRQUNKLElBQ0EsS0FDZTtBQWpHbkI7QUFrR0ksVUFBTSxjQUFjLElBQUksZUFBZSxFQUFFO0FBRXpDLFFBQUksQ0FBQyxlQUFlLFlBQVksY0FBYyxHQUFHO0FBQy9DO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FDSixLQUFLLE9BQU8sSUFBSSxNQUFNO0FBQUEsTUFDcEIsSUFBSTtBQUFBLElBQ047QUFFRixRQUFJLEVBQUUsZ0JBQWdCLHlCQUFRO0FBQzVCO0FBQUEsSUFDRjtBQUVBLFVBQU0sUUFDSixLQUFLLE9BQU8sSUFBSSxjQUFjLGFBQWEsSUFBSTtBQUVqRCxVQUFNLGNBQWMsK0JBQU87QUFFM0IsU0FBSSwyQ0FBYSxvQkFBbUIsYUFBYTtBQUMvQztBQUFBLElBQ0Y7QUFFQSxVQUFNLFVBQVUsTUFBTSxLQUFLLE9BQU8sSUFBSSxNQUFNLEtBQUssSUFBSTtBQUVyRCxVQUFNLGlCQUFpQixHQUFHO0FBQUEsTUFDeEI7QUFBQSxJQUNGO0FBRUEsUUFBSSxHQUFHLGNBQWMsd0JBQXdCLEdBQUc7QUFDOUM7QUFBQSxJQUNGO0FBRUEsVUFBTSxZQUFZLEdBQUcsVUFBVTtBQUFBLE1BQzdCLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxjQUFVLFNBQVMsTUFBTTtBQUFBLE1BQ3ZCLE9BQU0saUJBQVksU0FBWixZQUFvQixLQUFLO0FBQUEsSUFDakMsQ0FBQztBQUVELGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLFFBQ0osWUFBWSxhQUNSLGVBQWUsWUFBWSxVQUFVLEtBQ3JDO0FBQUEsUUFDSixZQUFZLFlBQ1IsR0FBRyxZQUFZLFNBQVMsU0FDeEI7QUFBQSxRQUNKLFlBQVksU0FDUixXQUFXLFlBQVksTUFBTSxLQUM3QjtBQUFBLE1BQ04sRUFDRyxPQUFPLE9BQU8sRUFDZCxLQUFLLFVBQUs7QUFBQSxJQUNmLENBQUM7QUFFRCxTQUFLLHFCQUFxQixXQUFXLFdBQVc7QUFDaEQsU0FBSywyQkFBMkIsV0FBVyxXQUFXO0FBQ3RELFNBQUssaUJBQWlCLFdBQVcsV0FBVztBQUFBLEVBQzlDO0FBQUEsRUFFQSx1QkFDRSxhQUNRO0FBcEtaO0FBcUtJLFVBQU0sYUFBYSxRQUFPLGlCQUFZLGVBQVosWUFBMEIsQ0FBQztBQUNyRCxVQUFNLFlBQVksUUFBTyxpQkFBWSxjQUFaLFlBQXlCLENBQUM7QUFFbkQsVUFBTSxXQUFXLE1BQU0sUUFBUSxZQUFZLFFBQVEsSUFDL0MsWUFBWSxXQUNaLENBQUM7QUFFTCxVQUFNLGFBQWEsYUFBYTtBQUVoQyxVQUFNLGVBQWUsU0FBUztBQUFBLE1BQzVCLENBQUMsS0FBYSxZQUFpQztBQS9LckQsWUFBQUMsS0FBQUM7QUFnTFEsY0FBTSxNQUFNLFFBQU9ELE1BQUEsUUFBUSxRQUFSLE9BQUFBLE1BQWUsQ0FBQztBQUNuQyxjQUFNLFFBQVEsUUFBT0MsTUFBQSxRQUFRLFVBQVIsT0FBQUEsTUFBaUIsQ0FBQztBQUV2QyxlQUFPLE1BQU0sTUFBTTtBQUFBLE1BQ3JCO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFFQSxRQUFJLGdCQUFnQixHQUFHO0FBQ3JCLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxRQUFRLGVBQWU7QUFFN0IsUUFBSSxRQUFRLEtBQUs7QUFDZixhQUFPO0FBQUEsSUFDVDtBQUVBLFFBQUksUUFBUSxNQUFNO0FBQ2hCLGFBQU87QUFBQSxJQUNUO0FBRUEsUUFBSSxRQUFRLE1BQU07QUFDaEIsYUFBTztBQUFBLElBQ1Q7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEscUJBQ0UsV0FDQSxhQUNNO0FBaE5WO0FBaU5JLFVBQU0sV0FBVyxNQUFNLFFBQVEsWUFBWSxRQUFRLElBQy9DLFlBQVksV0FDWixDQUFDO0FBRUwsVUFBTSxnQkFBZ0IsU0FBUztBQUFBLE1BQzdCLENBQUMsS0FBYSxZQUE4QjtBQXRObEQsWUFBQUQ7QUF1TlEscUJBQU0sUUFBT0EsTUFBQSxRQUFRLFFBQVIsT0FBQUEsTUFBZSxDQUFDO0FBQUE7QUFBQSxNQUMvQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLGlCQUFpQixTQUFTO0FBRWhDLFFBQUksY0FBYztBQUNsQixRQUFJLGtCQUFrQjtBQUV0QixlQUFXLFdBQVcsVUFBVTtBQUM5QixZQUFNLFFBQVEsT0FBTyxRQUFRLEtBQUs7QUFFbEMsVUFBSSxDQUFDLE9BQU8sTUFBTSxLQUFLLEdBQUc7QUFDeEIsY0FBTSxNQUFNLFFBQU8sYUFBUSxRQUFSLFlBQWUsQ0FBQztBQUVuQyx1QkFBZSxRQUFRO0FBQ3ZCLDJCQUFtQjtBQUFBLE1BQ3JCO0FBQUEsSUFDRjtBQUVBLFVBQU0sZUFDSixrQkFBa0IsSUFDZCxjQUFjLGtCQUNkO0FBRU4sVUFBTSxhQUNKLEtBQUssdUJBQXVCLFdBQVc7QUFFekMsY0FBVSxTQUFTLEtBQUs7QUFBQSxNQUN0QixLQUFLO0FBQUEsTUFDTCxNQUNFLEdBQUcsYUFBYSxvQkFDVixjQUFjLHlCQUNQLGFBQWEsUUFBUSxDQUFDLENBQUMsV0FDOUIsVUFBVTtBQUFBLElBQ3BCLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSwyQkFDRSxXQUNBLGFBQ007QUFoUVY7QUFpUUksVUFBTSxXQUFXLE1BQU0sUUFBUSxZQUFZLFFBQVEsSUFDL0MsWUFBWSxXQUNaLENBQUM7QUFFTCxRQUFJLFNBQVMsV0FBVyxHQUFHO0FBQ3pCLGdCQUFVLFNBQVMsS0FBSztBQUFBLFFBQ3RCLEtBQUs7QUFBQSxRQUNMLE1BQU07QUFBQSxNQUNSLENBQUM7QUFFRDtBQUFBLElBQ0Y7QUFFQSxVQUFNLFdBQVcsVUFBVSxVQUFVO0FBQUEsTUFDbkMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGVBQVcsV0FBVyxVQUFVO0FBQzlCLFlBQU0sT0FBTSxhQUFRLFFBQVIsWUFBZTtBQUMzQixZQUFNLFFBQU8sYUFBUSxTQUFSLFlBQWdCO0FBRTdCLFlBQU0sT0FBTztBQUFBLFFBQ1gsUUFBUSxRQUFRLE1BQU0sUUFBUSxLQUFLLEtBQUs7QUFBQSxRQUN4QyxRQUFRLEtBQUssTUFBTSxRQUFRLEVBQUUsS0FBSztBQUFBLFFBQ2xDLFFBQVEsS0FBSyxNQUFNLFFBQVEsRUFBRSxLQUFLO0FBQUEsTUFDcEMsRUFDRyxPQUFPLE9BQU8sRUFDZCxLQUFLLFVBQUs7QUFFYixZQUFNLFNBQVMsU0FBUyxTQUFTLFVBQVU7QUFBQSxRQUN6QyxLQUFLO0FBQUEsUUFDTCxNQUFNLE9BQ0YsR0FBRyxHQUFHLEtBQUssSUFBSSxXQUFNLElBQUksS0FDekIsR0FBRyxHQUFHLEtBQUssSUFBSTtBQUFBLE1BQ3JCLENBQUM7QUFFRCxhQUFPLGlCQUFpQixTQUFTLENBQUMsVUFBVTtBQUMxQyxhQUFLLG9CQUFvQixPQUFPLE9BQU87QUFBQSxNQUN6QyxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLG9CQUNFLE9BQ0EsU0FDTTtBQTlTVjtBQStTSSxVQUFNLE9BQU8sUUFBUTtBQUNyQixVQUFNLFFBQU8sYUFBUSxTQUFSLFlBQWdCO0FBRTdCLFVBQU0sT0FBTyxJQUFJLHNCQUFLO0FBRXRCLFNBQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsV0FDRyxTQUFTLFFBQVEsSUFBSSxFQUFFLEVBQ3ZCLFFBQVEsWUFBWTtBQUNuQixjQUFNLEtBQUssWUFBWSxNQUFNLFNBQVM7QUFBQSxNQUN4QyxDQUFDO0FBQUEsSUFDTCxDQUFDO0FBRUQsU0FBSyxRQUFRLENBQUMsU0FBUztBQUNyQixXQUNHLFNBQVMsaUJBQWlCLEVBQzFCLFFBQVEsWUFBWTtBQUNuQixjQUFNLEtBQUssWUFBWSxNQUFNLFNBQVM7QUFBQSxNQUN4QyxDQUFDO0FBQUEsSUFDTCxDQUFDO0FBRUQsU0FBSyxRQUFRLENBQUMsU0FBUztBQUNyQixXQUNHLFNBQVMsbUJBQW1CLEVBQzVCLFFBQVEsWUFBWTtBQUNuQixjQUFNLEtBQUssWUFBWSxNQUFNLE9BQU87QUFBQSxNQUN0QyxDQUFDO0FBQUEsSUFDTCxDQUFDO0FBRUQsU0FBSyxhQUFhO0FBRWxCLFNBQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsV0FDRyxTQUFTLG1CQUFtQixFQUM1QixRQUFRLFlBQVk7QUFDbkIsY0FBTSxLQUFLLDRCQUE0QixPQUFPO0FBQUEsTUFDaEQsQ0FBQztBQUFBLElBQ0wsQ0FBQztBQUVELFNBQUssYUFBYTtBQUVsQixTQUFLLFFBQVEsQ0FBQyxTQUFTO0FBQ3JCLFdBQUs7QUFBQSxRQUNIO0FBQUEsVUFDRSxRQUFRLFFBQVEsTUFBTSxRQUFRLEtBQUssS0FBSztBQUFBLFVBQ3hDLFFBQVEsS0FBSyxNQUFNLFFBQVEsRUFBRSxLQUFLO0FBQUEsVUFDbEMsUUFBUSxLQUFLLE1BQU0sUUFBUSxFQUFFLEtBQUs7QUFBQSxRQUNwQyxFQUNHLE9BQU8sT0FBTyxFQUNkLEtBQUssVUFBSyxLQUFLO0FBQUEsTUFDcEI7QUFFQSxXQUFLLFlBQVksSUFBSTtBQUFBLElBQ3ZCLENBQUM7QUFFRCxTQUFLLGlCQUFpQixLQUFLO0FBQUEsRUFDN0I7QUFBQSxFQUVBLE1BQU0sWUFDSixNQUNBLE1BQ2U7QUFDZixRQUFJLE9BQU8sU0FBUyxZQUFZLEtBQUssV0FBVyxHQUFHO0FBQ2pELFVBQUksd0JBQU8seUJBQXlCO0FBQ3BDO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FDSixLQUFLLE9BQU8sSUFBSSxNQUFNLHNCQUFzQixJQUFJO0FBRWxELFFBQUksRUFBRSxnQkFBZ0IseUJBQVE7QUFDNUIsVUFBSSx3QkFBTyx5QkFBeUI7QUFDcEM7QUFBQSxJQUNGO0FBRUEsUUFBSSxTQUFTLFNBQVM7QUFDcEIsWUFBTSxLQUFLLE9BQU8sSUFBSSxVQUNuQixRQUFRLFNBQVMsVUFBVSxFQUMzQixTQUFTLElBQUk7QUFFaEI7QUFBQSxJQUNGO0FBRUEsUUFBSSxTQUFTLFdBQVc7QUFDdEIsWUFBTSxLQUFLLE9BQU8sSUFBSSxVQUNuQixRQUFRLElBQUksRUFDWixTQUFTLElBQUk7QUFFaEI7QUFBQSxJQUNGO0FBRUEsVUFBTSxLQUFLLE9BQU8sSUFBSSxVQUNuQixRQUFRLEtBQUssRUFDYixTQUFTLElBQUk7QUFBQSxFQUNsQjtBQUFBLEVBRUEsTUFBTSw0QkFDSixTQUNlO0FBQ2YsVUFBTSxPQUFPLFFBQVE7QUFFckIsUUFBSSxPQUFPLFNBQVMsWUFBWSxLQUFLLFdBQVcsR0FBRztBQUNqRCxVQUFJLHdCQUFPLHlCQUF5QjtBQUNwQztBQUFBLElBQ0Y7QUFFQSxVQUFNLE9BQ0osS0FBSyxPQUFPLElBQUksTUFBTSxzQkFBc0IsSUFBSTtBQUVsRCxRQUFJLEVBQUUsZ0JBQWdCLHlCQUFRO0FBQzVCLFVBQUksd0JBQU8seUJBQXlCO0FBQ3BDO0FBQUEsSUFDRjtBQUVBLFVBQU0sUUFDSixLQUFLLE9BQU8sSUFBSSxjQUFjLGFBQWEsSUFBSTtBQUVqRCxVQUFNLGNBQWMsK0JBQU87QUFFM0IsUUFBSSxDQUFDLGFBQWE7QUFDaEIsVUFBSSx3QkFBTyw2QkFBNkI7QUFDeEM7QUFBQSxJQUNGO0FBRUEsVUFBTSxTQUFTLGlCQUFpQixXQUFXO0FBRTNDLFFBQUksQ0FBQyxPQUFPLFdBQVcsQ0FBQyxPQUFPLE1BQU07QUFDbkMsVUFBSSx3QkFBTywwQkFBMEI7QUFDckM7QUFBQSxJQUNGO0FBRUEsVUFBTSxZQUFZLFNBQVMsS0FBSyxVQUFVO0FBQUEsTUFDeEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFVBQU0sVUFBVSxVQUFVLFVBQVU7QUFBQSxNQUNsQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQ7QUFBQSxNQUNFO0FBQUEsTUFDQSxPQUFPO0FBQUEsTUFDUDtBQUFBLE1BQ0EsT0FBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLGNBQWMsVUFBVSxTQUFTLFVBQVU7QUFBQSxNQUMvQyxLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsZ0JBQVksaUJBQWlCLFNBQVMsTUFBTTtBQUMxQyxnQkFBVSxPQUFPO0FBQUEsSUFDbkIsQ0FBQztBQUVELGNBQVUsaUJBQWlCLFNBQVMsQ0FBQyxVQUFVO0FBQzdDLFVBQUksTUFBTSxXQUFXLFdBQVc7QUFDOUIsa0JBQVUsT0FBTztBQUFBLE1BQ25CO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUNGOzs7QVB4Y0EsSUFBcUIsNkJBQXJCLGNBQXdELHdCQUFPO0FBQUEsRUFBL0Q7QUFBQTtBQStGRSxTQUFPLE1BQU07QUFBQSxNQUNYLGdCQUFnQixNQUNaLEtBQUssYUFBYSxlQUFlO0FBQUEsSUFDckM7QUFBQTtBQUFBLEVBMUZGLE1BQU0sU0FBd0I7QUFFNUIsWUFBUSxJQUFJLCtCQUErQjtBQUUzQyxTQUFLLGVBQ0gsSUFBSSxhQUFhLEtBQUssR0FBRztBQUUzQixTQUFLLG1CQUNILElBQUksaUJBQWlCLEtBQUssR0FBRztBQUUvQixTQUFLLG9CQUFvQixJQUFJLGtCQUFrQixJQUFJO0FBQ25ELFNBQUssa0JBQWtCLFNBQVM7QUFFaEMsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLE1BQU07QUFDZCxZQUFJO0FBQUEsVUFDSixLQUFLO0FBQUEsVUFDTCxLQUFLO0FBQUEsVUFDTCxLQUFLO0FBQUEsUUFDUCxFQUFFLEtBQUs7QUFBQSxNQUNSO0FBQUEsSUFDRCxDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixlQUFlLENBQUMsYUFBYTtBQUMzQixjQUFNLE9BQU8sS0FBSyxJQUFJLFVBQVUsY0FBYztBQUU5QyxZQUFJLENBQUMsTUFBTTtBQUNULGlCQUFPO0FBQUEsUUFDVDtBQUVBLGNBQU0sUUFBUSxLQUFLLElBQUksY0FBYyxhQUFhLElBQUk7QUFDdEQsY0FBTSxjQUFjLCtCQUFPO0FBRTNCLGFBQUksMkNBQWEsb0JBQW1CLGFBQWE7QUFDL0MsaUJBQU87QUFBQSxRQUNUO0FBRUEsWUFBSSxDQUFDLFVBQVU7QUFDYixjQUFJO0FBQUEsWUFDRixLQUFLO0FBQUEsWUFDTCxLQUFLO0FBQUEsWUFDTCxLQUFLO0FBQUEsWUFDTDtBQUFBLFlBQ0E7QUFBQSxVQUNGLEVBQUUsS0FBSztBQUFBLFFBQ1Q7QUFFQSxlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0YsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sZUFBZSxDQUFDLGFBQWE7QUFDM0IsY0FBTSxPQUFPLEtBQUssSUFBSSxVQUFVLGNBQWM7QUFFOUMsWUFBSSxDQUFDLE1BQU07QUFDVCxpQkFBTztBQUFBLFFBQ1Q7QUFFQSxjQUFNLFFBQVEsS0FBSyxJQUFJLGNBQWMsYUFBYSxJQUFJO0FBQ3RELGNBQU0sY0FBYywrQkFBTztBQUUzQixhQUFJLDJDQUFhLG9CQUFtQixhQUFhO0FBQy9DLGlCQUFPO0FBQUEsUUFDVDtBQUVBLFlBQUksQ0FBQyxVQUFVO0FBQ2IsY0FBSTtBQUFBLFlBQ0YsS0FBSztBQUFBLFlBQ0wsS0FBSztBQUFBLFlBQ0wsS0FBSztBQUFBLFlBQ0w7QUFBQSxVQUNGLEVBQUUsS0FBSztBQUFBLFFBQ1Q7QUFFQSxlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQU9BLFdBQWlCO0FBQ2YsWUFBUSxJQUFJLGlDQUFpQztBQUFBLEVBQy9DO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgIl9iIiwgIl9jIiwgImltcG9ydF9vYnNpZGlhbiIsICJzZWN0aW9uIiwgIl9hIiwgIl9iIl0KfQo=
