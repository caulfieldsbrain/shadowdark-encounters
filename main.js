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
  constructor(app, monsterIndex, encounterService) {
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
  }
  onOpen() {
    this.modalEl.addClass("sd-encounter-modal");
    this.render();
  }
  onClose() {
    this.contentEl.empty();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", {
      text: "Create Shadowdark Encounter"
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
        label: "Create Encounter",
        cta: true,
        onClick: async () => {
          await this.createEncounter();
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
  async createEncounter() {
    const name = this.encounterName.trim();
    if (!name) {
      new import_obsidian3.Notice("Encounter name is required.");
      return;
    }
    try {
      await this.encounterService.createEncounterNote(this.getEncounterData());
      new import_obsidian3.Notice("Encounter created.");
      this.close();
    } catch (error) {
      console.error("Failed to create encounter:", error);
      new import_obsidian3.Notice("Failed to create encounter. Check console.");
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
    container.createEl("p", {
      cls: "sd-encounter-rendered-stats",
      text: `${totalMonsters} Monsters \u2022 ${uniqueMonsters} Unique \u2022 Avg Lv ${averageLevel.toFixed(1)}`
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
      id: "create-test-encounter",
      name: "Create Test Encounter",
      callback: async () => {
        const monsters = this.monsterIndex.getAllMonsters();
        const firstMonster = monsters[0];
        await this.encounterService.createEncounterNote({
          name: "Test Encounter",
          monsters: firstMonster ? [{
            name: firstMonster.name,
            path: firstMonster.path,
            qty: 3
          }] : []
        });
        new import_obsidian5.Notice("Encounter created");
      }
    });
  }
  onunload() {
    console.log("Unloading Shadowdark Encounters");
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL2NvbnN0YW50cy9wbHVnaW4udHMiLCAic3JjL3NlcnZpY2VzL01vbnN0ZXJJbmRleC50cyIsICJzcmMvc2VydmljZXMvRW5jb3VudGVyU2VydmljZS50cyIsICJzcmMvdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlLnRzIiwgInNyYy9tb2RhbHMvQ3JlYXRlRW5jb3VudGVyTW9kYWwudHMiLCAic3JjL2NvbXBvbmVudHMvTW9uc3RlclByZXZpZXdQb3BvdmVyLnRzIiwgInNyYy9yZW5kZXJlcnMvRW5jb3VudGVyUmVuZGVyZXIudHMiLCAic3JjL3N0YXRibG9ja3NDb21wYXQvbm9ybWFsaXplTW9uc3Rlci50cyIsICJzcmMvc3RhdGJsb2Nrc0NvbXBhdC9wYXJzZUZyb250TWF0dGVyLnRzIiwgInNyYy9zdGF0YmxvY2tzQ29tcGF0L3JlbmRlck1vbnN0ZXJCbG9jay50cyIsICJzcmMvc3RhdGJsb2Nrc0NvbXBhdC9zZXR0aW5ncy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgTm90aWNlLCBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgTW9uc3RlckluZGV4IH0gZnJvbSBcIi4vc2VydmljZXMvTW9uc3RlckluZGV4XCI7XG5pbXBvcnQgeyBFbmNvdW50ZXJTZXJ2aWNlIH0gZnJvbSBcIi4vc2VydmljZXMvRW5jb3VudGVyU2VydmljZVwiO1xuaW1wb3J0IHsgQ3JlYXRlRW5jb3VudGVyTW9kYWwgfSBmcm9tIFwiLi9tb2RhbHMvQ3JlYXRlRW5jb3VudGVyTW9kYWxcIjtcblxuaW1wb3J0IHsgRW5jb3VudGVyUmVuZGVyZXIgfSBmcm9tIFwiLi9yZW5kZXJlcnMvRW5jb3VudGVyUmVuZGVyZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXG4gIG1vbnN0ZXJJbmRleCE6IE1vbnN0ZXJJbmRleDtcblxuICBlbmNvdW50ZXJTZXJ2aWNlITogRW5jb3VudGVyU2VydmljZTtcblxuICBlbmNvdW50ZXJSZW5kZXJlciE6IEVuY291bnRlclJlbmRlcmVyO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgIGNvbnNvbGUubG9nKFwiTG9hZGluZyBTaGFkb3dkYXJrIEVuY291bnRlcnNcIik7XG5cbiAgICB0aGlzLm1vbnN0ZXJJbmRleCA9XG4gICAgICBuZXcgTW9uc3RlckluZGV4KHRoaXMuYXBwKTtcblxuICAgIHRoaXMuZW5jb3VudGVyU2VydmljZSA9XG4gICAgICBuZXcgRW5jb3VudGVyU2VydmljZSh0aGlzLmFwcCk7XG5cbiAgICB0aGlzLmVuY291bnRlclJlbmRlcmVyID0gbmV3IEVuY291bnRlclJlbmRlcmVyKHRoaXMpO1xuICAgIHRoaXMuZW5jb3VudGVyUmVuZGVyZXIucmVnaXN0ZXIoKTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJjcmVhdGUtc2hhZG93ZGFyay1lbmNvdW50ZXJcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlIFNoYWRvd2RhcmsgRW5jb3VudGVyXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICBuZXcgQ3JlYXRlRW5jb3VudGVyTW9kYWwoXG4gICAgICAgIHRoaXMuYXBwLFxuICAgICAgICB0aGlzLm1vbnN0ZXJJbmRleCxcbiAgICAgICAgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlXG4gICAgICApLm9wZW4oKTtcbiAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImNyZWF0ZS10ZXN0LWVuY291bnRlclwiLFxuICAgICAgbmFtZTogXCJDcmVhdGUgVGVzdCBFbmNvdW50ZXJcIixcblxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcblxuICAgICAgICBjb25zdCBtb25zdGVycyA9XG4gICAgICAgICAgdGhpcy5tb25zdGVySW5kZXguZ2V0QWxsTW9uc3RlcnMoKTtcblxuICAgICAgICBjb25zdCBmaXJzdE1vbnN0ZXIgPSBtb25zdGVyc1swXTtcblxuICAgICAgICBhd2FpdCB0aGlzLmVuY291bnRlclNlcnZpY2VcbiAgICAgICAgICAuY3JlYXRlRW5jb3VudGVyTm90ZSh7XG4gICAgICAgICAgICBuYW1lOiBcIlRlc3QgRW5jb3VudGVyXCIsXG5cbiAgICAgICAgICAgIG1vbnN0ZXJzOiBmaXJzdE1vbnN0ZXJcbiAgICAgICAgICAgICAgPyBbe1xuICAgICAgICAgICAgICAgICAgbmFtZTogZmlyc3RNb25zdGVyLm5hbWUsXG4gICAgICAgICAgICAgICAgICBwYXRoOiBmaXJzdE1vbnN0ZXIucGF0aCxcbiAgICAgICAgICAgICAgICAgIHF0eTogM1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgIDogW11cbiAgICAgICAgICB9KTtcblxuICAgICAgICBuZXcgTm90aWNlKFwiRW5jb3VudGVyIGNyZWF0ZWRcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYXBpID0ge1xuICAgIGdldEFsbE1vbnN0ZXJzOiAoKSA9PlxuICAgICAgICB0aGlzLm1vbnN0ZXJJbmRleC5nZXRBbGxNb25zdGVycygpXG4gICAgfTtcblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICBjb25zb2xlLmxvZyhcIlVubG9hZGluZyBTaGFkb3dkYXJrIEVuY291bnRlcnNcIik7XG4gIH1cbn0iLCAiZXhwb3J0IGNvbnN0IFBMVUdJTl9JRCA9IFwic2hhZG93ZGFyay1lbmNvdW50ZXJzXCI7XG5cbmV4cG9ydCBjb25zdCBFTkNPVU5URVJfVFlQRSA9IFwiZW5jb3VudGVyXCI7XG5cbmV4cG9ydCBjb25zdCBNT05TVEVSX1RZUEUgPSBcIm1vbnN0ZXJcIjsiLCAiaW1wb3J0IHsgQXBwLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgTU9OU1RFUl9UWVBFIH0gZnJvbSBcIi4uL2NvbnN0YW50cy9wbHVnaW5cIjtcbmltcG9ydCB7IE1vbnN0ZXJTdW1tYXJ5IH0gZnJvbSBcIi4uL3R5cGVzL2VuY291bnRlcnNcIjtcblxuZXhwb3J0IGNsYXNzIE1vbnN0ZXJJbmRleCB7XG4gIGFwcDogQXBwO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gIH1cblxuICBzZWFyY2hNb25zdGVycyhxdWVyeTogc3RyaW5nKTogTW9uc3RlclN1bW1hcnlbXSB7XG4gICAgY29uc3QgbG93ZXIgPSBxdWVyeS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuICAgIGlmICghbG93ZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QWxsTW9uc3RlcnMoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5nZXRBbGxNb25zdGVycygpLmZpbHRlcigobW9uc3RlcikgPT5cbiAgICAgICAgbW9uc3Rlci5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMobG93ZXIpXG4gICAgKTtcbn1cblxuICBnZXRBbGxNb25zdGVycygpOiBNb25zdGVyU3VtbWFyeVtdIHtcbiAgICBjb25zdCBmaWxlcyA9IHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcblxuICAgIGNvbnN0IG1vbnN0ZXJzOiBNb25zdGVyU3VtbWFyeVtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgIGNvbnN0IG1vbnN0ZXIgPSB0aGlzLmdldE1vbnN0ZXJGcm9tRmlsZShmaWxlKTtcblxuICAgICAgaWYgKG1vbnN0ZXIpIHtcbiAgICAgICAgbW9uc3RlcnMucHVzaChtb25zdGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbW9uc3RlcnMuc29ydCgoYSwgYikgPT5cbiAgICAgIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSlcbiAgICApO1xuICB9XG5cbiAgZ2V0TW9uc3RlckZyb21GaWxlKGZpbGU6IFRGaWxlKTogTW9uc3RlclN1bW1hcnkgfCBudWxsIHtcbiAgICBjb25zdCBjYWNoZSA9XG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcblxuICAgIGNvbnN0IGZyb250bWF0dGVyID0gY2FjaGU/LmZyb250bWF0dGVyO1xuXG4gICAgaWYgKCFmcm9udG1hdHRlcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGZyb250bWF0dGVyLnNoYWRvd2RhcmtUeXBlICE9PSBNT05TVEVSX1RZUEUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBmcm9udG1hdHRlci5uYW1lIHx8IGZpbGUuYmFzZW5hbWUsXG4gICAgICBwYXRoOiBmaWxlLnBhdGgsXG5cbiAgICAgIGxldmVsOiBmcm9udG1hdHRlci5sZXZlbCxcbiAgICAgIGFjOiBmcm9udG1hdHRlci5hYyxcbiAgICAgIGhwOiBmcm9udG1hdHRlci5ocCxcblxuICAgICAgYXRrOiBBcnJheS5pc0FycmF5KGZyb250bWF0dGVyLmF0aylcbiAgICAgICAgICA/IGZyb250bWF0dGVyLmF0a1swXVxuICAgICAgICAgIDogZnJvbnRtYXR0ZXIuYXRrLFxuXG4gICAgICB0cmFpdHM6IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIudHJhaXRzKVxuICAgICAgICAgID8gZnJvbnRtYXR0ZXIudHJhaXRzLnNsaWNlKDAsIDIpXG4gICAgICAgICAgOiBbXSxcblxuICAgICAgdGFnczogZnJvbnRtYXR0ZXIudGFncyB8fCBbXVxuICAgIH07XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBub3JtYWxpemVQYXRoLCBURm9sZGVyIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IEVuY291bnRlckRhdGEgfSBmcm9tIFwiLi4vdHlwZXMvZW5jb3VudGVyc1wiO1xuaW1wb3J0IHsgZ2VuZXJhdGVFbmNvdW50ZXJNYXJrZG93biB9IGZyb20gXCIuLi90ZW1wbGF0ZXMvZW5jb3VudGVyVGVtcGxhdGVcIjtcblxuZXhwb3J0IGNsYXNzIEVuY291bnRlclNlcnZpY2Uge1xuICBhcHA6IEFwcDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlRW5jb3VudGVyTm90ZShlbmNvdW50ZXI6IEVuY291bnRlckRhdGEpIHtcbiAgICBjb25zdCBjb250ZW50ID0gZ2VuZXJhdGVFbmNvdW50ZXJNYXJrZG93bihlbmNvdW50ZXIpO1xuXG4gICAgY29uc3Qgc2FmZU5hbWUgPSBlbmNvdW50ZXIubmFtZVxuICAgICAgLnJlcGxhY2UoL1tcXFxcLzoqP1wiPD58XS9nLCBcIlwiKVxuICAgICAgLnRyaW0oKTtcblxuICAgIGNvbnN0IGZvbGRlclBhdGggPSBcIkVuY291bnRlcnNcIjtcbiAgICBjb25zdCBmaWxlUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7Zm9sZGVyUGF0aH0vJHtzYWZlTmFtZX0ubWRgKTtcblxuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKGZvbGRlclBhdGgpO1xuXG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShmaWxlUGF0aCwgY29udGVudCk7XG5cbiAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKS5vcGVuRmlsZShmaWxlKTtcblxuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgZW5zdXJlRm9sZGVyKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuXG4gICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihwYXRoKTtcbiAgfVxufSIsICJpbXBvcnQgeyBFbmNvdW50ZXJEYXRhIH0gZnJvbSBcIi4uL3R5cGVzL2VuY291bnRlcnNcIjtcblxuZnVuY3Rpb24geWFtbFN0cmluZyh2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlID8/IFwiXCIpO1xufVxuXG5mdW5jdGlvbiBzZWN0aW9uKHRpdGxlOiBzdHJpbmcsIGNvbnRlbnQ/OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYCMjICR7dGl0bGV9XG5cbiR7Y29udGVudD8udHJpbSgpIHx8IFwiXCJ9XG5gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVFbmNvdW50ZXJNYXJrZG93bihcbiAgZW5jb3VudGVyOiBFbmNvdW50ZXJEYXRhXG4pOiBzdHJpbmcge1xuICBjb25zdCBtb25zdGVyRnJvbnRtYXR0ZXIgPSBlbmNvdW50ZXIubW9uc3RlcnNcbiAgICAubWFwKChtb25zdGVyKSA9PiB7XG4gICAgICByZXR1cm4gYCAgLSBuYW1lOiAke3lhbWxTdHJpbmcobW9uc3Rlci5uYW1lKX1cbiAgICBxdHk6ICR7bW9uc3Rlci5xdHl9XG4gICAgcGF0aDogJHt5YW1sU3RyaW5nKG1vbnN0ZXIucGF0aCl9XG4gICAgbGV2ZWw6ICR7eWFtbFN0cmluZyhtb25zdGVyLmxldmVsKX1cbiAgICBhYzogJHt5YW1sU3RyaW5nKG1vbnN0ZXIuYWMpfVxuICAgIGhwOiAke3lhbWxTdHJpbmcobW9uc3Rlci5ocCl9YDtcbiAgICB9KVxuICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gIHJldHVybiBgLS0tXG5zaGFkb3dkYXJrVHlwZTogZW5jb3VudGVyXG5uYW1lOiAke3lhbWxTdHJpbmcoZW5jb3VudGVyLm5hbWUpfVxuc3RhdHVzOiBwbGFubmVkXG5cbnBhcnR5TGV2ZWw6ICR7ZW5jb3VudGVyLnBhcnR5TGV2ZWwgPz8gMX1cbnBhcnR5U2l6ZTogJHtlbmNvdW50ZXIucGFydHlTaXplID8/IDR9XG5cbnRlcnJhaW46ICR7eWFtbFN0cmluZyhlbmNvdW50ZXIudGVycmFpbil9XG5saWdodDogJHt5YW1sU3RyaW5nKGVuY291bnRlci5saWdodCl9XG5cbm1vbnN0ZXJzOlxuJHttb25zdGVyRnJvbnRtYXR0ZXIgfHwgXCIgIFtdXCJ9XG5cbnRhZ3M6XG4gIC0gc2hhZG93ZGFyay9lbmNvdW50ZXJcbi0tLVxuXG4ke3NlY3Rpb24oXCJTZXR1cFwiLCBlbmNvdW50ZXIuc2V0dXApfVxuJHtzZWN0aW9uKFwiUmVhZC1BbG91ZFwiLCBlbmNvdW50ZXIucmVhZEFsb3VkKX1cbiR7c2VjdGlvbihcIlRhY3RpY3NcIiwgZW5jb3VudGVyLnRhY3RpY3MpfVxuJHtzZWN0aW9uKFwiVHJlYXN1cmVcIiwgZW5jb3VudGVyLnRyZWFzdXJlKX1cbiR7c2VjdGlvbihcIk5vdGVzXCIsIGVuY291bnRlci5ub3Rlcyl9XG5gO1xufSIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgc2hvd01vbnN0ZXJQcmV2aWV3IH0gZnJvbSBcIi4uL2NvbXBvbmVudHMvTW9uc3RlclByZXZpZXdQb3BvdmVyXCI7XG5pbXBvcnQgeyBFbmNvdW50ZXJTZXJ2aWNlIH0gZnJvbSBcIi4uL3NlcnZpY2VzL0VuY291bnRlclNlcnZpY2VcIjtcbmltcG9ydCB7IE1vbnN0ZXJJbmRleCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9Nb25zdGVySW5kZXhcIjtcbmltcG9ydCB7IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24gfSBmcm9tIFwiLi4vdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlXCI7XG5pbXBvcnQgeyBFbmNvdW50ZXJEYXRhLCBNb25zdGVyUmVmZXJlbmNlLCBNb25zdGVyU3VtbWFyeSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbnR5cGUgRW5jb3VudGVyV2l6YXJkU3RlcCA9IFwibW9uc3RlcnNcIiB8IFwiZGV0YWlsc1wiIHwgXCJwcmV2aWV3XCI7XG5cbmV4cG9ydCBjbGFzcyBDcmVhdGVFbmNvdW50ZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgbW9uc3RlckluZGV4OiBNb25zdGVySW5kZXg7XG4gIGVuY291bnRlclNlcnZpY2U6IEVuY291bnRlclNlcnZpY2U7XG5cbiAgY3VycmVudFN0ZXA6IEVuY291bnRlcldpemFyZFN0ZXAgPSBcIm1vbnN0ZXJzXCI7XG5cbiAgZW5jb3VudGVyTmFtZSA9IFwiXCI7XG5cbiAgc2VsZWN0ZWRNb25zdGVyczogTW9uc3RlclJlZmVyZW5jZVtdID0gW107XG5cbiAgbW9uc3RlclNlYXJjaCA9IFwiXCI7XG4gIGxldmVsRmlsdGVyID0gXCJcIjtcbiAgdGFnRmlsdGVyID0gXCJcIjtcbiAgc29ydE1vZGUgPSBcIm5hbWUtYXNjXCI7XG5cbiAgcGFydHlMZXZlbCA9IDE7XG4gIHBhcnR5U2l6ZSA9IDQ7XG5cbiAgc2V0dXAgPSBcIlwiO1xuICByZWFkQWxvdWQgPSBcIlwiO1xuICB0YWN0aWNzID0gXCJcIjtcbiAgdHJlYXN1cmUgPSBcIlwiO1xuICBub3RlcyA9IFwiXCI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgbW9uc3RlckluZGV4OiBNb25zdGVySW5kZXgsXG4gICAgZW5jb3VudGVyU2VydmljZTogRW5jb3VudGVyU2VydmljZVxuICApIHtcbiAgICBzdXBlcihhcHApO1xuXG4gICAgdGhpcy5tb25zdGVySW5kZXggPSBtb25zdGVySW5kZXg7XG4gICAgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlID0gZW5jb3VudGVyU2VydmljZTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLm1vZGFsRWwuYWRkQ2xhc3MoXCJzZC1lbmNvdW50ZXItbW9kYWxcIik7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHJlbmRlcigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcblxuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwge1xuICAgICAgdGV4dDogXCJDcmVhdGUgU2hhZG93ZGFyayBFbmNvdW50ZXJcIlxuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJTdGVwSW5kaWNhdG9yKGNvbnRlbnRFbCk7XG5cbiAgICBpZiAodGhpcy5jdXJyZW50U3RlcCA9PT0gXCJtb25zdGVyc1wiKSB7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJTdGVwKGNvbnRlbnRFbCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY3VycmVudFN0ZXAgPT09IFwiZGV0YWlsc1wiKSB7XG4gICAgICB0aGlzLnJlbmRlckRldGFpbHNTdGVwKGNvbnRlbnRFbCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZW5kZXJQcmV2aWV3U3RlcChjb250ZW50RWwpO1xuICB9XG5cbiAgcmVuZGVyU3RlcEluZGljYXRvcihjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zdGVwLWluZGljYXRvclwiLFxuICAgICAgdGV4dDpcbiAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9PT0gXCJtb25zdGVyc1wiXG4gICAgICAgICAgPyBcIlN0ZXAgMSBvZiAzOiBBZGQgTW9uc3RlcnNcIlxuICAgICAgICAgIDogdGhpcy5jdXJyZW50U3RlcCA9PT0gXCJkZXRhaWxzXCJcbiAgICAgICAgICAgID8gXCJTdGVwIDIgb2YgMzogQWRkIERldGFpbHNcIlxuICAgICAgICAgICAgOiBcIlN0ZXAgMyBvZiAzOiBQcmV2aWV3XCJcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlck1vbnN0ZXJTdGVwKGNvbnRlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkVuY291bnRlciBuYW1lXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiR29ibGluIEFtYnVzaFwiKTtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZSh0aGlzLmVuY291bnRlck5hbWUpO1xuXG4gICAgICAgIHRleHQub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5lbmNvdW50ZXJOYW1lID0gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBjb25zdCBidWlsZGVyRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItYnVpbGRlclwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBicm93c2VyRWwgPSBidWlsZGVyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItYnJvd3NlclwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBkcmFmdEVsID0gYnVpbGRlckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRyYWZ0XCJcbiAgICB9KTtcblxuICAgIGJyb3dzZXJFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IFwiTW9uc3RlciBCcm93c2VyXCJcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyRmlsdGVyUm93KGJyb3dzZXJFbCk7XG5cbiAgICBjb25zdCByZXN1bHRzRWwgPSBicm93c2VyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItbW9uc3Rlci1yZXN1bHRzXCJcbiAgICB9KTtcblxuICAgIHJlc3VsdHNFbC5kYXRhc2V0LnJvbGUgPSBcIm1vbnN0ZXItcmVzdWx0c1wiO1xuXG4gICAgZHJhZnRFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IFwiRW5jb3VudGVyIERyYWZ0XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlbGVjdGVkRWwgPSBkcmFmdEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXNlbGVjdGVkLW1vbnN0ZXJzXCJcbiAgICB9KTtcblxuICAgIHNlbGVjdGVkRWwuZGF0YXNldC5yb2xlID0gXCJzZWxlY3RlZC1tb25zdGVyc1wiO1xuXG4gICAgY29uc3Qgc3VtbWFyeUVsID0gZHJhZnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zdW1tYXJ5XCJcbiAgICB9KTtcblxuICAgIHN1bW1hcnlFbC5kYXRhc2V0LnJvbGUgPSBcImVuY291bnRlci1zdW1tYXJ5XCI7XG5cbiAgICBjb25zdCBidXR0b25FbCA9IGRyYWZ0RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItY3JlYXRlLWJ1dHRvblwiXG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhidXR0b25FbClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT4ge1xuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIk5leHRcIilcbiAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZW5jb3VudGVyTmFtZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBuYW1lIGlzIHJlcXVpcmVkLlwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gXCJkZXRhaWxzXCI7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgdGhpcy5yZW5kZXJTZWxlY3RlZE1vbnN0ZXJzKCk7XG4gICAgdGhpcy5yZW5kZXJFbmNvdW50ZXJTdW1tYXJ5KCk7XG4gIH1cblxuICByZW5kZXJGaWx0ZXJSb3coYnJvd3NlckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IGZpbHRlclJvdyA9IGJyb3dzZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1maWx0ZXItcm93XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlYXJjaEZpZWxkID0gZmlsdGVyUm93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBzZWFyY2hGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiU2VhcmNoXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlYXJjaElucHV0ID0gc2VhcmNoRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlNlYXJjaCBtb25zdGVycy4uLlwiXG4gICAgfSk7XG5cbiAgICBzZWFyY2hJbnB1dC52YWx1ZSA9IHRoaXMubW9uc3RlclNlYXJjaDtcblxuICAgIHNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLm1vbnN0ZXJTZWFyY2ggPSBzZWFyY2hJbnB1dC52YWx1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9uc3RlclJlc3VsdHMoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGxldmVsRmllbGQgPSBmaWx0ZXJSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZmlsdGVyLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIGxldmVsRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIkxldmVsXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGxldmVsU2VsZWN0ID0gbGV2ZWxGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiKTtcblxuICAgIGxldmVsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiQW55XCIsXG4gICAgICB2YWx1ZTogXCJcIlxuICAgIH0pO1xuXG4gICAgZm9yIChsZXQgbGV2ZWwgPSAwOyBsZXZlbCA8PSAxMDsgbGV2ZWwrKykge1xuICAgICAgbGV2ZWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgICB0ZXh0OiBTdHJpbmcobGV2ZWwpLFxuICAgICAgICB2YWx1ZTogU3RyaW5nKGxldmVsKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbGV2ZWxTZWxlY3QudmFsdWUgPSB0aGlzLmxldmVsRmlsdGVyO1xuXG4gICAgbGV2ZWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmxldmVsRmlsdGVyID0gbGV2ZWxTZWxlY3QudmFsdWU7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0YWdGaWVsZCA9IGZpbHRlclJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1maWx0ZXItZmllbGRcIlxuICAgIH0pO1xuXG4gICAgdGFnRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIlRhZ1wiXG4gICAgfSk7XG5cbiAgICBjb25zdCB0YWdTZWxlY3QgPSB0YWdGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiKTtcblxuICAgIHRhZ1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIkFueVwiLFxuICAgICAgdmFsdWU6IFwiXCJcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgdGFnIG9mIHRoaXMuZ2V0QXZhaWxhYmxlVGFncygpKSB7XG4gICAgICB0YWdTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgICB0ZXh0OiB0YWcsXG4gICAgICAgIHZhbHVlOiB0YWdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRhZ1NlbGVjdC52YWx1ZSA9IHRoaXMudGFnRmlsdGVyO1xuXG4gICAgdGFnU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgdGhpcy50YWdGaWx0ZXIgPSB0YWdTZWxlY3QudmFsdWU7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3J0RmllbGQgPSBmaWx0ZXJSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZmlsdGVyLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIHNvcnRGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiU29ydFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3J0U2VsZWN0ID0gc29ydEZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuXG4gICAgc29ydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIk5hbWUgQS1aXCIsXG4gICAgICB2YWx1ZTogXCJuYW1lLWFzY1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTmFtZSBaLUFcIixcbiAgICAgIHZhbHVlOiBcIm5hbWUtZGVzY1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTGV2ZWwgTG93LUhpZ2hcIixcbiAgICAgIHZhbHVlOiBcImxldmVsLWFzY1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTGV2ZWwgSGlnaC1Mb3dcIixcbiAgICAgIHZhbHVlOiBcImxldmVsLWRlc2NcIlxuICAgIH0pO1xuXG4gICAgc29ydFNlbGVjdC52YWx1ZSA9IHRoaXMuc29ydE1vZGU7XG5cbiAgICBzb3J0U2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5zb3J0TW9kZSA9IHNvcnRTZWxlY3QudmFsdWU7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJEZXRhaWxzU3RlcChjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgZGV0YWlsc0VsID0gY29udGVudEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRldGFpbHMtc3RlcFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBwYXJ0eVJvdyA9IGRldGFpbHNFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1wYXJ0eS1yb3dcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgbGV2ZWxGaWVsZCA9IHBhcnR5Um93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXBhcnR5LWZpZWxkXCJcbiAgICB9KTtcblxuICAgIGxldmVsRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIlBhcnR5IExldmVsXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGxldmVsSW5wdXQgPSBsZXZlbEZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJudW1iZXJcIlxuICAgIH0pO1xuXG4gICAgbGV2ZWxJbnB1dC52YWx1ZSA9IFN0cmluZyh0aGlzLnBhcnR5TGV2ZWwpO1xuXG4gICAgbGV2ZWxJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlcihsZXZlbElucHV0LnZhbHVlKTtcblxuICAgICAgdGhpcy5wYXJ0eUxldmVsID1cbiAgICAgICAgTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgJiYgcGFyc2VkID4gMFxuICAgICAgICAgID8gTWF0aC5mbG9vcihwYXJzZWQpXG4gICAgICAgICAgOiAxO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgc2l6ZUZpZWxkID0gcGFydHlSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcGFydHktZmllbGRcIlxuICAgIH0pO1xuXG4gICAgc2l6ZUZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJQYXJ0eSBTaXplXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNpemVJbnB1dCA9IHNpemVGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwibnVtYmVyXCJcbiAgICB9KTtcblxuICAgIHNpemVJbnB1dC52YWx1ZSA9IFN0cmluZyh0aGlzLnBhcnR5U2l6ZSk7XG5cbiAgICBzaXplSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIoc2l6ZUlucHV0LnZhbHVlKTtcblxuICAgICAgdGhpcy5wYXJ0eVNpemUgPVxuICAgICAgICBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPiAwXG4gICAgICAgICAgPyBNYXRoLmZsb29yKHBhcnNlZClcbiAgICAgICAgICA6IDQ7XG4gICAgfSk7XG5cbiAgICBkZXRhaWxzRWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQWRkIG9wdGlvbmFsIEdNLWZhY2luZyBkZXRhaWxzIGZvciB0aGlzIGVuY291bnRlci5cIlxuICAgIH0pO1xuXG4gICAgY29uc3QgZGV0YWlsc0dyaWQgPSBkZXRhaWxzRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZGV0YWlscy1ncmlkXCJcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkVGV4dEFyZWFGaWVsZChkZXRhaWxzR3JpZCwgXCJTZXR1cFwiLCB0aGlzLnNldHVwLCAodmFsdWUpID0+IHtcbiAgICAgIHRoaXMuc2V0dXAgPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkVGV4dEFyZWFGaWVsZChkZXRhaWxzR3JpZCwgXCJSZWFkLUFsb3VkXCIsIHRoaXMucmVhZEFsb3VkLCAodmFsdWUpID0+IHtcbiAgICAgIHRoaXMucmVhZEFsb3VkID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFRleHRBcmVhRmllbGQoZGV0YWlsc0dyaWQsIFwiVGFjdGljc1wiLCB0aGlzLnRhY3RpY3MsICh2YWx1ZSkgPT4ge1xuICAgICAgdGhpcy50YWN0aWNzID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFRleHRBcmVhRmllbGQoZGV0YWlsc0dyaWQsIFwiVHJlYXN1cmVcIiwgdGhpcy50cmVhc3VyZSwgKHZhbHVlKSA9PiB7XG4gICAgICB0aGlzLnRyZWFzdXJlID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICBjb25zdCBub3Rlc0ZpZWxkID0gZGV0YWlsc0VsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRldGFpbHMtZmllbGQgc2QtZW5jb3VudGVyLW5vdGVzLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIG5vdGVzRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIk5vdGVzXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IG5vdGVzQXJlYSA9IG5vdGVzRmllbGQuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiKTtcblxuICAgIG5vdGVzQXJlYS52YWx1ZSA9IHRoaXMubm90ZXM7XG4gICAgbm90ZXNBcmVhLnJvd3MgPSA0O1xuXG4gICAgbm90ZXNBcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLm5vdGVzID0gbm90ZXNBcmVhLnZhbHVlO1xuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJGb290ZXJCdXR0b25zKGNvbnRlbnRFbCwgW1xuICAgICAge1xuICAgICAgICBsYWJlbDogXCJCYWNrXCIsXG4gICAgICAgIG9uQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gXCJtb25zdGVyc1wiO1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIlNraXAgRGV0YWlsc1wiLFxuICAgICAgICBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IFwicHJldmlld1wiO1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIlByZXZpZXdcIixcbiAgICAgICAgY3RhOiB0cnVlLFxuICAgICAgICBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IFwicHJldmlld1wiO1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdKTtcbiAgfVxuXG4gIGFkZFRleHRBcmVhRmllbGQoXG4gICAgY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LFxuICAgIGxhYmVsOiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZyxcbiAgICBvbkNoYW5nZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWRcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgZmllbGRFbCA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRldGFpbHMtZmllbGRcIlxuICAgIH0pO1xuXG4gICAgZmllbGRFbC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IGxhYmVsXG4gICAgfSk7XG5cbiAgICBjb25zdCB0ZXh0YXJlYSA9IGZpZWxkRWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiKTtcblxuICAgIHRleHRhcmVhLnZhbHVlID0gdmFsdWU7XG4gICAgdGV4dGFyZWEucm93cyA9IDQ7XG5cbiAgICB0ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgb25DaGFuZ2UodGV4dGFyZWEudmFsdWUpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyUHJldmlld1N0ZXAoY29udGVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IGVuY291bnRlciA9IHRoaXMuZ2V0RW5jb3VudGVyRGF0YSgpO1xuXG4gICAgY29uc3QgcHJldmlld0VsID0gY29udGVudEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXByZXZpZXctc3RlcFwiXG4gICAgfSk7XG5cbiAgICBwcmV2aWV3RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiUHJldmlldyB0aGUgbWFya2Rvd24gdGhhdCB3aWxsIGJlIGNyZWF0ZWQuXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IG1hcmtkb3duUHJldmlldyA9IHByZXZpZXdFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItbWFya2Rvd24tcHJldmlld1wiXG4gICAgfSk7XG5cbiAgICBtYXJrZG93blByZXZpZXcudmFsdWUgPSBnZW5lcmF0ZUVuY291bnRlck1hcmtkb3duKGVuY291bnRlcik7XG4gICAgbWFya2Rvd25QcmV2aWV3LnJlYWRPbmx5ID0gdHJ1ZTtcblxuICAgIHRoaXMucmVuZGVyRm9vdGVyQnV0dG9ucyhjb250ZW50RWwsIFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiQmFja1wiLFxuICAgICAgICBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IFwiZGV0YWlsc1wiO1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIkNyZWF0ZSBFbmNvdW50ZXJcIixcbiAgICAgICAgY3RhOiB0cnVlLFxuICAgICAgICBvbkNsaWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5jcmVhdGVFbmNvdW50ZXIoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0pO1xuICB9XG5cbiAgcmVuZGVyRm9vdGVyQnV0dG9ucyhcbiAgICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQsXG4gICAgYnV0dG9uczoge1xuICAgICAgbGFiZWw6IHN0cmluZztcbiAgICAgIGN0YT86IGJvb2xlYW47XG4gICAgICBvbkNsaWNrOiAoKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbiAgICB9W11cbiAgKTogdm9pZCB7XG5cbiAgICBjb25zdCBmb290ZXJFbCA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXdpemFyZC1mb290ZXJcIlxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBidXR0b25Db25maWcgb2YgYnV0dG9ucykge1xuXG4gICAgICBjb25zdCBidXR0b24gPSBmb290ZXJFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIHRleHQ6IGJ1dHRvbkNvbmZpZy5sYWJlbFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChidXR0b25Db25maWcuY3RhKSB7XG4gICAgICAgIGJ1dHRvbi5hZGRDbGFzcyhcIm1vZC1jdGFcIik7XG4gICAgICB9XG5cbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIGJ1dHRvbkNvbmZpZy5vbkNsaWNrKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBnZXRFbmNvdW50ZXJEYXRhKCk6IEVuY291bnRlckRhdGEge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiB0aGlzLmVuY291bnRlck5hbWUudHJpbSgpLFxuICAgICAgcGFydHlMZXZlbDogdGhpcy5wYXJ0eUxldmVsLFxuICAgICAgcGFydHlTaXplOiB0aGlzLnBhcnR5U2l6ZSxcbiAgICAgIG1vbnN0ZXJzOiB0aGlzLnNlbGVjdGVkTW9uc3RlcnMsXG4gICAgICBzZXR1cDogdGhpcy5zZXR1cCxcbiAgICAgIHJlYWRBbG91ZDogdGhpcy5yZWFkQWxvdWQsXG4gICAgICB0YWN0aWNzOiB0aGlzLnRhY3RpY3MsXG4gICAgICB0cmVhc3VyZTogdGhpcy50cmVhc3VyZSxcbiAgICAgIG5vdGVzOiB0aGlzLm5vdGVzXG4gICAgfTtcbiAgfVxuXG4gIGdldEF2YWlsYWJsZVRhZ3MoKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHRhZ1NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gICAgZm9yIChjb25zdCBtb25zdGVyIG9mIHRoaXMubW9uc3RlckluZGV4LmdldEFsbE1vbnN0ZXJzKCkpIHtcbiAgICAgIGZvciAoY29uc3QgdGFnIG9mIG1vbnN0ZXIudGFncyA/PyBbXSkge1xuICAgICAgICB0YWdTZXQuYWRkKFN0cmluZyh0YWcpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gWy4uLnRhZ1NldF0uc29ydCgoYSwgYikgPT4gYS5sb2NhbGVDb21wYXJlKGIpKTtcbiAgfVxuXG4gIHNvcnRNb25zdGVycyhtb25zdGVyczogTW9uc3RlclN1bW1hcnlbXSk6IE1vbnN0ZXJTdW1tYXJ5W10ge1xuICAgIHJldHVybiBbLi4ubW9uc3RlcnNdLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGNvbnN0IGFMZXZlbCA9IE51bWJlcihhLmxldmVsID8/IDk5OSk7XG4gICAgICBjb25zdCBiTGV2ZWwgPSBOdW1iZXIoYi5sZXZlbCA/PyA5OTkpO1xuXG4gICAgICBzd2l0Y2ggKHRoaXMuc29ydE1vZGUpIHtcbiAgICAgICAgY2FzZSBcIm5hbWUtZGVzY1wiOlxuICAgICAgICAgIHJldHVybiBiLm5hbWUubG9jYWxlQ29tcGFyZShhLm5hbWUpO1xuXG4gICAgICAgIGNhc2UgXCJsZXZlbC1hc2NcIjpcbiAgICAgICAgICByZXR1cm4gYUxldmVsIC0gYkxldmVsIHx8IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG5cbiAgICAgICAgY2FzZSBcImxldmVsLWRlc2NcIjpcbiAgICAgICAgICByZXR1cm4gYkxldmVsIC0gYUxldmVsIHx8IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG5cbiAgICAgICAgY2FzZSBcIm5hbWUtYXNjXCI6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJNb25zdGVyUmVzdWx0cygpOiB2b2lkIHtcbiAgICBjb25zdCByZXN1bHRzRWwgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFxuICAgICAgJ1tkYXRhLXJvbGU9XCJtb25zdGVyLXJlc3VsdHNcIl0nXG4gICAgKTtcblxuICAgIGlmICghKHJlc3VsdHNFbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlc3VsdHNFbC5lbXB0eSgpO1xuXG4gICAgbGV0IG1vbnN0ZXJzID0gdGhpcy5tb25zdGVySW5kZXguc2VhcmNoTW9uc3RlcnModGhpcy5tb25zdGVyU2VhcmNoKTtcblxuICAgIGlmICh0aGlzLmxldmVsRmlsdGVyKSB7XG4gICAgICBtb25zdGVycyA9IG1vbnN0ZXJzLmZpbHRlcigobW9uc3RlcikgPT5cbiAgICAgICAgU3RyaW5nKG1vbnN0ZXIubGV2ZWwgPz8gXCJcIikgPT09IHRoaXMubGV2ZWxGaWx0ZXJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudGFnRmlsdGVyKSB7XG4gICAgICBtb25zdGVycyA9IG1vbnN0ZXJzLmZpbHRlcigobW9uc3RlcikgPT5cbiAgICAgICAgKG1vbnN0ZXIudGFncyA/PyBbXSkuaW5jbHVkZXModGhpcy50YWdGaWx0ZXIpXG4gICAgICApO1xuICAgIH1cblxuICAgIG1vbnN0ZXJzID0gdGhpcy5zb3J0TW9uc3RlcnMobW9uc3RlcnMpO1xuICAgIG1vbnN0ZXJzID0gbW9uc3RlcnMuc2xpY2UoMCwgMTAwKTtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiBtb25zdGVycykge1xuICAgICAgbmV3IFNldHRpbmcocmVzdWx0c0VsKVxuICAgICAgICAuc2V0TmFtZShtb25zdGVyLm5hbWUpXG4gICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgIFtcbiAgICAgICAgICAgIG1vbnN0ZXIubGV2ZWwgPyBgTFYgJHttb25zdGVyLmxldmVsfWAgOiBudWxsLFxuICAgICAgICAgICAgbW9uc3Rlci5hYyA/IGBBQyAke21vbnN0ZXIuYWN9YCA6IG51bGwsXG4gICAgICAgICAgICBtb25zdGVyLmhwID8gYEhQICR7bW9uc3Rlci5ocH1gIDogbnVsbFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiIFx1MjAyMiBcIikgfHwgbW9uc3Rlci5wYXRoXG4gICAgICAgIClcbiAgICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIlByZXZpZXdcIilcbiAgICAgICAgICAgIC5vbkNsaWNrKChldmVudCkgPT4ge1xuICAgICAgICAgICAgICBzaG93TW9uc3RlclByZXZpZXcodGhpcy5hcHAsIGV2ZW50LCBtb25zdGVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+IHtcbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiQWRkXCIpXG4gICAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5hZGRNb25zdGVyKG1vbnN0ZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlclNlbGVjdGVkTW9uc3RlcnMoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWRFbCA9IHRoaXMuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAnW2RhdGEtcm9sZT1cInNlbGVjdGVkLW1vbnN0ZXJzXCJdJ1xuICAgICk7XG5cbiAgICBpZiAoIShzZWxlY3RlZEVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZWN0ZWRFbC5lbXB0eSgpO1xuXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRNb25zdGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHNlbGVjdGVkRWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgdGV4dDogXCJObyBtb25zdGVycyBzZWxlY3RlZCB5ZXQuXCJcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBtb25zdGVyIG9mIHRoaXMuc2VsZWN0ZWRNb25zdGVycykge1xuICAgICAgbmV3IFNldHRpbmcoc2VsZWN0ZWRFbClcbiAgICAgICAgLnNldE5hbWUobW9uc3Rlci5uYW1lKVxuICAgICAgICAuc2V0RGVzYyhtb25zdGVyLnBhdGgpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcobW9uc3Rlci5xdHkpKTtcblxuICAgICAgICAgIHRleHQub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBxdHkgPSBOdW1iZXIodmFsdWUpO1xuXG4gICAgICAgICAgICBtb25zdGVyLnF0eSA9XG4gICAgICAgICAgICAgIE51bWJlci5pc0Zpbml0ZShxdHkpICYmIHF0eSA+IDBcbiAgICAgICAgICAgICAgICA/IE1hdGguZmxvb3IocXR5KVxuICAgICAgICAgICAgICAgIDogMTtcblxuICAgICAgICAgICAgdGhpcy5yZW5kZXJFbmNvdW50ZXJTdW1tYXJ5KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT4ge1xuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJSZW1vdmVcIilcbiAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE1vbnN0ZXJzID0gdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLmZpbHRlcihcbiAgICAgICAgICAgICAgICAoc2VsZWN0ZWQpID0+IHNlbGVjdGVkLnBhdGggIT09IG1vbnN0ZXIucGF0aFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyU2VsZWN0ZWRNb25zdGVycygpO1xuICAgICAgICAgICAgICB0aGlzLnJlbmRlckVuY291bnRlclN1bW1hcnkoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZW5kZXJFbmNvdW50ZXJTdW1tYXJ5KCk6IHZvaWQge1xuICAgIGNvbnN0IHN1bW1hcnlFbCA9IHRoaXMuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAnW2RhdGEtcm9sZT1cImVuY291bnRlci1zdW1tYXJ5XCJdJ1xuICAgICk7XG5cbiAgICBpZiAoIShzdW1tYXJ5RWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzdW1tYXJ5RWwuZW1wdHkoKTtcblxuICAgIGNvbnN0IHN1bW1hcnkgPSB0aGlzLmdldEVuY291bnRlclN1bW1hcnkoKTtcblxuICAgIHN1bW1hcnlFbC5jcmVhdGVFbChcImg0XCIsIHtcbiAgICAgIHRleHQ6IFwiRW5jb3VudGVyIFN1bW1hcnlcIlxuICAgIH0pO1xuXG4gICAgc3VtbWFyeUVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgVG90YWwgTW9uc3RlcnM6ICR7c3VtbWFyeS50b3RhbE1vbnN0ZXJzfWBcbiAgICB9KTtcblxuICAgIHN1bW1hcnlFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYFVuaXF1ZSBNb25zdGVyczogJHtzdW1tYXJ5LnVuaXF1ZU1vbnN0ZXJzfWBcbiAgICB9KTtcblxuICAgIHN1bW1hcnlFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYEF2ZXJhZ2UgTW9uc3RlciBMZXZlbDogJHtzdW1tYXJ5LmF2ZXJhZ2VMZXZlbC50b0ZpeGVkKDEpfWBcbiAgICB9KTtcbiAgfVxuXG4gIGdldEVuY291bnRlclN1bW1hcnkoKToge1xuICAgIHRvdGFsTW9uc3RlcnM6IG51bWJlcjtcbiAgICB1bmlxdWVNb25zdGVyczogbnVtYmVyO1xuICAgIGF2ZXJhZ2VMZXZlbDogbnVtYmVyO1xuICB9IHtcbiAgICBjb25zdCB0b3RhbE1vbnN0ZXJzID0gdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLnJlZHVjZShcbiAgICAgIChzdW0sIG1vbnN0ZXIpID0+IHN1bSArIG1vbnN0ZXIucXR5LFxuICAgICAgMFxuICAgICk7XG5cbiAgICBjb25zdCB1bmlxdWVNb25zdGVycyA9IHRoaXMuc2VsZWN0ZWRNb25zdGVycy5sZW5ndGg7XG5cbiAgICBsZXQgdG90YWxMZXZlbHMgPSAwO1xuICAgIGxldCBjb3VudGVkTW9uc3RlcnMgPSAwO1xuXG4gICAgZm9yIChjb25zdCBtb25zdGVyIG9mIHRoaXMuc2VsZWN0ZWRNb25zdGVycykge1xuICAgICAgY29uc3QgbGV2ZWwgPSBOdW1iZXIobW9uc3Rlci5sZXZlbCk7XG5cbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKGxldmVsKSkge1xuICAgICAgICB0b3RhbExldmVscyArPSBsZXZlbCAqIG1vbnN0ZXIucXR5O1xuICAgICAgICBjb3VudGVkTW9uc3RlcnMgKz0gbW9uc3Rlci5xdHk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYXZlcmFnZUxldmVsID1cbiAgICAgIGNvdW50ZWRNb25zdGVycyA+IDBcbiAgICAgICAgPyB0b3RhbExldmVscyAvIGNvdW50ZWRNb25zdGVyc1xuICAgICAgICA6IDA7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG90YWxNb25zdGVycyxcbiAgICAgIHVuaXF1ZU1vbnN0ZXJzLFxuICAgICAgYXZlcmFnZUxldmVsXG4gICAgfTtcbiAgfVxuXG4gIGFkZE1vbnN0ZXIobW9uc3RlcjogTW9uc3RlclN1bW1hcnkpOiB2b2lkIHtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuc2VsZWN0ZWRNb25zdGVycy5maW5kKFxuICAgICAgKHNlbGVjdGVkKSA9PiBzZWxlY3RlZC5wYXRoID09PSBtb25zdGVyLnBhdGhcbiAgICApO1xuXG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICBleGlzdGluZy5xdHkgKz0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLnB1c2goe1xuICAgICAgICBuYW1lOiBtb25zdGVyLm5hbWUsXG4gICAgICAgIHBhdGg6IG1vbnN0ZXIucGF0aCxcbiAgICAgICAgcXR5OiAxLFxuICAgICAgICBsZXZlbDogbW9uc3Rlci5sZXZlbCxcbiAgICAgICAgYWM6IG1vbnN0ZXIuYWMsXG4gICAgICAgIGhwOiBtb25zdGVyLmhwXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLnJlbmRlclNlbGVjdGVkTW9uc3RlcnMoKTtcbiAgICB0aGlzLnJlbmRlckVuY291bnRlclN1bW1hcnkoKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUVuY291bnRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5lbmNvdW50ZXJOYW1lLnRyaW0oKTtcblxuICAgIGlmICghbmFtZSkge1xuICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBuYW1lIGlzIHJlcXVpcmVkLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlLmNyZWF0ZUVuY291bnRlck5vdGUodGhpcy5nZXRFbmNvdW50ZXJEYXRhKCkpO1xuXG4gICAgICBuZXcgTm90aWNlKFwiRW5jb3VudGVyIGNyZWF0ZWQuXCIpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGNyZWF0ZSBlbmNvdW50ZXI6XCIsIGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJGYWlsZWQgdG8gY3JlYXRlIGVuY291bnRlci4gQ2hlY2sgY29uc29sZS5cIik7XG4gICAgfVxuICB9XG59IiwgImltcG9ydCB7IEFwcCwgTWVudSwgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBNb25zdGVyU3VtbWFyeSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93TW9uc3RlclByZXZpZXcoXG4gIGFwcDogQXBwLFxuICBldmVudDogTW91c2VFdmVudCxcbiAgbW9uc3RlcjogTW9uc3RlclN1bW1hcnlcbik6IHZvaWQge1xuXG4gIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKG1vbnN0ZXIubmFtZSlcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChtb25zdGVyLnBhdGgpO1xuXG4gICAgICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgYXBwLndvcmtzcGFjZS5nZXRMZWFmKHRydWUpLm9wZW5GaWxlKGZpbGUpO1xuICAgICB9KTtcbiAgfSk7XG5cbiAgbWVudS5hZGRTZXBhcmF0b3IoKTtcblxuICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICBpdGVtLnNldFRpdGxlKFxuICAgICAgW1xuICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgbW9uc3Rlci5hYyA/IGBBQyAke21vbnN0ZXIuYWN9YCA6IG51bGwsXG4gICAgICAgIG1vbnN0ZXIuaHAgPyBgSFAgJHttb25zdGVyLmhwfWAgOiBudWxsXG4gICAgICBdXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLmpvaW4oXCIgXHUyMDIyIFwiKVxuICAgICk7XG5cbiAgICBpdGVtLnNldERpc2FibGVkKHRydWUpO1xuICB9KTtcblxuICBpZiAobW9uc3Rlci5hdGspIHtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uc2V0VGl0bGUoYEFUSzogJHttb25zdGVyLmF0a31gKTtcbiAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgfSk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHRyYWl0IG9mIG1vbnN0ZXIudHJhaXRzID8/IFtdKSB7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLnNldFRpdGxlKHRyYWl0KTtcbiAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgfSk7XG4gIH1cblxuICBtZW51LmFkZFNlcGFyYXRvcigpO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgIC5zZXRUaXRsZShcIkNvcHkgTW9uc3RlciBQYXRoXCIpXG4gICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KG1vbnN0ZXIucGF0aCk7XG5cbiAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgcGF0aCBjb3BpZWQuXCIpO1xuICAgICAgfSk7XG4gIH0pO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgIC5zZXRUaXRsZShcIk9wZW4gaW4gTmV3IFRhYlwiKVxuICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChtb25zdGVyLnBhdGgpO1xuICAgICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKS5vcGVuRmlsZShmaWxlKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICBpdGVtXG4gICAgICAuc2V0VGl0bGUoXCJPcGVuIHRvIHRoZSBSaWdodFwiKVxuICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuXG4gICAgICAgIGNvbnN0IGZpbGUgPVxuICAgICAgICAgIGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobW9uc3Rlci5wYXRoKTtcblxuICAgICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxlYWYgPVxuICAgICAgICAgIGFwcC53b3Jrc3BhY2UuZ2V0TGVhZihcInNwbGl0XCIsIFwidmVydGljYWxcIik7XG5cbiAgICAgICAgYXdhaXQgbGVhZi5vcGVuRmlsZShmaWxlKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZXZlbnQpO1xufSIsICJpbXBvcnQge1xuICBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0LFxuICBNZW51LFxuICBOb3RpY2UsXG4gIFRGaWxlXG59IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW4gZnJvbSBcIi4uL21haW5cIjtcblxuaW1wb3J0IHsgcGFyc2VGcm9udG1hdHRlciB9IGZyb20gXCIuLi9zdGF0YmxvY2tzQ29tcGF0L3BhcnNlRnJvbnRNYXR0ZXJcIjtcbmltcG9ydCB7IHJlbmRlck1vbnN0ZXJCbG9jayB9IGZyb20gXCIuLi9zdGF0YmxvY2tzQ29tcGF0L3JlbmRlck1vbnN0ZXJCbG9ja1wiO1xuaW1wb3J0IHsgREVGQVVMVF9TVEFUQkxPQ0tfUkVOREVSX1NFVFRJTkdTIH0gZnJvbSBcIi4uL3N0YXRibG9ja3NDb21wYXQvc2V0dGluZ3NcIjtcblxuZXhwb3J0IGNsYXNzIEVuY291bnRlclJlbmRlcmVyIHtcbiAgcGx1Z2luOiBTaGFkb3dkYXJrRW5jb3VudGVyc1BsdWdpbjtcblxuICBjb25zdHJ1Y3RvcihwbHVnaW46IFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luKSB7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICByZWdpc3RlcigpOiB2b2lkIHtcbiAgICB0aGlzLnBsdWdpbi5yZWdpc3Rlck1hcmtkb3duUG9zdFByb2Nlc3NvcihcbiAgICAgIChcbiAgICAgICAgZWw6IEhUTUxFbGVtZW50LFxuICAgICAgICBjdHg6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHRcbiAgICAgICkgPT4ge1xuICAgICAgICB0aGlzLnByb2Nlc3MoZWwsIGN0eCk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIHByb2Nlc3MoXG4gICAgZWw6IEhUTUxFbGVtZW50LFxuICAgIGN0eDogTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBzZWN0aW9uSW5mbyA9IGN0eC5nZXRTZWN0aW9uSW5mbyhlbCk7XG5cbiAgICBpZiAoIXNlY3Rpb25JbmZvIHx8IHNlY3Rpb25JbmZvLmxpbmVTdGFydCAhPT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPVxuICAgICAgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChcbiAgICAgICAgY3R4LnNvdXJjZVBhdGhcbiAgICAgICk7XG5cbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY2FjaGUgPVxuICAgICAgdGhpcy5wbHVnaW4uYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuXG4gICAgY29uc3QgZnJvbnRtYXR0ZXIgPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG5cbiAgICBpZiAoZnJvbnRtYXR0ZXI/LnNoYWRvd2RhcmtUeXBlICE9PSBcImVuY291bnRlclwiKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGVsLnF1ZXJ5U2VsZWN0b3IoXCIuc2QtZW5jb3VudGVyLXJlbmRlcmVkXCIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29udGFpbmVyID0gZWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcmVuZGVyZWRcIlxuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKFwiaDJcIiwge1xuICAgICAgdGV4dDogZnJvbnRtYXR0ZXIubmFtZSA/PyBmaWxlLmJhc2VuYW1lXG4gICAgfSk7XG5cbiAgICBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcmVuZGVyZWQtbWV0YVwiLFxuICAgICAgdGV4dDogW1xuICAgICAgICBmcm9udG1hdHRlci5wYXJ0eUxldmVsXG4gICAgICAgICAgPyBgUGFydHkgTGV2ZWwgJHtmcm9udG1hdHRlci5wYXJ0eUxldmVsfWBcbiAgICAgICAgICA6IG51bGwsXG4gICAgICAgIGZyb250bWF0dGVyLnBhcnR5U2l6ZVxuICAgICAgICAgID8gYCR7ZnJvbnRtYXR0ZXIucGFydHlTaXplfSBQQ3NgXG4gICAgICAgICAgOiBudWxsLFxuICAgICAgICBmcm9udG1hdHRlci5zdGF0dXNcbiAgICAgICAgICA/IGBTdGF0dXM6ICR7ZnJvbnRtYXR0ZXIuc3RhdHVzfWBcbiAgICAgICAgICA6IG51bGxcbiAgICAgIF1cbiAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAuam9pbihcIiBcdTIwMjIgXCIpXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlckRhc2hib2FyZFN0YXRzKGNvbnRhaW5lciwgZnJvbnRtYXR0ZXIpO1xuICAgIHRoaXMucmVuZGVyQ29tcGFjdE1vbnN0ZXJSb3N0ZXIoY29udGFpbmVyLCBmcm9udG1hdHRlcik7XG4gIH1cblxuICByZW5kZXJEYXNoYm9hcmRTdGF0cyhcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIGZyb250bWF0dGVyOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4gICk6IHZvaWQge1xuICAgIGNvbnN0IG1vbnN0ZXJzID0gQXJyYXkuaXNBcnJheShmcm9udG1hdHRlci5tb25zdGVycylcbiAgICAgID8gZnJvbnRtYXR0ZXIubW9uc3RlcnNcbiAgICAgIDogW107XG5cbiAgICBjb25zdCB0b3RhbE1vbnN0ZXJzID0gbW9uc3RlcnMucmVkdWNlKFxuICAgICAgKHN1bTogbnVtYmVyLCBtb25zdGVyOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSA9PlxuICAgICAgICBzdW0gKyBOdW1iZXIobW9uc3Rlci5xdHkgPz8gMSksXG4gICAgICAwXG4gICAgKTtcblxuICAgIGNvbnN0IHVuaXF1ZU1vbnN0ZXJzID0gbW9uc3RlcnMubGVuZ3RoO1xuXG4gICAgbGV0IHRvdGFsTGV2ZWxzID0gMDtcbiAgICBsZXQgY291bnRlZE1vbnN0ZXJzID0gMDtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiBtb25zdGVycykge1xuICAgICAgY29uc3QgbGV2ZWwgPSBOdW1iZXIobW9uc3Rlci5sZXZlbCk7XG5cbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKGxldmVsKSkge1xuICAgICAgICBjb25zdCBxdHkgPSBOdW1iZXIobW9uc3Rlci5xdHkgPz8gMSk7XG5cbiAgICAgICAgdG90YWxMZXZlbHMgKz0gbGV2ZWwgKiBxdHk7XG4gICAgICAgIGNvdW50ZWRNb25zdGVycyArPSBxdHk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYXZlcmFnZUxldmVsID1cbiAgICAgIGNvdW50ZWRNb25zdGVycyA+IDBcbiAgICAgICAgPyB0b3RhbExldmVscyAvIGNvdW50ZWRNb25zdGVyc1xuICAgICAgICA6IDA7XG5cbiAgICBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcmVuZGVyZWQtc3RhdHNcIixcbiAgICAgIHRleHQ6XG4gICAgICAgIGAke3RvdGFsTW9uc3RlcnN9IE1vbnN0ZXJzYCArXG4gICAgICAgIGAgXHUyMDIyICR7dW5pcXVlTW9uc3RlcnN9IFVuaXF1ZWAgK1xuICAgICAgICBgIFx1MjAyMiBBdmcgTHYgJHthdmVyYWdlTGV2ZWwudG9GaXhlZCgxKX1gXG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJDb21wYWN0TW9uc3RlclJvc3RlcihcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIGZyb250bWF0dGVyOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4gICk6IHZvaWQge1xuICAgIGNvbnN0IG1vbnN0ZXJzID0gQXJyYXkuaXNBcnJheShmcm9udG1hdHRlci5tb25zdGVycylcbiAgICAgID8gZnJvbnRtYXR0ZXIubW9uc3RlcnNcbiAgICAgIDogW107XG5cbiAgICBpZiAobW9uc3RlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgY2xzOiBcInNkLWVuY291bnRlci1yZW5kZXJlZC1lbXB0eVwiLFxuICAgICAgICB0ZXh0OiBcIk5vIG1vbnN0ZXJzIGFkZGVkLlwiXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJvc3RlckVsID0gY29udGFpbmVyLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkLXJvc3RlclwiXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgbW9uc3RlcnMpIHtcbiAgICAgIGNvbnN0IHF0eSA9IG1vbnN0ZXIucXR5ID8/IDE7XG4gICAgICBjb25zdCBuYW1lID0gbW9uc3Rlci5uYW1lID8/IFwiVW5rbm93biBNb25zdGVyXCI7XG5cbiAgICAgIGNvbnN0IG1ldGEgPSBbXG4gICAgICAgIG1vbnN0ZXIubGV2ZWwgPyBgTFYgJHttb25zdGVyLmxldmVsfWAgOiBudWxsLFxuICAgICAgICBtb25zdGVyLmFjID8gYEFDICR7bW9uc3Rlci5hY31gIDogbnVsbCxcbiAgICAgICAgbW9uc3Rlci5ocCA/IGBIUCAke21vbnN0ZXIuaHB9YCA6IG51bGxcbiAgICAgIF1cbiAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAuam9pbihcIiBcdTIwMjIgXCIpO1xuXG4gICAgICBjb25zdCBwaWxsRWwgPSByb3N0ZXJFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcmVuZGVyZWQtbW9uc3RlclwiLFxuICAgICAgICB0ZXh0OiBtZXRhXG4gICAgICAgICAgPyBgJHtxdHl9eCAke25hbWV9IFx1MjAyMiAke21ldGF9YFxuICAgICAgICAgIDogYCR7cXR5fXggJHtuYW1lfWBcbiAgICAgIH0pO1xuXG4gICAgICBwaWxsRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnNob3dNb25zdGVyUGlsbE1lbnUoZXZlbnQsIG1vbnN0ZXIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgc2hvd01vbnN0ZXJQaWxsTWVudShcbiAgICBldmVudDogTW91c2VFdmVudCxcbiAgICBtb25zdGVyOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHBhdGggPSBtb25zdGVyLnBhdGg7XG4gICAgY29uc3QgbmFtZSA9IG1vbnN0ZXIubmFtZSA/PyBcIlVua25vd24gTW9uc3RlclwiO1xuXG4gICAgY29uc3QgbWVudSA9IG5ldyBNZW51KCk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKGBPcGVuICR7bmFtZX1gKVxuICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5vcGVuTW9uc3RlcihwYXRoLCBcImN1cnJlbnRcIik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZShcIk9wZW4gaW4gTmV3IFRhYlwiKVxuICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5vcGVuTW9uc3RlcihwYXRoLCBcIm5ldy10YWJcIik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZShcIk9wZW4gdG8gdGhlIFJpZ2h0XCIpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLm9wZW5Nb25zdGVyKHBhdGgsIFwicmlnaHRcIik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbVxuICAgICAgICAuc2V0VGl0bGUoXCJQcmV2aWV3IFN0YXRibG9ja1wiKVxuICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zaG93TW9uc3RlclN0YXRibG9ja1ByZXZpZXcobW9uc3Rlcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbS5zZXRUaXRsZShcbiAgICAgICAgW1xuICAgICAgICAgIG1vbnN0ZXIubGV2ZWwgPyBgTFYgJHttb25zdGVyLmxldmVsfWAgOiBudWxsLFxuICAgICAgICAgIG1vbnN0ZXIuYWMgPyBgQUMgJHttb25zdGVyLmFjfWAgOiBudWxsLFxuICAgICAgICAgIG1vbnN0ZXIuaHAgPyBgSFAgJHttb25zdGVyLmhwfWAgOiBudWxsXG4gICAgICAgIF1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCIgXHUyMDIyIFwiKSB8fCBcIk5vIHN0YXRzIGF2YWlsYWJsZVwiXG4gICAgICApO1xuXG4gICAgICBpdGVtLnNldERpc2FibGVkKHRydWUpO1xuICAgIH0pO1xuXG4gICAgbWVudS5zaG93QXRNb3VzZUV2ZW50KGV2ZW50KTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5Nb25zdGVyKFxuICAgIHBhdGg6IHVua25vd24sXG4gICAgbW9kZTogXCJjdXJyZW50XCIgfCBcIm5ldy10YWJcIiB8IFwicmlnaHRcIlxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodHlwZW9mIHBhdGggIT09IFwic3RyaW5nXCIgfHwgcGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJNb25zdGVyIGZpbGUgbm90IGZvdW5kLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID1cbiAgICAgIHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG5cbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG1vZGUgPT09IFwicmlnaHRcIikge1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZVxuICAgICAgICAuZ2V0TGVhZihcInNwbGl0XCIsIFwidmVydGljYWxcIilcbiAgICAgICAgLm9wZW5GaWxlKGZpbGUpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG1vZGUgPT09IFwibmV3LXRhYlwiKSB7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlXG4gICAgICAgIC5nZXRMZWFmKHRydWUpXG4gICAgICAgIC5vcGVuRmlsZShmaWxlKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2VcbiAgICAgIC5nZXRMZWFmKGZhbHNlKVxuICAgICAgLm9wZW5GaWxlKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgc2hvd01vbnN0ZXJTdGF0YmxvY2tQcmV2aWV3KFxuICAgIG1vbnN0ZXI6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcGF0aCA9IG1vbnN0ZXIucGF0aDtcblxuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gXCJzdHJpbmdcIiB8fCBwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPVxuICAgICAgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcblxuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJNb25zdGVyIGZpbGUgbm90IGZvdW5kLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjYWNoZSA9XG4gICAgICB0aGlzLnBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG5cbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlcjtcblxuICAgIGlmICghZnJvbnRtYXR0ZXIpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJNb25zdGVyIGhhcyBubyBmcm9udG1hdHRlci5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gcGFyc2VGcm9udG1hdHRlcihmcm9udG1hdHRlcik7XG5cbiAgICBpZiAoIXJlc3VsdC5zdWNjZXNzIHx8ICFyZXN1bHQuZGF0YSkge1xuICAgICAgbmV3IE5vdGljZShcIkNvdWxkIG5vdCBwYXJzZSBtb25zdGVyLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcmV2aWV3RWwgPSBkb2N1bWVudC5ib2R5LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXN0YXRibG9jay1wcmV2aWV3XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGlubmVyRWwgPSBwcmV2aWV3RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItc3RhdGJsb2NrLXByZXZpZXctaW5uZXJcIlxuICAgIH0pO1xuXG4gICAgcmVuZGVyTW9uc3RlckJsb2NrKFxuICAgICAgaW5uZXJFbCxcbiAgICAgIHJlc3VsdC5kYXRhLFxuICAgICAgREVGQVVMVF9TVEFUQkxPQ0tfUkVOREVSX1NFVFRJTkdTLFxuICAgICAgcmVzdWx0Lndhcm5pbmdzXG4gICAgKTtcblxuICAgIGNvbnN0IGNsb3NlQnV0dG9uID0gcHJldmlld0VsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItc3RhdGJsb2NrLXByZXZpZXctY2xvc2VcIixcbiAgICAgIHRleHQ6IFwiXHUwMEQ3XCJcbiAgICB9KTtcblxuICAgIGNsb3NlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBwcmV2aWV3RWwucmVtb3ZlKCk7XG4gICAgfSk7XG5cbiAgICBwcmV2aWV3RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gcHJldmlld0VsKSB7XG4gICAgICAgIHByZXZpZXdFbC5yZW1vdmUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufSIsICJpbXBvcnQgeyBTaGFkb3dkYXJrQXR0YWNrLCBTaGFkb3dkYXJrTW9uc3RlciB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbnR5cGUgTG9vc2VNb25zdGVyID0gUmVjb3JkPHN0cmluZywgdW5rbm93bj4gJiB7XG4gIG5hbWU/OiB1bmtub3duO1xuICBsZXZlbD86IHVua25vd247XG4gIGFsaWdubWVudD86IHVua25vd247XG4gIHR5cGU/OiB1bmtub3duO1xuICBhYz86IHVua25vd247XG4gIGhwPzogdW5rbm93bjtcbiAgbXY/OiB1bmtub3duO1xuICBhdGs/OiB1bmtub3duO1xuICBzdGF0cz86IHVua25vd247XG4gIHN0cj86IHVua25vd247XG4gIGRleD86IHVua25vd247XG4gIGNvbj86IHVua25vd247XG4gIGludD86IHVua25vd247XG4gIHdpcz86IHVua25vd247XG4gIGNoYT86IHVua25vd247XG4gIHRyYWl0cz86IHVua25vd247XG4gIHNwZWNpYWxzPzogdW5rbm93bjtcbiAgc3BlbGxzPzogdW5rbm93bjtcbiAgZ2Vhcj86IHVua25vd247XG4gIGRlc2NyaXB0aW9uPzogdW5rbm93bjtcbiAgc291cmNlPzogdW5rbm93bjtcbiAgdGFncz86IHVua25vd247XG59O1xuXG5mdW5jdGlvbiBhc1N0cmluZyh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2sgPSBcIlwiKTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZmFsbGJhY2s7XG4gIH1cblxuICBpZiAoXG4gICAgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiIHx8XG4gICAgdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiIHx8XG4gICAgdHlwZW9mIHZhbHVlID09PSBcImJvb2xlYW5cIlxuICApIHtcbiAgICByZXR1cm4gU3RyaW5nKHZhbHVlKS50cmltKCk7XG4gIH1cblxuICByZXR1cm4gZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU1vZGlmaWVyKHZhbHVlOiB1bmtub3duLCBmYWxsYmFjayA9IFwiKzBcIik6IHN0cmluZyB7XG4gIGNvbnN0IHJhdyA9IGFzU3RyaW5nKHZhbHVlLCBmYWxsYmFjayk7XG4gIGlmICghcmF3KSByZXR1cm4gZmFsbGJhY2s7XG4gIGlmICgvXlsrLV1cXGQrJC8udGVzdChyYXcpKSByZXR1cm4gcmF3O1xuICBpZiAoL15cXGQrJC8udGVzdChyYXcpKSByZXR1cm4gYCske3Jhd31gO1xuICBpZiAoL14tXFxkKyQvLnRlc3QocmF3KSkgcmV0dXJuIHJhdztcbiAgcmV0dXJuIHJhdztcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplU3RyaW5nQXJyYXkodmFsdWU6IHVua25vd24pOiBzdHJpbmdbXSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS5tYXAoKGl0ZW0pID0+IGFzU3RyaW5nKGl0ZW0pKS5maWx0ZXIoQm9vbGVhbik7XG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIHZhbHVlXG4gICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcbiAgfVxuXG4gIHJldHVybiBbXTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQXR0YWNrKGl0ZW06IHVua25vd24pOiBTaGFkb3dkYXJrQXR0YWNrIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgaXRlbSA9PT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBpdGVtLnRyaW0oKSxcbiAgICAgIHJhdzogaXRlbS50cmltKClcbiAgICB9O1xuICB9XG5cbiAgaWYgKGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09IFwib2JqZWN0XCIpIHtcbiAgICBjb25zdCBvYmogPSBpdGVtIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgIGNvbnN0IG5hbWUgPSBhc1N0cmluZyhvYmoubmFtZSk7XG4gICAgaWYgKCFuYW1lKSByZXR1cm4gbnVsbDtcblxuICAgIHJldHVybiB7XG4gICAgICBuYW1lLFxuICAgICAgYm9udXM6IGFzU3RyaW5nKG9iai5ib251cyksXG4gICAgICBkYW1hZ2U6IGFzU3RyaW5nKG9iai5kYW1hZ2UpLFxuICAgICAgcmFuZ2U6IGFzU3RyaW5nKG9iai5yYW5nZSksXG4gICAgICBub3RlczogYXNTdHJpbmcob2JqLm5vdGVzKVxuICAgIH07XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQXR0YWNrcyh2YWx1ZTogdW5rbm93bik6IFNoYWRvd2RhcmtBdHRhY2tbXSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZVxuICAgICAgLm1hcChub3JtYWxpemVBdHRhY2spXG4gICAgICAuZmlsdGVyKChhKTogYSBpcyBTaGFkb3dkYXJrQXR0YWNrID0+IGEgIT09IG51bGwpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS50cmltKCkpIHtcbiAgICByZXR1cm4gW3sgbmFtZTogdmFsdWUudHJpbSgpLCByYXc6IHZhbHVlLnRyaW0oKSB9XTtcbiAgfVxuXG4gIHJldHVybiBbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZU1vbnN0ZXIoXG4gIGlucHV0OiBMb29zZU1vbnN0ZXJcbik6IFNoYWRvd2RhcmtNb25zdGVyIHtcbiAgY29uc3QgbmVzdGVkU3RhdHMgPSAoaW5wdXQuc3RhdHMgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQpID8/IHt9O1xuXG4gIGNvbnN0IHN0clZhbHVlID0gaW5wdXQuc3RyID8/IG5lc3RlZFN0YXRzLnN0cjtcbiAgY29uc3QgZGV4VmFsdWUgPSBpbnB1dC5kZXggPz8gbmVzdGVkU3RhdHMuZGV4O1xuICBjb25zdCBjb25WYWx1ZSA9IGlucHV0LmNvbiA/PyBuZXN0ZWRTdGF0cy5jb247XG4gIGNvbnN0IGludFZhbHVlID0gaW5wdXQuaW50ID8/IG5lc3RlZFN0YXRzLmludDtcbiAgY29uc3Qgd2lzVmFsdWUgPSBpbnB1dC53aXMgPz8gbmVzdGVkU3RhdHMud2lzO1xuICBjb25zdCBjaGFWYWx1ZSA9IGlucHV0LmNoYSA/PyBuZXN0ZWRTdGF0cy5jaGE7XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBhc1N0cmluZyhpbnB1dC5uYW1lLCBcIlVubmFtZWQgTW9uc3RlclwiKSxcbiAgICBsZXZlbDogYXNTdHJpbmcoaW5wdXQubGV2ZWwsIFwiP1wiKSxcbiAgICBhbGlnbm1lbnQ6IGFzU3RyaW5nKGlucHV0LmFsaWdubWVudCwgXCJcIiksXG4gICAgdHlwZTogYXNTdHJpbmcoaW5wdXQudHlwZSwgXCJcIiksXG4gICAgYWM6IGFzU3RyaW5nKGlucHV0LmFjLCBcIj9cIiksXG4gICAgaHA6IGFzU3RyaW5nKGlucHV0LmhwLCBcIj9cIiksXG4gICAgbXY6IGFzU3RyaW5nKGlucHV0Lm12LCBcIlwiKSxcbiAgICBhdGs6IG5vcm1hbGl6ZUF0dGFja3MoaW5wdXQuYXRrKSxcbiAgICBzdGF0czoge1xuICAgICAgc3RyOiBub3JtYWxpemVNb2RpZmllcihzdHJWYWx1ZSwgXCIrMFwiKSxcbiAgICAgIGRleDogbm9ybWFsaXplTW9kaWZpZXIoZGV4VmFsdWUsIFwiKzBcIiksXG4gICAgICBjb246IG5vcm1hbGl6ZU1vZGlmaWVyKGNvblZhbHVlLCBcIiswXCIpLFxuICAgICAgaW50OiBub3JtYWxpemVNb2RpZmllcihpbnRWYWx1ZSwgXCIrMFwiKSxcbiAgICAgIHdpczogbm9ybWFsaXplTW9kaWZpZXIod2lzVmFsdWUsIFwiKzBcIiksXG4gICAgICBjaGE6IG5vcm1hbGl6ZU1vZGlmaWVyKGNoYVZhbHVlLCBcIiswXCIpXG4gICAgfSxcbiAgICB0cmFpdHM6IG5vcm1hbGl6ZVN0cmluZ0FycmF5KGlucHV0LnRyYWl0cyksXG4gICAgc3BlY2lhbHM6IG5vcm1hbGl6ZVN0cmluZ0FycmF5KGlucHV0LnNwZWNpYWxzKSxcbiAgICBzcGVsbHM6IG5vcm1hbGl6ZVN0cmluZ0FycmF5KGlucHV0LnNwZWxscyksXG4gICAgZ2Vhcjogbm9ybWFsaXplU3RyaW5nQXJyYXkoaW5wdXQuZ2VhciksXG4gICAgZGVzY3JpcHRpb246IGFzU3RyaW5nKGlucHV0LmRlc2NyaXB0aW9uLCBcIlwiKSxcbiAgICBzb3VyY2U6IGFzU3RyaW5nKGlucHV0LnNvdXJjZSwgXCJcIiksXG4gICAgdGFnczogbm9ybWFsaXplU3RyaW5nQXJyYXkoaW5wdXQudGFncylcbiAgfTtcbn0iLCAiaW1wb3J0IHsgUGFyc2VSZXN1bHQsIFNoYWRvd2RhcmtNb25zdGVyIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZU1vbnN0ZXIgfSBmcm9tIFwiLi9ub3JtYWxpemVNb25zdGVyXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZyb250bWF0dGVyKFxuICBmcm9udG1hdHRlcjogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbik6IFBhcnNlUmVzdWx0PFNoYWRvd2RhcmtNb25zdGVyPiB7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgaWYgKCFmcm9udG1hdHRlciB8fCB0eXBlb2YgZnJvbnRtYXR0ZXIgIT09IFwib2JqZWN0XCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcnM6IFtcIk5vIHZhbGlkIGZyb250bWF0dGVyIGZvdW5kLlwiXSxcbiAgICAgIHdhcm5pbmdzXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IG1vbnN0ZXIgPSBub3JtYWxpemVNb25zdGVyKGZyb250bWF0dGVyIGFzIFBhcnRpYWw8U2hhZG93ZGFya01vbnN0ZXI+KTtcblxuICBpZiAoIW1vbnN0ZXIubmFtZSB8fCBtb25zdGVyLm5hbWUgPT09IFwiVW5uYW1lZCBNb25zdGVyXCIpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFwiTW9uc3RlciBpcyBtaXNzaW5nIGEgbmFtZS5cIik7XG4gIH1cblxuICBpZiAoIW1vbnN0ZXIuYWMgfHwgbW9uc3Rlci5hYyA9PT0gXCI/XCIpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFwiTW9uc3RlciBpcyBtaXNzaW5nIEFDLlwiKTtcbiAgfVxuXG4gIGlmICghbW9uc3Rlci5ocCB8fCBtb25zdGVyLmhwID09PSBcIj9cIikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJNb25zdGVyIGlzIG1pc3NpbmcgSFAuXCIpO1xuICB9XG5cbiAgaWYgKG1vbnN0ZXIuYXRrLmxlbmd0aCA9PT0gMCkge1xuICAgIHdhcm5pbmdzLnB1c2goXCJNb25zdGVyIGhhcyBubyBhdHRhY2tzIGxpc3RlZC5cIik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgZGF0YTogbW9uc3RlcixcbiAgICBlcnJvcnMsXG4gICAgd2FybmluZ3NcbiAgfTtcbn0iLCAiaW1wb3J0IHsgU2hhZG93ZGFya01vbnN0ZXIsIFNoYWRvd2RhcmtBdHRhY2sgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5cbnR5cGUgTW9uc3RlclJlbmRlck9wdGlvbnMgPSB7XG4gIG9uUm9sbERpY2U/OiAoZm9ybXVsYTogc3RyaW5nKSA9PiB2b2lkO1xufTtcblxuZnVuY3Rpb24gY3JlYXRlRGl2KGNsYXNzTmFtZT86IHN0cmluZywgdGV4dD86IHN0cmluZyk6IEhUTUxEaXZFbGVtZW50IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBpZiAoY2xhc3NOYW1lKSBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIGlmICh0ZXh0ICE9PSB1bmRlZmluZWQpIGVsLnRleHRDb250ZW50ID0gdGV4dDtcbiAgcmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTcGFuKGNsYXNzTmFtZT86IHN0cmluZywgdGV4dD86IHN0cmluZyk6IEhUTUxTcGFuRWxlbWVudCB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgaWYgKHRleHQgIT09IHVuZGVmaW5lZCkgZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpc3QoY2xhc3NOYW1lPzogc3RyaW5nKTogSFRNTFVMaXN0RWxlbWVudCB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuICBpZiAoY2xhc3NOYW1lKSBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIHJldHVybiBlbDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTGlzdEl0ZW0oY2xhc3NOYW1lPzogc3RyaW5nKTogSFRNTExJRWxlbWVudCB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICBpZiAoY2xhc3NOYW1lKSBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIHJldHVybiBlbDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQXR0YWNrVGV4dChhdHRhY2s6IFNoYWRvd2RhcmtBdHRhY2spOiBzdHJpbmcge1xuICBpZiAoYXR0YWNrLnJhdykgcmV0dXJuIGF0dGFjay5yYXc7XG5cbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW2F0dGFjay5uYW1lXTtcblxuICBpZiAoYXR0YWNrLmJvbnVzKSBwYXJ0cy5wdXNoKGF0dGFjay5ib251cyk7XG4gIGlmIChhdHRhY2suZGFtYWdlKSBwYXJ0cy5wdXNoKGAoJHthdHRhY2suZGFtYWdlfSlgKTtcbiAgaWYgKGF0dGFjay5yYW5nZSkgcGFydHMucHVzaChgWyR7YXR0YWNrLnJhbmdlfV1gKTtcbiAgaWYgKGF0dGFjay5ub3RlcykgcGFydHMucHVzaChgLSAke2F0dGFjay5ub3Rlc31gKTtcblxuICByZXR1cm4gcGFydHMuam9pbihcIiBcIikudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBnZXRBbGlnbm1lbnRMYWJlbChhbGlnbm1lbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBhbGlnbm1lbnQudHJpbSgpLnRvVXBwZXJDYXNlKCk7XG5cbiAgc3dpdGNoIChub3JtYWxpemVkKSB7XG4gICAgY2FzZSBcIkxcIjpcbiAgICAgIHJldHVybiBcIkxhd2Z1bFwiO1xuICAgIGNhc2UgXCJOXCI6XG4gICAgICByZXR1cm4gXCJOZXV0cmFsXCI7XG4gICAgY2FzZSBcIkNcIjpcbiAgICAgIHJldHVybiBcIkNoYW90aWNcIjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3BsaXRBdHRhY2tDb25uZWN0b3IodGV4dDogc3RyaW5nKTogeyBjb25uZWN0b3I6IHN0cmluZyB8IG51bGw7IGJvZHk6IHN0cmluZyB9IHtcbiAgY29uc3QgdHJpbW1lZCA9IHRleHQudHJpbSgpO1xuICBjb25zdCBtYXRjaCA9IHRyaW1tZWQubWF0Y2goL14oQU5EfE9SKVxccysoLispJC9pKTtcblxuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuIHsgY29ubmVjdG9yOiBudWxsLCBib2R5OiB0cmltbWVkIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNvbm5lY3RvcjogbWF0Y2hbMV0udG9VcHBlckNhc2UoKSxcbiAgICBib2R5OiBtYXRjaFsyXS50cmltKClcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplRGljZUZvcm11bGEoZm9ybXVsYTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGZvcm11bGEucmVwbGFjZSgvXFxzKy9nLCBcIlwiKTtcbn1cblxuZnVuY3Rpb24gYXR0YWNrQm9udXNUb0Zvcm11bGEoYm9udXM6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBib251cy50cmltKCk7XG4gIHJldHVybiBgMWQyMCR7bm9ybWFsaXplZH1gO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVEaWNlUm9sbEJ1dHRvbihcbiAgdGV4dDogc3RyaW5nLFxuICBmb3JtdWxhOiBzdHJpbmcsXG4gIG9uUm9sbERpY2U6IChmb3JtdWxhOiBzdHJpbmcpID0+IHZvaWRcbik6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgY29uc3QgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgYnV0dG9uLnR5cGUgPSBcImJ1dHRvblwiO1xuICBidXR0b24uY2xhc3NOYW1lID0gXCJzZC1tb25zdGVyLWRpY2UtYnV0dG9uXCI7XG4gIGJ1dHRvbi50ZXh0Q29udGVudCA9IHRleHQ7XG4gIGJ1dHRvbi50aXRsZSA9IGBSb2xsICR7Zm9ybXVsYX1gO1xuXG4gIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2dCkgPT4ge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBvblJvbGxEaWNlKGZvcm11bGEpO1xuICB9KTtcblxuICByZXR1cm4gYnV0dG9uO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRBdHRhY2tCb2R5V2l0aERpY2VCdXR0b25zKFxuICBwYXJlbnQ6IEhUTUxFbGVtZW50LFxuICBib2R5OiBzdHJpbmcsXG4gIG9uUm9sbERpY2U6IChmb3JtdWxhOiBzdHJpbmcpID0+IHZvaWRcbik6IHZvaWQge1xuICBjb25zdCBhdHRhY2tCb251c1JlZ2V4ID0gLyhbKy1dXFxkKykvO1xuICBjb25zdCBkYW1hZ2VSZWdleCA9IC9cXGIoXFxkK2RcXGQrKD86XFxzKlsrLV1cXHMqXFxkKyk/KVxcYi9pO1xuXG4gIGNvbnN0IHJlcGxhY2VtZW50czogQXJyYXk8e1xuICAgIHN0YXJ0OiBudW1iZXI7XG4gICAgZW5kOiBudW1iZXI7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIGZvcm11bGE6IHN0cmluZztcbiAgfT4gPSBbXTtcblxuICBjb25zdCBib251c01hdGNoID0gYXR0YWNrQm9udXNSZWdleC5leGVjKGJvZHkpO1xuICBpZiAoYm9udXNNYXRjaD8uaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IHRleHQgPSBib251c01hdGNoWzFdO1xuICAgIHJlcGxhY2VtZW50cy5wdXNoKHtcbiAgICAgIHN0YXJ0OiBib251c01hdGNoLmluZGV4LFxuICAgICAgZW5kOiBib251c01hdGNoLmluZGV4ICsgdGV4dC5sZW5ndGgsXG4gICAgICB0ZXh0LFxuICAgICAgZm9ybXVsYTogYXR0YWNrQm9udXNUb0Zvcm11bGEodGV4dClcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGRhbWFnZU1hdGNoID0gZGFtYWdlUmVnZXguZXhlYyhib2R5KTtcbiAgaWYgKGRhbWFnZU1hdGNoPy5pbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgdGV4dCA9IGRhbWFnZU1hdGNoWzFdO1xuICAgIHJlcGxhY2VtZW50cy5wdXNoKHtcbiAgICAgIHN0YXJ0OiBkYW1hZ2VNYXRjaC5pbmRleCxcbiAgICAgIGVuZDogZGFtYWdlTWF0Y2guaW5kZXggKyB0ZXh0Lmxlbmd0aCxcbiAgICAgIHRleHQsXG4gICAgICBmb3JtdWxhOiBub3JtYWxpemVEaWNlRm9ybXVsYSh0ZXh0KVxuICAgIH0pO1xuICB9XG5cbiAgcmVwbGFjZW1lbnRzLnNvcnQoKGEsIGIpID0+IGEuc3RhcnQgLSBiLnN0YXJ0KTtcblxuICBsZXQgY3Vyc29yID0gMDtcblxuICBmb3IgKGNvbnN0IHJlcGxhY2VtZW50IG9mIHJlcGxhY2VtZW50cykge1xuICAgIGlmIChyZXBsYWNlbWVudC5zdGFydCA8IGN1cnNvcikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHJlcGxhY2VtZW50LnN0YXJ0ID4gY3Vyc29yKSB7XG4gICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoYm9keS5zbGljZShjdXJzb3IsIHJlcGxhY2VtZW50LnN0YXJ0KSkpO1xuICAgIH1cblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChcbiAgICAgIGNyZWF0ZURpY2VSb2xsQnV0dG9uKHJlcGxhY2VtZW50LnRleHQsIHJlcGxhY2VtZW50LmZvcm11bGEsIG9uUm9sbERpY2UpXG4gICAgKTtcblxuICAgIGN1cnNvciA9IHJlcGxhY2VtZW50LmVuZDtcbiAgfVxuXG4gIGlmIChjdXJzb3IgPCBib2R5Lmxlbmd0aCkge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShib2R5LnNsaWNlKGN1cnNvcikpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBlbmRUZXh0V2l0aERhbWFnZURpY2VCdXR0b25zKFxuICBwYXJlbnQ6IEhUTUxFbGVtZW50LFxuICB0ZXh0OiBzdHJpbmcsXG4gIG9uUm9sbERpY2U6IChmb3JtdWxhOiBzdHJpbmcpID0+IHZvaWRcbik6IHZvaWQge1xuICBjb25zdCBkYW1hZ2VSZWdleCA9IC9cXGJcXGQrZFxcZCsoPzpcXHMqWystXVxccypcXGQrKT9cXGIvZ2k7XG5cbiAgbGV0IGN1cnNvciA9IDA7XG4gIGxldCBtYXRjaDogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcblxuICB3aGlsZSAoKG1hdGNoID0gZGFtYWdlUmVnZXguZXhlYyh0ZXh0KSkgIT09IG51bGwpIHtcbiAgICBjb25zdCBkaWNlVGV4dCA9IG1hdGNoWzBdO1xuICAgIGNvbnN0IHN0YXJ0ID0gbWF0Y2guaW5kZXg7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBkaWNlVGV4dC5sZW5ndGg7XG5cbiAgICBpZiAoc3RhcnQgPiBjdXJzb3IpIHtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0LnNsaWNlKGN1cnNvciwgc3RhcnQpKSk7XG4gICAgfVxuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKFxuICAgICAgY3JlYXRlRGljZVJvbGxCdXR0b24oZGljZVRleHQsIG5vcm1hbGl6ZURpY2VGb3JtdWxhKGRpY2VUZXh0KSwgb25Sb2xsRGljZSlcbiAgICApO1xuXG4gICAgY3Vyc29yID0gZW5kO1xuICB9XG5cbiAgaWYgKGN1cnNvciA8IHRleHQubGVuZ3RoKSB7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQuc2xpY2UoY3Vyc29yKSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFJlbmRlcmVkQXR0YWNrKFxuICBsaTogSFRNTExJRWxlbWVudCxcbiAgYXR0YWNrVGV4dDogc3RyaW5nLFxuICBzZXR0aW5nczogU2hhZG93ZGFya1N0YXRibG9ja3NTZXR0aW5ncyxcbiAgb3B0aW9uczogTW9uc3RlclJlbmRlck9wdGlvbnNcbik6IHZvaWQge1xuICBjb25zdCB7IGNvbm5lY3RvciwgYm9keSB9ID0gc3BsaXRBdHRhY2tDb25uZWN0b3IoYXR0YWNrVGV4dCk7XG5cbiAgaWYgKGNvbm5lY3Rvcikge1xuICAgIGxpLmFwcGVuZENoaWxkKGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLWF0dGFjay1jb25uZWN0b3JcIiwgYCR7Y29ubmVjdG9yfSBgKSk7XG4gIH1cblxuICBjb25zdCBhdHRhY2tUZXh0RWwgPSBjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci1hdHRhY2stdGV4dFwiKTtcblxuICBpZiAoc2V0dGluZ3MuZW5hYmxlRGljZVJvbGxlckludGVncmF0aW9uICYmIG9wdGlvbnMub25Sb2xsRGljZSkge1xuICAgIGFwcGVuZEF0dGFja0JvZHlXaXRoRGljZUJ1dHRvbnMoYXR0YWNrVGV4dEVsLCBib2R5LCBvcHRpb25zLm9uUm9sbERpY2UpO1xuICB9IGVsc2Uge1xuICAgIGF0dGFja1RleHRFbC50ZXh0Q29udGVudCA9IGJvZHk7XG4gIH1cblxuICBsaS5hcHBlbmRDaGlsZChhdHRhY2tUZXh0RWwpO1xufVxuXG5mdW5jdGlvbiBzcGxpdExhYmVsQW5kQm9keSh0ZXh0OiBzdHJpbmcpOiB7IGxhYmVsOiBzdHJpbmc7IGJvZHk6IHN0cmluZyB9IHtcbiAgY29uc3QgdHJpbW1lZCA9IHRleHQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4geyBsYWJlbDogXCJcIiwgYm9keTogXCJcIiB9O1xuICB9XG5cbiAgbGV0IG1hdGNoOiBSZWdFeHBNYXRjaEFycmF5IHwgbnVsbCA9IG51bGw7XG5cbiAgLy8gMSkgUGFyZW50aGV0aWNhbCBzcGVsbC1zdHlsZSBsYWJlbCB1cCB0byBmaXJzdCBwZXJpb2RcbiAgLy8gRXhhbXBsZTogXCJSYXkgb2YgRnJvc3QgKElOVCAxNSkuIFRhcmdldCB0YWtlcy4uLlwiXG4gIG1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXiguezEsMTAwfT9cXChbXildezEsNDB9XFwpXFwuKVxccyooLispJC8pO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGFiZWw6IG1hdGNoWzFdLnRyaW0oKSxcbiAgICAgIGJvZHk6IG1hdGNoWzJdLnRyaW0oKVxuICAgIH07XG4gIH1cblxuICAvLyAyKSBTdGFuZGFyZCBzZW50ZW5jZSBsYWJlbFxuICAvLyBFeGFtcGxlOiBcIkRldm91ci4gVXNlIHR1cm4gdG8gZGV2b3VyLi4uXCJcbiAgbWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKFteLiE/Ol17MSw4MH1bLiE/XSlcXHMqKC4rKSQvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsOiBtYXRjaFsxXS50cmltKCksXG4gICAgICBib2R5OiBtYXRjaFsyXS50cmltKClcbiAgICB9O1xuICB9XG5cbiAgLy8gMykgQ29sb24gbGFiZWxcbiAgLy8gRXhhbXBsZTogXCJEZXZvdXI6IFVzZSB0dXJuIHRvIGRldm91ci4uLlwiXG4gIG1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXihbXjpdezEsODB9OilcXHMqKC4rKSQvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsOiBtYXRjaFsxXS50cmltKCksXG4gICAgICBib2R5OiBtYXRjaFsyXS50cmltKClcbiAgICB9O1xuICB9XG5cbiAgLy8gNCkgRGFzaCAvIGVtIGRhc2ggbGFiZWxcbiAgLy8gRXhhbXBsZTogXCJTdG9ybWJsb29kIC0gRWxlY3RyaWNpdHkgaW1tdW5lLlwiXG4gIC8vIEV4YW1wbGU6IFwiU3Rvcm1ibG9vZCBcdTIwMTQgRWxlY3RyaWNpdHkgaW1tdW5lLlwiXG4gIG1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXiguezEsODB9P1xcc1stXHUyMDE0XSlcXHMqKC4rKSQvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsOiBtYXRjaFsxXS50cmltKCksXG4gICAgICBib2R5OiBtYXRjaFsyXS50cmltKClcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHsgbGFiZWw6IFwiXCIsIGJvZHk6IHRyaW1tZWQgfTtcbn1cblxuZnVuY3Rpb24gYWRkU2VjdGlvbihcbiAgcGFyZW50OiBIVE1MRWxlbWVudCxcbiAgdGl0bGU6IHN0cmluZyxcbiAgaXRlbXM6IHN0cmluZ1tdLFxuICBjbGFzc05hbWU6IHN0cmluZyxcbiAgc2V0dGluZ3M6IFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3MsXG4gIG9wdGlvbnM6IE1vbnN0ZXJSZW5kZXJPcHRpb25zXG4pOiB2b2lkIHtcbiAgaWYgKGl0ZW1zLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGNvbnN0IHNlY3Rpb24gPSBjcmVhdGVEaXYoXCJzZC1tb25zdGVyLXNlY3Rpb25cIik7XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uLXRpdGxlXCIsIHRpdGxlKSk7XG5cbiAgY29uc3QgbGlzdCA9IGNyZWF0ZUxpc3QoY2xhc3NOYW1lKTtcblxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICBjb25zdCBsaSA9IGNyZWF0ZUxpc3RJdGVtKCk7XG5cbiAgICBjb25zdCB7IGxhYmVsLCBib2R5IH0gPSBzcGxpdExhYmVsQW5kQm9keShpdGVtKTtcblxuICAgIGlmIChsYWJlbCkge1xuICAgICAgbGkuYXBwZW5kQ2hpbGQoY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItYWJpbGl0eS1sYWJlbFwiLCBsYWJlbCkpO1xuICAgIH1cblxuICAgIGlmIChib2R5KSB7XG4gICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgbGkuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCIgXCIpKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJvZHlFbCA9IGNyZWF0ZVNwYW4oXCJzZC1tb25zdGVyLWFiaWxpdHktdGV4dFwiKTtcblxuICAgICAgaWYgKHNldHRpbmdzLmVuYWJsZURpY2VSb2xsZXJJbnRlZ3JhdGlvbiAmJiBvcHRpb25zLm9uUm9sbERpY2UpIHtcblxuICAgICAgICBhcHBlbmRUZXh0V2l0aERhbWFnZURpY2VCdXR0b25zKGJvZHlFbCwgYm9keSwgb3B0aW9ucy5vblJvbGxEaWNlKTtcblxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICBib2R5RWwudGV4dENvbnRlbnQgPSBib2R5O1xuXG4gICAgICB9XG5cbiAgICAgIGxpLmFwcGVuZENoaWxkKGJvZHlFbCk7XG4gICAgfVxuXG4gICAgaWYgKCFsYWJlbCkge1xuICAgICAgaWYgKHNldHRpbmdzLmVuYWJsZURpY2VSb2xsZXJJbnRlZ3JhdGlvbiAmJiBvcHRpb25zLm9uUm9sbERpY2UpIHtcbiAgICAgICAgYXBwZW5kVGV4dFdpdGhEYW1hZ2VEaWNlQnV0dG9ucyhsaSwgaXRlbSwgb3B0aW9ucy5vblJvbGxEaWNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpLnRleHRDb250ZW50ID0gaXRlbTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsaXN0LmFwcGVuZENoaWxkKGxpKTtcbiAgfVxuXG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQobGlzdCk7XG4gIHBhcmVudC5hcHBlbmRDaGlsZChzZWN0aW9uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlck1vbnN0ZXJCbG9jayhcbiAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgbW9uc3RlcjogU2hhZG93ZGFya01vbnN0ZXIsXG4gIHNldHRpbmdzOiBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdzLFxuICB3YXJuaW5nczogc3RyaW5nW10gPSBbXSxcbiAgb3B0aW9uczogTW9uc3RlclJlbmRlck9wdGlvbnMgPSB7fVxuKTogdm9pZCB7XG4gIGNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiO1xuXG4gIGNvbnN0IGNhcmQgPSBjcmVhdGVEaXYoXG4gICAgW1xuICAgICAgXCJzZC1tb25zdGVyLWNhcmRcIixcbiAgICAgIHNldHRpbmdzLmNvbXBhY3RNb2RlID8gXCJpcy1jb21wYWN0XCIgOiBcIlwiXG4gICAgXVxuICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgLmpvaW4oXCIgXCIpXG4gICk7XG5cbiAgY29uc3QgaGVhZGVyID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1oZWFkZXJcIik7XG4gIGhlYWRlci5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLW5hbWVcIiwgbW9uc3Rlci5uYW1lKSk7XG5cbiAgY29uc3QgbWV0YSA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItbWV0YVwiKTtcbiAgY29uc3QgbWV0YVBhcnRzOiBIVE1MRWxlbWVudFtdID0gW107XG5cbiAgaWYgKG1vbnN0ZXIubGV2ZWwpIHtcbiAgICBtZXRhUGFydHMucHVzaChjcmVhdGVTcGFuKHVuZGVmaW5lZCwgYExldmVsICR7bW9uc3Rlci5sZXZlbH1gKSk7XG4gIH1cblxuICBpZiAobW9uc3Rlci5hbGlnbm1lbnQpIHtcbiAgICBjb25zdCBhbGlnbm1lbnRTcGFuID0gY3JlYXRlU3Bhbih1bmRlZmluZWQsIGBBTCAke21vbnN0ZXIuYWxpZ25tZW50fWApO1xuICAgIGNvbnN0IHRvb2x0aXAgPSBnZXRBbGlnbm1lbnRMYWJlbChtb25zdGVyLmFsaWdubWVudCk7XG4gICAgaWYgKHRvb2x0aXApIHtcbiAgICAgIGFsaWdubWVudFNwYW4udGl0bGUgPSB0b29sdGlwO1xuICAgIH1cbiAgICBtZXRhUGFydHMucHVzaChhbGlnbm1lbnRTcGFuKTtcbiAgfVxuXG4gIG1ldGFQYXJ0cy5mb3JFYWNoKChwYXJ0LCBpbmRleCkgPT4ge1xuICAgIG1ldGEuYXBwZW5kQ2hpbGQocGFydCk7XG5cbiAgICBpZiAoaW5kZXggPCBtZXRhUGFydHMubGVuZ3RoIC0gMSkge1xuICAgICAgbWV0YS5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKHVuZGVmaW5lZCwgXCIgXHUyMDIyIFwiKSk7XG4gICAgfVxuICB9KTtcblxuICBoZWFkZXIuYXBwZW5kQ2hpbGQobWV0YSk7XG4gIGNhcmQuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcblxuICBjb25zdCBjb3JlID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1jb3JlXCIpO1xuICBjb3JlLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItY29yZS1pdGVtXCIsIGBBQyAke21vbnN0ZXIuYWN9YCkpO1xuICBjb3JlLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItY29yZS1pdGVtXCIsIGBIUCAke21vbnN0ZXIuaHB9YCkpO1xuXG4gIGlmIChtb25zdGVyLm12KSB7XG4gICAgY29yZS5hcHBlbmRDaGlsZChjcmVhdGVEaXYoXCJzZC1tb25zdGVyLWNvcmUtaXRlbVwiLCBgTVYgJHttb25zdGVyLm12fWApKTtcbiAgfVxuXG4gIGNhcmQuYXBwZW5kQ2hpbGQoY29yZSk7XG5cbiAgaWYgKG1vbnN0ZXIuYXRrLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBhdGtTZWN0aW9uID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uXCIpO1xuICAgIGF0a1NlY3Rpb24uYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uLXRpdGxlXCIsIFwiQVRUQUNLU1wiKSk7XG5cbiAgICBjb25zdCBhdGtMaXN0ID0gY3JlYXRlTGlzdChcInNkLW1vbnN0ZXItYXR0YWNrc1wiKTtcbiAgICBmb3IgKGNvbnN0IGF0dGFjayBvZiBtb25zdGVyLmF0aykge1xuICAgICAgY29uc3QgbGkgPSBjcmVhdGVMaXN0SXRlbShcInNkLW1vbnN0ZXItYXR0YWNrXCIpO1xuICAgICAgYXBwZW5kUmVuZGVyZWRBdHRhY2sobGksIHJlbmRlckF0dGFja1RleHQoYXR0YWNrKSwgc2V0dGluZ3MsIG9wdGlvbnMpO1xuICAgICAgYXRrTGlzdC5hcHBlbmRDaGlsZChsaSk7XG4gICAgfVxuXG4gICAgYXRrU2VjdGlvbi5hcHBlbmRDaGlsZChhdGtMaXN0KTtcbiAgICBjYXJkLmFwcGVuZENoaWxkKGF0a1NlY3Rpb24pO1xuICB9XG5cbiAgY29uc3QgYWJpbGl0aWVzID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uXCIpO1xuICBhYmlsaXRpZXMuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1zZWN0aW9uLXRpdGxlXCIsIFwiQUJJTElUSUVTXCIpKTtcblxuICBjb25zdCBncmlkID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXRpZXNcIik7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBTVFIgJHttb25zdGVyLnN0YXRzLnN0cn1gKSk7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBERVggJHttb25zdGVyLnN0YXRzLmRleH1gKSk7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBDT04gJHttb25zdGVyLnN0YXRzLmNvbn1gKSk7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBJTlQgJHttb25zdGVyLnN0YXRzLmludH1gKSk7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBXSVMgJHttb25zdGVyLnN0YXRzLndpc31gKSk7XG4gIGdyaWQuYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci1hYmlsaXR5XCIsIGBDSEEgJHttb25zdGVyLnN0YXRzLmNoYX1gKSk7XG5cbiAgYWJpbGl0aWVzLmFwcGVuZENoaWxkKGdyaWQpO1xuICBjYXJkLmFwcGVuZENoaWxkKGFiaWxpdGllcyk7XG5cbiAgYWRkU2VjdGlvbihjYXJkLCBcIlRSQUlUU1wiLCBtb25zdGVyLnRyYWl0cywgXCJzZC1tb25zdGVyLWxpc3RcIiwgc2V0dGluZ3MsIG9wdGlvbnMpO1xuICBhZGRTZWN0aW9uKGNhcmQsIFwiU1BFQ0lBTFNcIiwgbW9uc3Rlci5zcGVjaWFscywgXCJzZC1tb25zdGVyLWxpc3RcIiwgc2V0dGluZ3MsIG9wdGlvbnMpO1xuICBhZGRTZWN0aW9uKGNhcmQsIFwiU1BFTExTXCIsIG1vbnN0ZXIuc3BlbGxzLCBcInNkLW1vbnN0ZXItbGlzdFwiLCBzZXR0aW5ncywgb3B0aW9ucyk7XG4gIGFkZFNlY3Rpb24oY2FyZCwgXCJHRUFSXCIsIG1vbnN0ZXIuZ2VhciwgXCJzZC1tb25zdGVyLWxpc3RcIiwgc2V0dGluZ3MsIG9wdGlvbnMpO1xuXG4gIGlmIChtb25zdGVyLmRlc2NyaXB0aW9uKSB7XG4gICAgY29uc3QgZGVzYyA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItc2VjdGlvblwiKTtcbiAgICBkZXNjLmFwcGVuZENoaWxkKGNyZWF0ZURpdihcInNkLW1vbnN0ZXItZGVzY3JpcHRpb25cIiwgbW9uc3Rlci5kZXNjcmlwdGlvbikpO1xuICAgIGNhcmQuYXBwZW5kQ2hpbGQoZGVzYyk7XG4gIH1cblxuICBpZiAoc2V0dGluZ3Muc2hvd1NvdXJjZSAmJiBtb25zdGVyLnNvdXJjZSkge1xuICAgIGNvbnN0IHNvdXJjZSA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItZm9vdGVyXCIpO1xuICAgIHNvdXJjZS5hcHBlbmRDaGlsZChjcmVhdGVTcGFuKFwic2QtbW9uc3Rlci1zb3VyY2VcIiwgYFNvdXJjZTogJHttb25zdGVyLnNvdXJjZX1gKSk7XG4gICAgY2FyZC5hcHBlbmRDaGlsZChzb3VyY2UpO1xuICB9XG5cbiAgaWYgKHNldHRpbmdzLnNob3dUYWdzICYmIG1vbnN0ZXIudGFncy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgdGFncyA9IGNyZWF0ZURpdihcInNkLW1vbnN0ZXItdGFnc1wiKTtcbiAgICBmb3IgKGNvbnN0IHRhZyBvZiBtb25zdGVyLnRhZ3MpIHtcbiAgICAgIHRhZ3MuYXBwZW5kQ2hpbGQoY3JlYXRlU3BhbihcInNkLW1vbnN0ZXItdGFnXCIsIHRhZykpO1xuICAgIH1cbiAgICBjYXJkLmFwcGVuZENoaWxkKHRhZ3MpO1xuICB9XG5cbiAgaWYgKHdhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCB3YXJuaW5nQm94ID0gY3JlYXRlRGl2KFwic2QtbW9uc3Rlci13YXJuaW5nLWJveFwiKTtcbiAgICBmb3IgKGNvbnN0IHdhcm5pbmcgb2Ygd2FybmluZ3MpIHtcbiAgICAgIHdhcm5pbmdCb3guYXBwZW5kQ2hpbGQoY3JlYXRlRGl2KFwic2QtbW9uc3Rlci13YXJuaW5nXCIsIHdhcm5pbmcpKTtcbiAgICB9XG4gICAgY2FyZC5hcHBlbmRDaGlsZCh3YXJuaW5nQm94KTtcbiAgfVxuXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYXJkKTtcbn0iLCAiZXhwb3J0IGludGVyZmFjZSBTaGFkb3dkYXJrU3RhdGJsb2Nrc1NldHRpbmdzIHtcbiAgY29tcGFjdE1vZGU6IGJvb2xlYW47XG4gIHNob3dTb3VyY2U6IGJvb2xlYW47XG4gIHNob3dUYWdzOiBib29sZWFuO1xuICBlbmFibGVEaWNlUm9sbGVySW50ZWdyYXRpb246IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NUQVRCTE9DS19SRU5ERVJfU0VUVElOR1M6IFNoYWRvd2RhcmtTdGF0YmxvY2tzU2V0dGluZ3MgPSB7XG4gIGNvbXBhY3RNb2RlOiB0cnVlLFxuICBzaG93U291cmNlOiB0cnVlLFxuICBzaG93VGFnczogdHJ1ZSxcbiAgZW5hYmxlRGljZVJvbGxlckludGVncmF0aW9uOiBmYWxzZVxufTsiXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxtQkFBK0I7OztBQ0l4QixJQUFNLGVBQWU7OztBQ0FyQixJQUFNLGVBQU4sTUFBbUI7QUFBQSxFQUd4QixZQUFZLEtBQVU7QUFDcEIsU0FBSyxNQUFNO0FBQUEsRUFDYjtBQUFBLEVBRUEsZUFBZSxPQUFpQztBQUM5QyxVQUFNLFFBQVEsTUFBTSxZQUFZLEVBQUUsS0FBSztBQUV2QyxRQUFJLENBQUMsT0FBTztBQUNSLGFBQU8sS0FBSyxlQUFlO0FBQUEsSUFDL0I7QUFFQSxXQUFPLEtBQUssZUFBZSxFQUFFO0FBQUEsTUFBTyxDQUFDLFlBQ2pDLFFBQVEsS0FBSyxZQUFZLEVBQUUsU0FBUyxLQUFLO0FBQUEsSUFDN0M7QUFBQSxFQUNKO0FBQUEsRUFFRSxpQkFBbUM7QUFDakMsVUFBTSxRQUFRLEtBQUssSUFBSSxNQUFNLGlCQUFpQjtBQUU5QyxVQUFNLFdBQTZCLENBQUM7QUFFcEMsZUFBVyxRQUFRLE9BQU87QUFDeEIsWUFBTSxVQUFVLEtBQUssbUJBQW1CLElBQUk7QUFFNUMsVUFBSSxTQUFTO0FBQ1gsaUJBQVMsS0FBSyxPQUFPO0FBQUEsTUFDdkI7QUFBQSxJQUNGO0FBRUEsV0FBTyxTQUFTO0FBQUEsTUFBSyxDQUFDLEdBQUcsTUFDdkIsRUFBRSxLQUFLLGNBQWMsRUFBRSxJQUFJO0FBQUEsSUFDN0I7QUFBQSxFQUNGO0FBQUEsRUFFQSxtQkFBbUIsTUFBb0M7QUFDckQsVUFBTSxRQUNKLEtBQUssSUFBSSxjQUFj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QSxJQUNyQztBQUFBO0FBQUEsRUF6REYsTUFBTSxTQUF3QjtBQUU1QixZQUFRLElBQUksK0JBQStCO0FBRTNDLFNBQUssZUFDSCxJQUFJLGFBQWEsS0FBSyxHQUFHO0FBRTNCLFNBQUssbUJBQ0gsSUFBSSxpQkFBaUIsS0FBSyxHQUFHO0FBRS9CLFNBQUssb0JBQW9CLElBQUksa0JBQWtCLElBQUk7QUFDbkQsU0FBSyxrQkFBa0IsU0FBUztBQUVoQyxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLFVBQVUsTUFBTTtBQUNkLFlBQUk7QUFBQSxVQUNKLEtBQUs7QUFBQSxVQUNMLEtBQUs7QUFBQSxVQUNMLEtBQUs7QUFBQSxRQUNQLEVBQUUsS0FBSztBQUFBLE1BQ1I7QUFBQSxJQUNELENBQUM7QUFFRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUVOLFVBQVUsWUFBWTtBQUVwQixjQUFNLFdBQ0osS0FBSyxhQUFhLGVBQWU7QUFFbkMsY0FBTSxlQUFlLFNBQVMsQ0FBQztBQUUvQixjQUFNLEtBQUssaUJBQ1Isb0JBQW9CO0FBQUEsVUFDbkIsTUFBTTtBQUFBLFVBRU4sVUFBVSxlQUNOLENBQUM7QUFBQSxZQUNDLE1BQU0sYUFBYTtBQUFBLFlBQ25CLE1BQU0sYUFBYTtBQUFBLFlBQ25CLEtBQUs7QUFBQSxVQUNQLENBQUMsSUFDRCxDQUFDO0FBQUEsUUFDUCxDQUFDO0FBRUgsWUFBSSx3QkFBTyxtQkFBbUI7QUFBQSxNQUNoQztBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQU9BLFdBQWlCO0FBQ2YsWUFBUSxJQUFJLGlDQUFpQztBQUFBLEVBQy9DO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJzZWN0aW9uIiwgIl9hIl0KfQo=
