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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL2NvbnN0YW50cy9wbHVnaW4udHMiLCAic3JjL3NlcnZpY2VzL01vbnN0ZXJJbmRleC50cyIsICJzcmMvc2VydmljZXMvRW5jb3VudGVyU2VydmljZS50cyIsICJzcmMvdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlLnRzIiwgInNyYy9tb2RhbHMvQ3JlYXRlRW5jb3VudGVyTW9kYWwudHMiLCAic3JjL2NvbXBvbmVudHMvTW9uc3RlclByZXZpZXdQb3BvdmVyLnRzIiwgInNyYy9yZW5kZXJlcnMvRW5jb3VudGVyUmVuZGVyZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IE5vdGljZSwgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IE1vbnN0ZXJJbmRleCB9IGZyb20gXCIuL3NlcnZpY2VzL01vbnN0ZXJJbmRleFwiO1xuaW1wb3J0IHsgRW5jb3VudGVyU2VydmljZSB9IGZyb20gXCIuL3NlcnZpY2VzL0VuY291bnRlclNlcnZpY2VcIjtcbmltcG9ydCB7IENyZWF0ZUVuY291bnRlck1vZGFsIH0gZnJvbSBcIi4vbW9kYWxzL0NyZWF0ZUVuY291bnRlck1vZGFsXCI7XG5cbmltcG9ydCB7IEVuY291bnRlclJlbmRlcmVyIH0gZnJvbSBcIi4vcmVuZGVyZXJzL0VuY291bnRlclJlbmRlcmVyXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcblxuICBtb25zdGVySW5kZXghOiBNb25zdGVySW5kZXg7XG5cbiAgZW5jb3VudGVyU2VydmljZSE6IEVuY291bnRlclNlcnZpY2U7XG5cbiAgZW5jb3VudGVyUmVuZGVyZXIhOiBFbmNvdW50ZXJSZW5kZXJlcjtcblxuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICBjb25zb2xlLmxvZyhcIkxvYWRpbmcgU2hhZG93ZGFyayBFbmNvdW50ZXJzXCIpO1xuXG4gICAgdGhpcy5tb25zdGVySW5kZXggPVxuICAgICAgbmV3IE1vbnN0ZXJJbmRleCh0aGlzLmFwcCk7XG5cbiAgICB0aGlzLmVuY291bnRlclNlcnZpY2UgPVxuICAgICAgbmV3IEVuY291bnRlclNlcnZpY2UodGhpcy5hcHApO1xuXG4gICAgdGhpcy5lbmNvdW50ZXJSZW5kZXJlciA9IG5ldyBFbmNvdW50ZXJSZW5kZXJlcih0aGlzKTtcbiAgICB0aGlzLmVuY291bnRlclJlbmRlcmVyLnJlZ2lzdGVyKCk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiY3JlYXRlLXNoYWRvd2RhcmstZW5jb3VudGVyXCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZSBTaGFkb3dkYXJrIEVuY291bnRlclwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgbmV3IENyZWF0ZUVuY291bnRlck1vZGFsKFxuICAgICAgICB0aGlzLmFwcCxcbiAgICAgICAgdGhpcy5tb25zdGVySW5kZXgsXG4gICAgICAgIHRoaXMuZW5jb3VudGVyU2VydmljZVxuICAgICAgKS5vcGVuKCk7XG4gICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJjcmVhdGUtdGVzdC1lbmNvdW50ZXJcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlIFRlc3QgRW5jb3VudGVyXCIsXG5cbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG5cbiAgICAgICAgY29uc3QgbW9uc3RlcnMgPVxuICAgICAgICAgIHRoaXMubW9uc3RlckluZGV4LmdldEFsbE1vbnN0ZXJzKCk7XG5cbiAgICAgICAgY29uc3QgZmlyc3RNb25zdGVyID0gbW9uc3RlcnNbMF07XG5cbiAgICAgICAgYXdhaXQgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlXG4gICAgICAgICAgLmNyZWF0ZUVuY291bnRlck5vdGUoe1xuICAgICAgICAgICAgbmFtZTogXCJUZXN0IEVuY291bnRlclwiLFxuXG4gICAgICAgICAgICBtb25zdGVyczogZmlyc3RNb25zdGVyXG4gICAgICAgICAgICAgID8gW3tcbiAgICAgICAgICAgICAgICAgIG5hbWU6IGZpcnN0TW9uc3Rlci5uYW1lLFxuICAgICAgICAgICAgICAgICAgcGF0aDogZmlyc3RNb25zdGVyLnBhdGgsXG4gICAgICAgICAgICAgICAgICBxdHk6IDNcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICA6IFtdXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBjcmVhdGVkXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFwaSA9IHtcbiAgICBnZXRBbGxNb25zdGVyczogKCkgPT5cbiAgICAgICAgdGhpcy5tb25zdGVySW5kZXguZ2V0QWxsTW9uc3RlcnMoKVxuICAgIH07XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gICAgY29uc29sZS5sb2coXCJVbmxvYWRpbmcgU2hhZG93ZGFyayBFbmNvdW50ZXJzXCIpO1xuICB9XG59IiwgImV4cG9ydCBjb25zdCBQTFVHSU5fSUQgPSBcInNoYWRvd2RhcmstZW5jb3VudGVyc1wiO1xuXG5leHBvcnQgY29uc3QgRU5DT1VOVEVSX1RZUEUgPSBcImVuY291bnRlclwiO1xuXG5leHBvcnQgY29uc3QgTU9OU1RFUl9UWVBFID0gXCJtb25zdGVyXCI7IiwgImltcG9ydCB7IEFwcCwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IE1PTlNURVJfVFlQRSB9IGZyb20gXCIuLi9jb25zdGFudHMvcGx1Z2luXCI7XG5pbXBvcnQgeyBNb25zdGVyU3VtbWFyeSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmV4cG9ydCBjbGFzcyBNb25zdGVySW5kZXgge1xuICBhcHA6IEFwcDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICB9XG5cbiAgc2VhcmNoTW9uc3RlcnMocXVlcnk6IHN0cmluZyk6IE1vbnN0ZXJTdW1tYXJ5W10ge1xuICAgIGNvbnN0IGxvd2VyID0gcXVlcnkudG9Mb3dlckNhc2UoKS50cmltKCk7XG5cbiAgICBpZiAoIWxvd2VyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEFsbE1vbnN0ZXJzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0QWxsTW9uc3RlcnMoKS5maWx0ZXIoKG1vbnN0ZXIpID0+XG4gICAgICAgIG1vbnN0ZXIubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGxvd2VyKVxuICAgICk7XG59XG5cbiAgZ2V0QWxsTW9uc3RlcnMoKTogTW9uc3RlclN1bW1hcnlbXSB7XG4gICAgY29uc3QgZmlsZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG5cbiAgICBjb25zdCBtb25zdGVyczogTW9uc3RlclN1bW1hcnlbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBjb25zdCBtb25zdGVyID0gdGhpcy5nZXRNb25zdGVyRnJvbUZpbGUoZmlsZSk7XG5cbiAgICAgIGlmIChtb25zdGVyKSB7XG4gICAgICAgIG1vbnN0ZXJzLnB1c2gobW9uc3Rlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vbnN0ZXJzLnNvcnQoKGEsIGIpID0+XG4gICAgICBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpXG4gICAgKTtcbiAgfVxuXG4gIGdldE1vbnN0ZXJGcm9tRmlsZShmaWxlOiBURmlsZSk6IE1vbnN0ZXJTdW1tYXJ5IHwgbnVsbCB7XG4gICAgY29uc3QgY2FjaGUgPVxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG5cbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlcjtcblxuICAgIGlmICghZnJvbnRtYXR0ZXIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChmcm9udG1hdHRlci5zaGFkb3dkYXJrVHlwZSAhPT0gTU9OU1RFUl9UWVBFKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogZnJvbnRtYXR0ZXIubmFtZSB8fCBmaWxlLmJhc2VuYW1lLFxuICAgICAgcGF0aDogZmlsZS5wYXRoLFxuXG4gICAgICBsZXZlbDogZnJvbnRtYXR0ZXIubGV2ZWwsXG4gICAgICBhYzogZnJvbnRtYXR0ZXIuYWMsXG4gICAgICBocDogZnJvbnRtYXR0ZXIuaHAsXG5cbiAgICAgIGF0azogQXJyYXkuaXNBcnJheShmcm9udG1hdHRlci5hdGspXG4gICAgICAgICAgPyBmcm9udG1hdHRlci5hdGtbMF1cbiAgICAgICAgICA6IGZyb250bWF0dGVyLmF0ayxcblxuICAgICAgdHJhaXRzOiBBcnJheS5pc0FycmF5KGZyb250bWF0dGVyLnRyYWl0cylcbiAgICAgICAgICA/IGZyb250bWF0dGVyLnRyYWl0cy5zbGljZSgwLCAyKVxuICAgICAgICAgIDogW10sXG5cbiAgICAgIHRhZ3M6IGZyb250bWF0dGVyLnRhZ3MgfHwgW11cbiAgICB9O1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgbm9ybWFsaXplUGF0aCwgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBFbmNvdW50ZXJEYXRhIH0gZnJvbSBcIi4uL3R5cGVzL2VuY291bnRlcnNcIjtcbmltcG9ydCB7IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24gfSBmcm9tIFwiLi4vdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBFbmNvdW50ZXJTZXJ2aWNlIHtcbiAgYXBwOiBBcHA7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUVuY291bnRlck5vdGUoZW5jb3VudGVyOiBFbmNvdW50ZXJEYXRhKSB7XG4gICAgY29uc3QgY29udGVudCA9IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24oZW5jb3VudGVyKTtcblxuICAgIGNvbnN0IHNhZmVOYW1lID0gZW5jb3VudGVyLm5hbWVcbiAgICAgIC5yZXBsYWNlKC9bXFxcXC86Kj9cIjw+fF0vZywgXCJcIilcbiAgICAgIC50cmltKCk7XG5cbiAgICBjb25zdCBmb2xkZXJQYXRoID0gXCJFbmNvdW50ZXJzXCI7XG4gICAgY29uc3QgZmlsZVBhdGggPSBub3JtYWxpemVQYXRoKGAke2ZvbGRlclBhdGh9LyR7c2FmZU5hbWV9Lm1kYCk7XG5cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihmb2xkZXJQYXRoKTtcblxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUoZmlsZVBhdGgsIGNvbnRlbnQpO1xuXG4gICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUoZmlsZSk7XG5cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlcihwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcblxuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIocGF0aCk7XG4gIH1cbn0iLCAiaW1wb3J0IHsgRW5jb3VudGVyRGF0YSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmZ1bmN0aW9uIHlhbWxTdHJpbmcodmFsdWU6IHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSA/PyBcIlwiKTtcbn1cblxuZnVuY3Rpb24gc2VjdGlvbih0aXRsZTogc3RyaW5nLCBjb250ZW50Pzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAjIyAke3RpdGxlfVxuXG4ke2NvbnRlbnQ/LnRyaW0oKSB8fCBcIlwifVxuYDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24oXG4gIGVuY291bnRlcjogRW5jb3VudGVyRGF0YVxuKTogc3RyaW5nIHtcbiAgY29uc3QgbW9uc3RlckZyb250bWF0dGVyID0gZW5jb3VudGVyLm1vbnN0ZXJzXG4gICAgLm1hcCgobW9uc3RlcikgPT4ge1xuICAgICAgcmV0dXJuIGAgIC0gbmFtZTogJHt5YW1sU3RyaW5nKG1vbnN0ZXIubmFtZSl9XG4gICAgcXR5OiAke21vbnN0ZXIucXR5fVxuICAgIHBhdGg6ICR7eWFtbFN0cmluZyhtb25zdGVyLnBhdGgpfVxuICAgIGxldmVsOiAke3lhbWxTdHJpbmcobW9uc3Rlci5sZXZlbCl9XG4gICAgYWM6ICR7eWFtbFN0cmluZyhtb25zdGVyLmFjKX1cbiAgICBocDogJHt5YW1sU3RyaW5nKG1vbnN0ZXIuaHApfWA7XG4gICAgfSlcbiAgICAuam9pbihcIlxcblwiKTtcblxuICByZXR1cm4gYC0tLVxuc2hhZG93ZGFya1R5cGU6IGVuY291bnRlclxubmFtZTogJHt5YW1sU3RyaW5nKGVuY291bnRlci5uYW1lKX1cbnN0YXR1czogcGxhbm5lZFxuXG5wYXJ0eUxldmVsOiAke2VuY291bnRlci5wYXJ0eUxldmVsID8/IDF9XG5wYXJ0eVNpemU6ICR7ZW5jb3VudGVyLnBhcnR5U2l6ZSA/PyA0fVxuXG50ZXJyYWluOiAke3lhbWxTdHJpbmcoZW5jb3VudGVyLnRlcnJhaW4pfVxubGlnaHQ6ICR7eWFtbFN0cmluZyhlbmNvdW50ZXIubGlnaHQpfVxuXG5tb25zdGVyczpcbiR7bW9uc3RlckZyb250bWF0dGVyIHx8IFwiICBbXVwifVxuXG50YWdzOlxuICAtIHNoYWRvd2RhcmsvZW5jb3VudGVyXG4tLS1cblxuJHtzZWN0aW9uKFwiU2V0dXBcIiwgZW5jb3VudGVyLnNldHVwKX1cbiR7c2VjdGlvbihcIlJlYWQtQWxvdWRcIiwgZW5jb3VudGVyLnJlYWRBbG91ZCl9XG4ke3NlY3Rpb24oXCJUYWN0aWNzXCIsIGVuY291bnRlci50YWN0aWNzKX1cbiR7c2VjdGlvbihcIlRyZWFzdXJlXCIsIGVuY291bnRlci50cmVhc3VyZSl9XG4ke3NlY3Rpb24oXCJOb3Rlc1wiLCBlbmNvdW50ZXIubm90ZXMpfVxuYDtcbn0iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IHNob3dNb25zdGVyUHJldmlldyB9IGZyb20gXCIuLi9jb21wb25lbnRzL01vbnN0ZXJQcmV2aWV3UG9wb3ZlclwiO1xuaW1wb3J0IHsgRW5jb3VudGVyU2VydmljZSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9FbmNvdW50ZXJTZXJ2aWNlXCI7XG5pbXBvcnQgeyBNb25zdGVySW5kZXggfSBmcm9tIFwiLi4vc2VydmljZXMvTW9uc3RlckluZGV4XCI7XG5pbXBvcnQgeyBnZW5lcmF0ZUVuY291bnRlck1hcmtkb3duIH0gZnJvbSBcIi4uL3RlbXBsYXRlcy9lbmNvdW50ZXJUZW1wbGF0ZVwiO1xuaW1wb3J0IHsgRW5jb3VudGVyRGF0YSwgTW9uc3RlclJlZmVyZW5jZSwgTW9uc3RlclN1bW1hcnkgfSBmcm9tIFwiLi4vdHlwZXMvZW5jb3VudGVyc1wiO1xuXG50eXBlIEVuY291bnRlcldpemFyZFN0ZXAgPSBcIm1vbnN0ZXJzXCIgfCBcImRldGFpbHNcIiB8IFwicHJldmlld1wiO1xuXG5leHBvcnQgY2xhc3MgQ3JlYXRlRW5jb3VudGVyTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIG1vbnN0ZXJJbmRleDogTW9uc3RlckluZGV4O1xuICBlbmNvdW50ZXJTZXJ2aWNlOiBFbmNvdW50ZXJTZXJ2aWNlO1xuXG4gIGN1cnJlbnRTdGVwOiBFbmNvdW50ZXJXaXphcmRTdGVwID0gXCJtb25zdGVyc1wiO1xuXG4gIGVuY291bnRlck5hbWUgPSBcIlwiO1xuXG4gIHNlbGVjdGVkTW9uc3RlcnM6IE1vbnN0ZXJSZWZlcmVuY2VbXSA9IFtdO1xuXG4gIG1vbnN0ZXJTZWFyY2ggPSBcIlwiO1xuICBsZXZlbEZpbHRlciA9IFwiXCI7XG4gIHRhZ0ZpbHRlciA9IFwiXCI7XG4gIHNvcnRNb2RlID0gXCJuYW1lLWFzY1wiO1xuXG4gIHBhcnR5TGV2ZWwgPSAxO1xuICBwYXJ0eVNpemUgPSA0O1xuXG4gIHNldHVwID0gXCJcIjtcbiAgcmVhZEFsb3VkID0gXCJcIjtcbiAgdGFjdGljcyA9IFwiXCI7XG4gIHRyZWFzdXJlID0gXCJcIjtcbiAgbm90ZXMgPSBcIlwiO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIG1vbnN0ZXJJbmRleDogTW9uc3RlckluZGV4LFxuICAgIGVuY291bnRlclNlcnZpY2U6IEVuY291bnRlclNlcnZpY2VcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcblxuICAgIHRoaXMubW9uc3RlckluZGV4ID0gbW9uc3RlckluZGV4O1xuICAgIHRoaXMuZW5jb3VudGVyU2VydmljZSA9IGVuY291bnRlclNlcnZpY2U7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy5tb2RhbEVsLmFkZENsYXNzKFwic2QtZW5jb3VudGVyLW1vZGFsXCIpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICByZW5kZXIoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG5cbiAgICBjb250ZW50RWwuZW1wdHkoKTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHtcbiAgICAgIHRleHQ6IFwiQ3JlYXRlIFNoYWRvd2RhcmsgRW5jb3VudGVyXCJcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyU3RlcEluZGljYXRvcihjb250ZW50RWwpO1xuXG4gICAgaWYgKHRoaXMuY3VycmVudFN0ZXAgPT09IFwibW9uc3RlcnNcIikge1xuICAgICAgdGhpcy5yZW5kZXJNb25zdGVyU3RlcChjb250ZW50RWwpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGVwID09PSBcImRldGFpbHNcIikge1xuICAgICAgdGhpcy5yZW5kZXJEZXRhaWxzU3RlcChjb250ZW50RWwpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyUHJldmlld1N0ZXAoY29udGVudEVsKTtcbiAgfVxuXG4gIHJlbmRlclN0ZXBJbmRpY2F0b3IoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItc3RlcC1pbmRpY2F0b3JcIixcbiAgICAgIHRleHQ6XG4gICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPT09IFwibW9uc3RlcnNcIlxuICAgICAgICAgID8gXCJTdGVwIDEgb2YgMzogQWRkIE1vbnN0ZXJzXCJcbiAgICAgICAgICA6IHRoaXMuY3VycmVudFN0ZXAgPT09IFwiZGV0YWlsc1wiXG4gICAgICAgICAgICA/IFwiU3RlcCAyIG9mIDM6IEFkZCBEZXRhaWxzXCJcbiAgICAgICAgICAgIDogXCJTdGVwIDMgb2YgMzogUHJldmlld1wiXG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJNb25zdGVyU3RlcChjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJFbmNvdW50ZXIgbmFtZVwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkdvYmxpbiBBbWJ1c2hcIik7XG4gICAgICAgIHRleHQuc2V0VmFsdWUodGhpcy5lbmNvdW50ZXJOYW1lKTtcblxuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMuZW5jb3VudGVyTmFtZSA9IHZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgY29uc3QgYnVpbGRlckVsID0gY29udGVudEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWJ1aWxkZXJcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgYnJvd3NlckVsID0gYnVpbGRlckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWJyb3dzZXJcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgZHJhZnRFbCA9IGJ1aWxkZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1kcmFmdFwiXG4gICAgfSk7XG5cbiAgICBicm93c2VyRWwuY3JlYXRlRWwoXCJoM1wiLCB7XG4gICAgICB0ZXh0OiBcIk1vbnN0ZXIgQnJvd3NlclwiXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlckZpbHRlclJvdyhicm93c2VyRWwpO1xuXG4gICAgY29uc3QgcmVzdWx0c0VsID0gYnJvd3NlckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLW1vbnN0ZXItcmVzdWx0c1wiXG4gICAgfSk7XG5cbiAgICByZXN1bHRzRWwuZGF0YXNldC5yb2xlID0gXCJtb25zdGVyLXJlc3VsdHNcIjtcblxuICAgIGRyYWZ0RWwuY3JlYXRlRWwoXCJoM1wiLCB7XG4gICAgICB0ZXh0OiBcIkVuY291bnRlciBEcmFmdFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBzZWxlY3RlZEVsID0gZHJhZnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1zZWxlY3RlZC1tb25zdGVyc1wiXG4gICAgfSk7XG5cbiAgICBzZWxlY3RlZEVsLmRhdGFzZXQucm9sZSA9IFwic2VsZWN0ZWQtbW9uc3RlcnNcIjtcblxuICAgIGNvbnN0IHN1bW1hcnlFbCA9IGRyYWZ0RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItc3VtbWFyeVwiXG4gICAgfSk7XG5cbiAgICBzdW1tYXJ5RWwuZGF0YXNldC5yb2xlID0gXCJlbmNvdW50ZXItc3VtbWFyeVwiO1xuXG4gICAgY29uc3QgYnV0dG9uRWwgPSBkcmFmdEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWNyZWF0ZS1idXR0b25cIlxuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoYnV0dG9uRWwpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+IHtcbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJOZXh0XCIpXG4gICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmVuY291bnRlck5hbWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJFbmNvdW50ZXIgbmFtZSBpcyByZXF1aXJlZC5cIik7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IFwiZGV0YWlsc1wiO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJNb25zdGVyUmVzdWx0cygpO1xuICAgIHRoaXMucmVuZGVyU2VsZWN0ZWRNb25zdGVycygpO1xuICAgIHRoaXMucmVuZGVyRW5jb3VudGVyU3VtbWFyeSgpO1xuICB9XG5cbiAgcmVuZGVyRmlsdGVyUm93KGJyb3dzZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBmaWx0ZXJSb3cgPSBicm93c2VyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZmlsdGVyLXJvd1wiXG4gICAgfSk7XG5cbiAgICBjb25zdCBzZWFyY2hGaWVsZCA9IGZpbHRlclJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1maWx0ZXItZmllbGRcIlxuICAgIH0pO1xuXG4gICAgc2VhcmNoRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIlNlYXJjaFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBzZWFyY2hJbnB1dCA9IHNlYXJjaEZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJTZWFyY2ggbW9uc3RlcnMuLi5cIlxuICAgIH0pO1xuXG4gICAgc2VhcmNoSW5wdXQudmFsdWUgPSB0aGlzLm1vbnN0ZXJTZWFyY2g7XG5cbiAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5tb25zdGVyU2VhcmNoID0gc2VhcmNoSW5wdXQudmFsdWU7XG4gICAgICB0aGlzLnJlbmRlck1vbnN0ZXJSZXN1bHRzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBsZXZlbEZpZWxkID0gZmlsdGVyUm93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBsZXZlbEZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJMZXZlbFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBsZXZlbFNlbGVjdCA9IGxldmVsRmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG5cbiAgICBsZXZlbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIkFueVwiLFxuICAgICAgdmFsdWU6IFwiXCJcbiAgICB9KTtcblxuICAgIGZvciAobGV0IGxldmVsID0gMDsgbGV2ZWwgPD0gMTA7IGxldmVsKyspIHtcbiAgICAgIGxldmVsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgICAgdGV4dDogU3RyaW5nKGxldmVsKSxcbiAgICAgICAgdmFsdWU6IFN0cmluZyhsZXZlbClcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGxldmVsU2VsZWN0LnZhbHVlID0gdGhpcy5sZXZlbEZpbHRlcjtcblxuICAgIGxldmVsU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5sZXZlbEZpbHRlciA9IGxldmVsU2VsZWN0LnZhbHVlO1xuICAgICAgdGhpcy5yZW5kZXJNb25zdGVyUmVzdWx0cygpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdGFnRmllbGQgPSBmaWx0ZXJSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZmlsdGVyLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIHRhZ0ZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJUYWdcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgdGFnU2VsZWN0ID0gdGFnRmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG5cbiAgICB0YWdTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJBbnlcIixcbiAgICAgIHZhbHVlOiBcIlwiXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IHRhZyBvZiB0aGlzLmdldEF2YWlsYWJsZVRhZ3MoKSkge1xuICAgICAgdGFnU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgICAgdGV4dDogdGFnLFxuICAgICAgICB2YWx1ZTogdGFnXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0YWdTZWxlY3QudmFsdWUgPSB0aGlzLnRhZ0ZpbHRlcjtcblxuICAgIHRhZ1NlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHRoaXMudGFnRmlsdGVyID0gdGFnU2VsZWN0LnZhbHVlO1xuICAgICAgdGhpcy5yZW5kZXJNb25zdGVyUmVzdWx0cygpO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgc29ydEZpZWxkID0gZmlsdGVyUm93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBzb3J0RmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIlNvcnRcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc29ydFNlbGVjdCA9IHNvcnRGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiKTtcblxuICAgIHNvcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJOYW1lIEEtWlwiLFxuICAgICAgdmFsdWU6IFwibmFtZS1hc2NcIlxuICAgIH0pO1xuXG4gICAgc29ydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIk5hbWUgWi1BXCIsXG4gICAgICB2YWx1ZTogXCJuYW1lLWRlc2NcIlxuICAgIH0pO1xuXG4gICAgc29ydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIkxldmVsIExvdy1IaWdoXCIsXG4gICAgICB2YWx1ZTogXCJsZXZlbC1hc2NcIlxuICAgIH0pO1xuXG4gICAgc29ydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB0ZXh0OiBcIkxldmVsIEhpZ2gtTG93XCIsXG4gICAgICB2YWx1ZTogXCJsZXZlbC1kZXNjXCJcbiAgICB9KTtcblxuICAgIHNvcnRTZWxlY3QudmFsdWUgPSB0aGlzLnNvcnRNb2RlO1xuXG4gICAgc29ydFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHRoaXMuc29ydE1vZGUgPSBzb3J0U2VsZWN0LnZhbHVlO1xuICAgICAgdGhpcy5yZW5kZXJNb25zdGVyUmVzdWx0cygpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyRGV0YWlsc1N0ZXAoY29udGVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IGRldGFpbHNFbCA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1kZXRhaWxzLXN0ZXBcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgcGFydHlSb3cgPSBkZXRhaWxzRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcGFydHktcm93XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGxldmVsRmllbGQgPSBwYXJ0eVJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1wYXJ0eS1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBsZXZlbEZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJQYXJ0eSBMZXZlbFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBsZXZlbElucHV0ID0gbGV2ZWxGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwibnVtYmVyXCJcbiAgICB9KTtcblxuICAgIGxldmVsSW5wdXQudmFsdWUgPSBTdHJpbmcodGhpcy5wYXJ0eUxldmVsKTtcblxuICAgIGxldmVsSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIobGV2ZWxJbnB1dC52YWx1ZSk7XG5cbiAgICAgIHRoaXMucGFydHlMZXZlbCA9XG4gICAgICAgIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpICYmIHBhcnNlZCA+IDBcbiAgICAgICAgICA/IE1hdGguZmxvb3IocGFyc2VkKVxuICAgICAgICAgIDogMTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHNpemVGaWVsZCA9IHBhcnR5Um93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXBhcnR5LWZpZWxkXCJcbiAgICB9KTtcblxuICAgIHNpemVGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiUGFydHkgU2l6ZVwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBzaXplSW5wdXQgPSBzaXplRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcIm51bWJlclwiXG4gICAgfSk7XG5cbiAgICBzaXplSW5wdXQudmFsdWUgPSBTdHJpbmcodGhpcy5wYXJ0eVNpemUpO1xuXG4gICAgc2l6ZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyKHNpemVJbnB1dC52YWx1ZSk7XG5cbiAgICAgIHRoaXMucGFydHlTaXplID1cbiAgICAgICAgTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgJiYgcGFyc2VkID4gMFxuICAgICAgICAgID8gTWF0aC5mbG9vcihwYXJzZWQpXG4gICAgICAgICAgOiA0O1xuICAgIH0pO1xuXG4gICAgZGV0YWlsc0VsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkFkZCBvcHRpb25hbCBHTS1mYWNpbmcgZGV0YWlscyBmb3IgdGhpcyBlbmNvdW50ZXIuXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGRldGFpbHNHcmlkID0gZGV0YWlsc0VsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWRldGFpbHMtZ3JpZFwiXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFRleHRBcmVhRmllbGQoZGV0YWlsc0dyaWQsIFwiU2V0dXBcIiwgdGhpcy5zZXR1cCwgKHZhbHVlKSA9PiB7XG4gICAgICB0aGlzLnNldHVwID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFRleHRBcmVhRmllbGQoZGV0YWlsc0dyaWQsIFwiUmVhZC1BbG91ZFwiLCB0aGlzLnJlYWRBbG91ZCwgKHZhbHVlKSA9PiB7XG4gICAgICB0aGlzLnJlYWRBbG91ZCA9IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRUZXh0QXJlYUZpZWxkKGRldGFpbHNHcmlkLCBcIlRhY3RpY3NcIiwgdGhpcy50YWN0aWNzLCAodmFsdWUpID0+IHtcbiAgICAgIHRoaXMudGFjdGljcyA9IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRUZXh0QXJlYUZpZWxkKGRldGFpbHNHcmlkLCBcIlRyZWFzdXJlXCIsIHRoaXMudHJlYXN1cmUsICh2YWx1ZSkgPT4ge1xuICAgICAgdGhpcy50cmVhc3VyZSA9IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgbm90ZXNGaWVsZCA9IGRldGFpbHNFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1kZXRhaWxzLWZpZWxkIHNkLWVuY291bnRlci1ub3Rlcy1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBub3Rlc0ZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJOb3Rlc1wiXG4gICAgfSk7XG5cbiAgICBjb25zdCBub3Rlc0FyZWEgPSBub3Rlc0ZpZWxkLmNyZWF0ZUVsKFwidGV4dGFyZWFcIik7XG5cbiAgICBub3Rlc0FyZWEudmFsdWUgPSB0aGlzLm5vdGVzO1xuICAgIG5vdGVzQXJlYS5yb3dzID0gNDtcblxuICAgIG5vdGVzQXJlYS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5ub3RlcyA9IG5vdGVzQXJlYS52YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyRm9vdGVyQnV0dG9ucyhjb250ZW50RWwsIFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiQmFja1wiLFxuICAgICAgICBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IFwibW9uc3RlcnNcIjtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogXCJTa2lwIERldGFpbHNcIixcbiAgICAgICAgb25DbGljazogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPSBcInByZXZpZXdcIjtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogXCJQcmV2aWV3XCIsXG4gICAgICAgIGN0YTogdHJ1ZSxcbiAgICAgICAgb25DbGljazogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPSBcInByZXZpZXdcIjtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXSk7XG4gIH1cblxuICBhZGRUZXh0QXJlYUZpZWxkKFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBsYWJlbDogc3RyaW5nLFxuICAgIHZhbHVlOiBzdHJpbmcsXG4gICAgb25DaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGZpZWxkRWwgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1kZXRhaWxzLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIGZpZWxkRWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBsYWJlbFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGV4dGFyZWEgPSBmaWVsZEVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIik7XG5cbiAgICB0ZXh0YXJlYS52YWx1ZSA9IHZhbHVlO1xuICAgIHRleHRhcmVhLnJvd3MgPSA0O1xuXG4gICAgdGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIG9uQ2hhbmdlKHRleHRhcmVhLnZhbHVlKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlclByZXZpZXdTdGVwKGNvbnRlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBlbmNvdW50ZXIgPSB0aGlzLmdldEVuY291bnRlckRhdGEoKTtcblxuICAgIGNvbnN0IHByZXZpZXdFbCA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1wcmV2aWV3LXN0ZXBcIlxuICAgIH0pO1xuXG4gICAgcHJldmlld0VsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIlByZXZpZXcgdGhlIG1hcmtkb3duIHRoYXQgd2lsbCBiZSBjcmVhdGVkLlwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBtYXJrZG93blByZXZpZXcgPSBwcmV2aWV3RWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLW1hcmtkb3duLXByZXZpZXdcIlxuICAgIH0pO1xuXG4gICAgbWFya2Rvd25QcmV2aWV3LnZhbHVlID0gZ2VuZXJhdGVFbmNvdW50ZXJNYXJrZG93bihlbmNvdW50ZXIpO1xuICAgIG1hcmtkb3duUHJldmlldy5yZWFkT25seSA9IHRydWU7XG5cbiAgICB0aGlzLnJlbmRlckZvb3RlckJ1dHRvbnMoY29udGVudEVsLCBbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIkJhY2tcIixcbiAgICAgICAgb25DbGljazogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPSBcImRldGFpbHNcIjtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogXCJDcmVhdGUgRW5jb3VudGVyXCIsXG4gICAgICAgIGN0YTogdHJ1ZSxcbiAgICAgICAgb25DbGljazogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlRW5jb3VudGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdKTtcbiAgfVxuXG4gIHJlbmRlckZvb3RlckJ1dHRvbnMoXG4gICAgY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LFxuICAgIGJ1dHRvbnM6IHtcbiAgICAgIGxhYmVsOiBzdHJpbmc7XG4gICAgICBjdGE/OiBib29sZWFuO1xuICAgICAgb25DbGljazogKCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gICAgfVtdXG4gICk6IHZvaWQge1xuXG4gICAgY29uc3QgZm9vdGVyRWwgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci13aXphcmQtZm9vdGVyXCJcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgYnV0dG9uQ29uZmlnIG9mIGJ1dHRvbnMpIHtcblxuICAgICAgY29uc3QgYnV0dG9uID0gZm9vdGVyRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICB0ZXh0OiBidXR0b25Db25maWcubGFiZWxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoYnV0dG9uQ29uZmlnLmN0YSkge1xuICAgICAgICBidXR0b24uYWRkQ2xhc3MoXCJtb2QtY3RhXCIpO1xuICAgICAgfVxuXG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCBidXR0b25Db25maWcub25DbGljaygpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RW5jb3VudGVyRGF0YSgpOiBFbmNvdW50ZXJEYXRhIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogdGhpcy5lbmNvdW50ZXJOYW1lLnRyaW0oKSxcbiAgICAgIHBhcnR5TGV2ZWw6IHRoaXMucGFydHlMZXZlbCxcbiAgICAgIHBhcnR5U2l6ZTogdGhpcy5wYXJ0eVNpemUsXG4gICAgICBtb25zdGVyczogdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLFxuICAgICAgc2V0dXA6IHRoaXMuc2V0dXAsXG4gICAgICByZWFkQWxvdWQ6IHRoaXMucmVhZEFsb3VkLFxuICAgICAgdGFjdGljczogdGhpcy50YWN0aWNzLFxuICAgICAgdHJlYXN1cmU6IHRoaXMudHJlYXN1cmUsXG4gICAgICBub3RlczogdGhpcy5ub3Rlc1xuICAgIH07XG4gIH1cblxuICBnZXRBdmFpbGFibGVUYWdzKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCB0YWdTZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiB0aGlzLm1vbnN0ZXJJbmRleC5nZXRBbGxNb25zdGVycygpKSB7XG4gICAgICBmb3IgKGNvbnN0IHRhZyBvZiBtb25zdGVyLnRhZ3MgPz8gW10pIHtcbiAgICAgICAgdGFnU2V0LmFkZChTdHJpbmcodGFnKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFsuLi50YWdTZXRdLnNvcnQoKGEsIGIpID0+IGEubG9jYWxlQ29tcGFyZShiKSk7XG4gIH1cblxuICBzb3J0TW9uc3RlcnMobW9uc3RlcnM6IE1vbnN0ZXJTdW1tYXJ5W10pOiBNb25zdGVyU3VtbWFyeVtdIHtcbiAgICByZXR1cm4gWy4uLm1vbnN0ZXJzXS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICBjb25zdCBhTGV2ZWwgPSBOdW1iZXIoYS5sZXZlbCA/PyA5OTkpO1xuICAgICAgY29uc3QgYkxldmVsID0gTnVtYmVyKGIubGV2ZWwgPz8gOTk5KTtcblxuICAgICAgc3dpdGNoICh0aGlzLnNvcnRNb2RlKSB7XG4gICAgICAgIGNhc2UgXCJuYW1lLWRlc2NcIjpcbiAgICAgICAgICByZXR1cm4gYi5uYW1lLmxvY2FsZUNvbXBhcmUoYS5uYW1lKTtcblxuICAgICAgICBjYXNlIFwibGV2ZWwtYXNjXCI6XG4gICAgICAgICAgcmV0dXJuIGFMZXZlbCAtIGJMZXZlbCB8fCBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuXG4gICAgICAgIGNhc2UgXCJsZXZlbC1kZXNjXCI6XG4gICAgICAgICAgcmV0dXJuIGJMZXZlbCAtIGFMZXZlbCB8fCBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuXG4gICAgICAgIGNhc2UgXCJuYW1lLWFzY1wiOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyTW9uc3RlclJlc3VsdHMoKTogdm9pZCB7XG4gICAgY29uc3QgcmVzdWx0c0VsID0gdGhpcy5jb250ZW50RWwucXVlcnlTZWxlY3RvcihcbiAgICAgICdbZGF0YS1yb2xlPVwibW9uc3Rlci1yZXN1bHRzXCJdJ1xuICAgICk7XG5cbiAgICBpZiAoIShyZXN1bHRzRWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXN1bHRzRWwuZW1wdHkoKTtcblxuICAgIGxldCBtb25zdGVycyA9IHRoaXMubW9uc3RlckluZGV4LnNlYXJjaE1vbnN0ZXJzKHRoaXMubW9uc3RlclNlYXJjaCk7XG5cbiAgICBpZiAodGhpcy5sZXZlbEZpbHRlcikge1xuICAgICAgbW9uc3RlcnMgPSBtb25zdGVycy5maWx0ZXIoKG1vbnN0ZXIpID0+XG4gICAgICAgIFN0cmluZyhtb25zdGVyLmxldmVsID8/IFwiXCIpID09PSB0aGlzLmxldmVsRmlsdGVyXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnRhZ0ZpbHRlcikge1xuICAgICAgbW9uc3RlcnMgPSBtb25zdGVycy5maWx0ZXIoKG1vbnN0ZXIpID0+XG4gICAgICAgIChtb25zdGVyLnRhZ3MgPz8gW10pLmluY2x1ZGVzKHRoaXMudGFnRmlsdGVyKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBtb25zdGVycyA9IHRoaXMuc29ydE1vbnN0ZXJzKG1vbnN0ZXJzKTtcbiAgICBtb25zdGVycyA9IG1vbnN0ZXJzLnNsaWNlKDAsIDEwMCk7XG5cbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgbW9uc3RlcnMpIHtcbiAgICAgIG5ldyBTZXR0aW5nKHJlc3VsdHNFbClcbiAgICAgICAgLnNldE5hbWUobW9uc3Rlci5uYW1lKVxuICAgICAgICAuc2V0RGVzYyhcbiAgICAgICAgICBbXG4gICAgICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgICAgIG1vbnN0ZXIuYWMgPyBgQUMgJHttb25zdGVyLmFjfWAgOiBudWxsLFxuICAgICAgICAgICAgbW9uc3Rlci5ocCA/IGBIUCAke21vbnN0ZXIuaHB9YCA6IG51bGxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIiBcdTIwMjIgXCIpIHx8IG1vbnN0ZXIucGF0aFxuICAgICAgICApXG4gICAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT4ge1xuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJQcmV2aWV3XCIpXG4gICAgICAgICAgICAub25DbGljaygoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgc2hvd01vbnN0ZXJQcmV2aWV3KHRoaXMuYXBwLCBldmVudCwgbW9uc3Rlcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIkFkZFwiKVxuICAgICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuYWRkTW9uc3Rlcihtb25zdGVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZW5kZXJTZWxlY3RlZE1vbnN0ZXJzKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkRWwgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFxuICAgICAgJ1tkYXRhLXJvbGU9XCJzZWxlY3RlZC1tb25zdGVyc1wiXSdcbiAgICApO1xuXG4gICAgaWYgKCEoc2VsZWN0ZWRFbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGVjdGVkRWwuZW1wdHkoKTtcblxuICAgIGlmICh0aGlzLnNlbGVjdGVkTW9uc3RlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBzZWxlY3RlZEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IFwiTm8gbW9uc3RlcnMgc2VsZWN0ZWQgeWV0LlwiXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiB0aGlzLnNlbGVjdGVkTW9uc3RlcnMpIHtcbiAgICAgIG5ldyBTZXR0aW5nKHNlbGVjdGVkRWwpXG4gICAgICAgIC5zZXROYW1lKG1vbnN0ZXIubmFtZSlcbiAgICAgICAgLnNldERlc2MobW9uc3Rlci5wYXRoKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKG1vbnN0ZXIucXR5KSk7XG5cbiAgICAgICAgICB0ZXh0Lm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcXR5ID0gTnVtYmVyKHZhbHVlKTtcblxuICAgICAgICAgICAgbW9uc3Rlci5xdHkgPVxuICAgICAgICAgICAgICBOdW1iZXIuaXNGaW5pdGUocXR5KSAmJiBxdHkgPiAwXG4gICAgICAgICAgICAgICAgPyBNYXRoLmZsb29yKHF0eSlcbiAgICAgICAgICAgICAgICA6IDE7XG5cbiAgICAgICAgICAgIHRoaXMucmVuZGVyRW5jb3VudGVyU3VtbWFyeSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+IHtcbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiUmVtb3ZlXCIpXG4gICAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRNb25zdGVycyA9IHRoaXMuc2VsZWN0ZWRNb25zdGVycy5maWx0ZXIoXG4gICAgICAgICAgICAgICAgKHNlbGVjdGVkKSA9PiBzZWxlY3RlZC5wYXRoICE9PSBtb25zdGVyLnBhdGhcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICB0aGlzLnJlbmRlclNlbGVjdGVkTW9uc3RlcnMoKTtcbiAgICAgICAgICAgICAgdGhpcy5yZW5kZXJFbmNvdW50ZXJTdW1tYXJ5KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmVuZGVyRW5jb3VudGVyU3VtbWFyeSgpOiB2b2lkIHtcbiAgICBjb25zdCBzdW1tYXJ5RWwgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFxuICAgICAgJ1tkYXRhLXJvbGU9XCJlbmNvdW50ZXItc3VtbWFyeVwiXSdcbiAgICApO1xuXG4gICAgaWYgKCEoc3VtbWFyeUVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3VtbWFyeUVsLmVtcHR5KCk7XG5cbiAgICBjb25zdCBzdW1tYXJ5ID0gdGhpcy5nZXRFbmNvdW50ZXJTdW1tYXJ5KCk7XG5cbiAgICBzdW1tYXJ5RWwuY3JlYXRlRWwoXCJoNFwiLCB7XG4gICAgICB0ZXh0OiBcIkVuY291bnRlciBTdW1tYXJ5XCJcbiAgICB9KTtcblxuICAgIHN1bW1hcnlFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYFRvdGFsIE1vbnN0ZXJzOiAke3N1bW1hcnkudG90YWxNb25zdGVyc31gXG4gICAgfSk7XG5cbiAgICBzdW1tYXJ5RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBVbmlxdWUgTW9uc3RlcnM6ICR7c3VtbWFyeS51bmlxdWVNb25zdGVyc31gXG4gICAgfSk7XG5cbiAgICBzdW1tYXJ5RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBBdmVyYWdlIE1vbnN0ZXIgTGV2ZWw6ICR7c3VtbWFyeS5hdmVyYWdlTGV2ZWwudG9GaXhlZCgxKX1gXG4gICAgfSk7XG4gIH1cblxuICBnZXRFbmNvdW50ZXJTdW1tYXJ5KCk6IHtcbiAgICB0b3RhbE1vbnN0ZXJzOiBudW1iZXI7XG4gICAgdW5pcXVlTW9uc3RlcnM6IG51bWJlcjtcbiAgICBhdmVyYWdlTGV2ZWw6IG51bWJlcjtcbiAgfSB7XG4gICAgY29uc3QgdG90YWxNb25zdGVycyA9IHRoaXMuc2VsZWN0ZWRNb25zdGVycy5yZWR1Y2UoXG4gICAgICAoc3VtLCBtb25zdGVyKSA9PiBzdW0gKyBtb25zdGVyLnF0eSxcbiAgICAgIDBcbiAgICApO1xuXG4gICAgY29uc3QgdW5pcXVlTW9uc3RlcnMgPSB0aGlzLnNlbGVjdGVkTW9uc3RlcnMubGVuZ3RoO1xuXG4gICAgbGV0IHRvdGFsTGV2ZWxzID0gMDtcbiAgICBsZXQgY291bnRlZE1vbnN0ZXJzID0gMDtcblxuICAgIGZvciAoY29uc3QgbW9uc3RlciBvZiB0aGlzLnNlbGVjdGVkTW9uc3RlcnMpIHtcbiAgICAgIGNvbnN0IGxldmVsID0gTnVtYmVyKG1vbnN0ZXIubGV2ZWwpO1xuXG4gICAgICBpZiAoIU51bWJlci5pc05hTihsZXZlbCkpIHtcbiAgICAgICAgdG90YWxMZXZlbHMgKz0gbGV2ZWwgKiBtb25zdGVyLnF0eTtcbiAgICAgICAgY291bnRlZE1vbnN0ZXJzICs9IG1vbnN0ZXIucXR5O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGF2ZXJhZ2VMZXZlbCA9XG4gICAgICBjb3VudGVkTW9uc3RlcnMgPiAwXG4gICAgICAgID8gdG90YWxMZXZlbHMgLyBjb3VudGVkTW9uc3RlcnNcbiAgICAgICAgOiAwO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvdGFsTW9uc3RlcnMsXG4gICAgICB1bmlxdWVNb25zdGVycyxcbiAgICAgIGF2ZXJhZ2VMZXZlbFxuICAgIH07XG4gIH1cblxuICBhZGRNb25zdGVyKG1vbnN0ZXI6IE1vbnN0ZXJTdW1tYXJ5KTogdm9pZCB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnNlbGVjdGVkTW9uc3RlcnMuZmluZChcbiAgICAgIChzZWxlY3RlZCkgPT4gc2VsZWN0ZWQucGF0aCA9PT0gbW9uc3Rlci5wYXRoXG4gICAgKTtcblxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgZXhpc3RpbmcucXR5ICs9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRNb25zdGVycy5wdXNoKHtcbiAgICAgICAgbmFtZTogbW9uc3Rlci5uYW1lLFxuICAgICAgICBwYXRoOiBtb25zdGVyLnBhdGgsXG4gICAgICAgIHF0eTogMSxcbiAgICAgICAgbGV2ZWw6IG1vbnN0ZXIubGV2ZWwsXG4gICAgICAgIGFjOiBtb25zdGVyLmFjLFxuICAgICAgICBocDogbW9uc3Rlci5ocFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5yZW5kZXJTZWxlY3RlZE1vbnN0ZXJzKCk7XG4gICAgdGhpcy5yZW5kZXJFbmNvdW50ZXJTdW1tYXJ5KCk7XG4gIH1cblxuICBhc3luYyBjcmVhdGVFbmNvdW50ZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbmFtZSA9IHRoaXMuZW5jb3VudGVyTmFtZS50cmltKCk7XG5cbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJFbmNvdW50ZXIgbmFtZSBpcyByZXF1aXJlZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuZW5jb3VudGVyU2VydmljZS5jcmVhdGVFbmNvdW50ZXJOb3RlKHRoaXMuZ2V0RW5jb3VudGVyRGF0YSgpKTtcblxuICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBjcmVhdGVkLlwiKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBjcmVhdGUgZW5jb3VudGVyOlwiLCBlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKFwiRmFpbGVkIHRvIGNyZWF0ZSBlbmNvdW50ZXIuIENoZWNrIGNvbnNvbGUuXCIpO1xuICAgIH1cbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIE1lbnUsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgTW9uc3RlclN1bW1hcnkgfSBmcm9tIFwiLi4vdHlwZXMvZW5jb3VudGVyc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gc2hvd01vbnN0ZXJQcmV2aWV3KFxuICBhcHA6IEFwcCxcbiAgZXZlbnQ6IE1vdXNlRXZlbnQsXG4gIG1vbnN0ZXI6IE1vbnN0ZXJTdW1tYXJ5XG4pOiB2b2lkIHtcblxuICBjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcblxuICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZShtb25zdGVyLm5hbWUpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobW9uc3Rlci5wYXRoKTtcblxuICAgICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKS5vcGVuRmlsZShmaWxlKTtcbiAgICAgfSk7XG4gIH0pO1xuXG4gIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cbiAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgaXRlbS5zZXRUaXRsZShcbiAgICAgIFtcbiAgICAgICAgbW9uc3Rlci5sZXZlbCA/IGBMViAke21vbnN0ZXIubGV2ZWx9YCA6IG51bGwsXG4gICAgICAgIG1vbnN0ZXIuYWMgPyBgQUMgJHttb25zdGVyLmFjfWAgOiBudWxsLFxuICAgICAgICBtb25zdGVyLmhwID8gYEhQICR7bW9uc3Rlci5ocH1gIDogbnVsbFxuICAgICAgXVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5qb2luKFwiIFx1MjAyMiBcIilcbiAgICApO1xuXG4gICAgaXRlbS5zZXREaXNhYmxlZCh0cnVlKTtcbiAgfSk7XG5cbiAgaWYgKG1vbnN0ZXIuYXRrKSB7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLnNldFRpdGxlKGBBVEs6ICR7bW9uc3Rlci5hdGt9YCk7XG4gICAgICBpdGVtLnNldERpc2FibGVkKHRydWUpO1xuICAgIH0pO1xuICB9XG5cbiAgZm9yIChjb25zdCB0cmFpdCBvZiBtb25zdGVyLnRyYWl0cyA/PyBbXSkge1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbS5zZXRUaXRsZSh0cmFpdCk7XG4gICAgICBpdGVtLnNldERpc2FibGVkKHRydWUpO1xuICAgIH0pO1xuICB9XG5cbiAgbWVudS5hZGRTZXBhcmF0b3IoKTtcblxuICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICBpdGVtXG4gICAgICAuc2V0VGl0bGUoXCJDb3B5IE1vbnN0ZXIgUGF0aFwiKVxuICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChtb25zdGVyLnBhdGgpO1xuXG4gICAgICAgIG5ldyBOb3RpY2UoXCJNb25zdGVyIHBhdGggY29waWVkLlwiKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICBpdGVtXG4gICAgICAuc2V0VGl0bGUoXCJPcGVuIGluIE5ldyBUYWJcIilcbiAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobW9uc3Rlci5wYXRoKTtcbiAgICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJNb25zdGVyIGZpbGUgbm90IGZvdW5kLlwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBhcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUoZmlsZSk7XG4gICAgICB9KTtcbiAgfSk7XG5cbiAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgaXRlbVxuICAgICAgLnNldFRpdGxlKFwiT3BlbiB0byB0aGUgUmlnaHRcIilcbiAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcblxuICAgICAgICBjb25zdCBmaWxlID1cbiAgICAgICAgICBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG1vbnN0ZXIucGF0aCk7XG5cbiAgICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJNb25zdGVyIGZpbGUgbm90IGZvdW5kLlwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsZWFmID1cbiAgICAgICAgICBhcHAud29ya3NwYWNlLmdldExlYWYoXCJzcGxpdFwiLCBcInZlcnRpY2FsXCIpO1xuXG4gICAgICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gICAgICB9KTtcbiAgfSk7XG5cbiAgbWVudS5zaG93QXRNb3VzZUV2ZW50KGV2ZW50KTtcbn0iLCAiaW1wb3J0IHtcbiAgTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCxcbiAgTWVudSxcbiAgTm90aWNlLFxuICBURmlsZVxufSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IFNoYWRvd2RhcmtFbmNvdW50ZXJzUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5cbmV4cG9ydCBjbGFzcyBFbmNvdW50ZXJSZW5kZXJlciB7XG4gIHBsdWdpbjogU2hhZG93ZGFya0VuY291bnRlcnNQbHVnaW47XG5cbiAgY29uc3RydWN0b3IocGx1Z2luOiBTaGFkb3dkYXJrRW5jb3VudGVyc1BsdWdpbikge1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgcmVnaXN0ZXIoKTogdm9pZCB7XG4gICAgdGhpcy5wbHVnaW4ucmVnaXN0ZXJNYXJrZG93blBvc3RQcm9jZXNzb3IoXG4gICAgICAoXG4gICAgICAgIGVsOiBIVE1MRWxlbWVudCxcbiAgICAgICAgY3R4OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0XG4gICAgICApID0+IHtcbiAgICAgICAgdGhpcy5wcm9jZXNzKGVsLCBjdHgpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBwcm9jZXNzKFxuICAgIGVsOiBIVE1MRWxlbWVudCxcbiAgICBjdHg6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHRcbiAgKTogdm9pZCB7XG4gICAgY29uc3Qgc2VjdGlvbkluZm8gPSBjdHguZ2V0U2VjdGlvbkluZm8oZWwpO1xuXG4gICAgaWYgKCFzZWN0aW9uSW5mbyB8fCBzZWN0aW9uSW5mby5saW5lU3RhcnQgIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID1cbiAgICAgIHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoXG4gICAgICAgIGN0eC5zb3VyY2VQYXRoXG4gICAgICApO1xuXG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNhY2hlID1cbiAgICAgIHRoaXMucGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcblxuICAgIGNvbnN0IGZyb250bWF0dGVyID0gY2FjaGU/LmZyb250bWF0dGVyO1xuXG4gICAgaWYgKGZyb250bWF0dGVyPy5zaGFkb3dkYXJrVHlwZSAhPT0gXCJlbmNvdW50ZXJcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChlbC5xdWVyeVNlbGVjdG9yKFwiLnNkLWVuY291bnRlci1yZW5kZXJlZFwiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRhaW5lciA9IGVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkXCJcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImgyXCIsIHtcbiAgICAgIHRleHQ6IGZyb250bWF0dGVyLm5hbWUgPz8gZmlsZS5iYXNlbmFtZVxuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkLW1ldGFcIixcbiAgICAgIHRleHQ6IFtcbiAgICAgICAgZnJvbnRtYXR0ZXIucGFydHlMZXZlbFxuICAgICAgICAgID8gYFBhcnR5IExldmVsICR7ZnJvbnRtYXR0ZXIucGFydHlMZXZlbH1gXG4gICAgICAgICAgOiBudWxsLFxuICAgICAgICBmcm9udG1hdHRlci5wYXJ0eVNpemVcbiAgICAgICAgICA/IGAke2Zyb250bWF0dGVyLnBhcnR5U2l6ZX0gUENzYFxuICAgICAgICAgIDogbnVsbCxcbiAgICAgICAgZnJvbnRtYXR0ZXIuc3RhdHVzXG4gICAgICAgICAgPyBgU3RhdHVzOiAke2Zyb250bWF0dGVyLnN0YXR1c31gXG4gICAgICAgICAgOiBudWxsXG4gICAgICBdXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLmpvaW4oXCIgXHUyMDIyIFwiKVxuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJEYXNoYm9hcmRTdGF0cyhjb250YWluZXIsIGZyb250bWF0dGVyKTtcbiAgICB0aGlzLnJlbmRlckNvbXBhY3RNb25zdGVyUm9zdGVyKGNvbnRhaW5lciwgZnJvbnRtYXR0ZXIpO1xuICB9XG5cbiAgcmVuZGVyRGFzaGJvYXJkU3RhdHMoXG4gICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgICBmcm9udG1hdHRlcjogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiB2b2lkIHtcbiAgICBjb25zdCBtb25zdGVycyA9IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIubW9uc3RlcnMpXG4gICAgICA/IGZyb250bWF0dGVyLm1vbnN0ZXJzXG4gICAgICA6IFtdO1xuXG4gICAgY29uc3QgdG90YWxNb25zdGVycyA9IG1vbnN0ZXJzLnJlZHVjZShcbiAgICAgIChzdW06IG51bWJlciwgbW9uc3RlcjogUmVjb3JkPHN0cmluZywgYW55PikgPT5cbiAgICAgICAgc3VtICsgTnVtYmVyKG1vbnN0ZXIucXR5ID8/IDEpLFxuICAgICAgMFxuICAgICk7XG5cbiAgICBjb25zdCB1bmlxdWVNb25zdGVycyA9IG1vbnN0ZXJzLmxlbmd0aDtcblxuICAgIGxldCB0b3RhbExldmVscyA9IDA7XG4gICAgbGV0IGNvdW50ZWRNb25zdGVycyA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgbW9uc3RlcnMpIHtcbiAgICAgIGNvbnN0IGxldmVsID0gTnVtYmVyKG1vbnN0ZXIubGV2ZWwpO1xuXG4gICAgICBpZiAoIU51bWJlci5pc05hTihsZXZlbCkpIHtcbiAgICAgICAgY29uc3QgcXR5ID0gTnVtYmVyKG1vbnN0ZXIucXR5ID8/IDEpO1xuXG4gICAgICAgIHRvdGFsTGV2ZWxzICs9IGxldmVsICogcXR5O1xuICAgICAgICBjb3VudGVkTW9uc3RlcnMgKz0gcXR5O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGF2ZXJhZ2VMZXZlbCA9XG4gICAgICBjb3VudGVkTW9uc3RlcnMgPiAwXG4gICAgICAgID8gdG90YWxMZXZlbHMgLyBjb3VudGVkTW9uc3RlcnNcbiAgICAgICAgOiAwO1xuXG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkLXN0YXRzXCIsXG4gICAgICB0ZXh0OlxuICAgICAgICBgJHt0b3RhbE1vbnN0ZXJzfSBNb25zdGVyc2AgK1xuICAgICAgICBgIFx1MjAyMiAke3VuaXF1ZU1vbnN0ZXJzfSBVbmlxdWVgICtcbiAgICAgICAgYCBcdTIwMjIgQXZnIEx2ICR7YXZlcmFnZUxldmVsLnRvRml4ZWQoMSl9YFxuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyQ29tcGFjdE1vbnN0ZXJSb3N0ZXIoXG4gICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgICBmcm9udG1hdHRlcjogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiB2b2lkIHtcbiAgICBjb25zdCBtb25zdGVycyA9IEFycmF5LmlzQXJyYXkoZnJvbnRtYXR0ZXIubW9uc3RlcnMpXG4gICAgICA/IGZyb250bWF0dGVyLm1vbnN0ZXJzXG4gICAgICA6IFtdO1xuXG4gICAgaWYgKG1vbnN0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcmVuZGVyZWQtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJObyBtb25zdGVycyBhZGRlZC5cIlxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByb3N0ZXJFbCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1yZW5kZXJlZC1yb3N0ZXJcIlxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBtb25zdGVyIG9mIG1vbnN0ZXJzKSB7XG4gICAgICBjb25zdCBxdHkgPSBtb25zdGVyLnF0eSA/PyAxO1xuICAgICAgY29uc3QgbmFtZSA9IG1vbnN0ZXIubmFtZSA/PyBcIlVua25vd24gTW9uc3RlclwiO1xuXG4gICAgICBjb25zdCBtZXRhID0gW1xuICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgbW9uc3Rlci5hYyA/IGBBQyAke21vbnN0ZXIuYWN9YCA6IG51bGwsXG4gICAgICAgIG1vbnN0ZXIuaHAgPyBgSFAgJHttb25zdGVyLmhwfWAgOiBudWxsXG4gICAgICBdXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLmpvaW4oXCIgXHUyMDIyIFwiKTtcblxuICAgICAgY29uc3QgcGlsbEVsID0gcm9zdGVyRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXJlbmRlcmVkLW1vbnN0ZXJcIixcbiAgICAgICAgdGV4dDogbWV0YVxuICAgICAgICAgID8gYCR7cXR5fXggJHtuYW1lfSBcdTIwMjIgJHttZXRhfWBcbiAgICAgICAgICA6IGAke3F0eX14ICR7bmFtZX1gXG4gICAgICB9KTtcblxuICAgICAgcGlsbEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5zaG93TW9uc3RlclBpbGxNZW51KGV2ZW50LCBtb25zdGVyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHNob3dNb25zdGVyUGlsbE1lbnUoXG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQsXG4gICAgbW9uc3RlcjogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiB2b2lkIHtcbiAgICBjb25zdCBwYXRoID0gbW9uc3Rlci5wYXRoO1xuICAgIGNvbnN0IG5hbWUgPSBtb25zdGVyLm5hbWUgPz8gXCJVbmtub3duIE1vbnN0ZXJcIjtcblxuICAgIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZShgT3BlbiAke25hbWV9YClcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMub3Blbk1vbnN0ZXIocGF0aCwgXCJjdXJyZW50XCIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbVxuICAgICAgICAuc2V0VGl0bGUoXCJPcGVuIGluIE5ldyBUYWJcIilcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMub3Blbk1vbnN0ZXIocGF0aCwgXCJuZXctdGFiXCIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbVxuICAgICAgICAuc2V0VGl0bGUoXCJPcGVuIHRvIHRoZSBSaWdodFwiKVxuICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5vcGVuTW9uc3RlcihwYXRoLCBcInJpZ2h0XCIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uc2V0VGl0bGUoXG4gICAgICAgIFtcbiAgICAgICAgICBtb25zdGVyLmxldmVsID8gYExWICR7bW9uc3Rlci5sZXZlbH1gIDogbnVsbCxcbiAgICAgICAgICBtb25zdGVyLmFjID8gYEFDICR7bW9uc3Rlci5hY31gIDogbnVsbCxcbiAgICAgICAgICBtb25zdGVyLmhwID8gYEhQICR7bW9uc3Rlci5ocH1gIDogbnVsbFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiIFx1MjAyMiBcIikgfHwgXCJObyBzdGF0cyBhdmFpbGFibGVcIlxuICAgICAgKTtcblxuICAgICAgaXRlbS5zZXREaXNhYmxlZCh0cnVlKTtcbiAgICB9KTtcblxuICAgIG1lbnUuc2hvd0F0TW91c2VFdmVudChldmVudCk7XG4gIH1cblxuICBhc3luYyBvcGVuTW9uc3RlcihcbiAgICBwYXRoOiB1bmtub3duLFxuICAgIG1vZGU6IFwiY3VycmVudFwiIHwgXCJuZXctdGFiXCIgfCBcInJpZ2h0XCJcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiIHx8IHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9XG4gICAgICB0aGlzLnBsdWdpbi5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuXG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgbmV3IE5vdGljZShcIk1vbnN0ZXIgZmlsZSBub3QgZm91bmQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChtb2RlID09PSBcInJpZ2h0XCIpIHtcbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2VcbiAgICAgICAgLmdldExlYWYoXCJzcGxpdFwiLCBcInZlcnRpY2FsXCIpXG4gICAgICAgIC5vcGVuRmlsZShmaWxlKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChtb2RlID09PSBcIm5ldy10YWJcIikge1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZVxuICAgICAgICAuZ2V0TGVhZih0cnVlKVxuICAgICAgICAub3BlbkZpbGUoZmlsZSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlXG4gICAgICAuZ2V0TGVhZihmYWxzZSlcbiAgICAgIC5vcGVuRmlsZShmaWxlKTtcbiAgfVxufSJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQUErQjs7O0FDSXhCLElBQU0sZUFBZTs7O0FDQXJCLElBQU0sZUFBTixNQUFtQjtBQUFBLEVBR3hCLFlBQVksS0FBVTtBQUNwQixTQUFLLE1BQU07QUFBQSxFQUNiO0FBQUEsRUFFQSxlQUFlLE9BQWlDO0FBQzlDLFVBQU0sUUFBUSxNQUFNLFlBQVksRUFBRSxLQUFLO0FBRXZDLFFBQUksQ0FBQyxPQUFPO0FBQ1IsYUFBTyxLQUFLLGVBQWU7QUFBQSxJQUMvQjtBQUVBLFdBQU8sS0FBSyxlQUFlLEVBQUU7QUFBQSxNQUFPLENBQUMsWUFDakMsUUFBUSxLQUFLLFlBQVksRUFBRSxTQUFTLEtBQUs7QUFBQSxJQUM3QztBQUFBLEVBQ0o7QUFBQSxFQUVFLGlCQUFtQztBQUNqQyxVQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0saUJBQWlCO0FBRTlDLFVBQU0sV0FBNkIsQ0FBQztBQUVwQyxlQUFXLFFBQVEsT0FBTztBQUN4QixZQUFNLFVBQVUsS0FBSyxtQkFBbUIsSUFBSTtBQUU1QyxVQUFJLFNBQVM7QUFDWCxpQkFBUyxLQUFLLE9BQU87QUFBQSxNQUN2QjtBQUFBLElBQ0Y7QUFFQSxXQUFPLFNBQVM7QUFBQSxNQUFLLENBQUMsR0FBRyxNQUN2QixFQUFFLEtBQUssY0FBYyxFQUFFLElBQUk7QUFBQSxJQUM3QjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLG1CQUFtQixNQUFvQztBQUNyRCxVQUFNLFFBQ0osS0FBSyxJQUFJLGNBQWMsYUFBYSxJQUFJO0FBRTFDLFVBQU0sY0FBYywrQkFBTztBQUUzQixRQUFJLENBQUMsYUFBYTtBQUNoQixhQUFPO0FBQUEsSUFDVDtBQUVBLFFBQUksWUFBWSxtQkFBbUIsY0FBYztBQUMvQyxhQUFPO0FBQUEsSUFDVDtBQUVBLFdBQU87QUFBQSxNQUNMLE1BQU0sWUFBWSxRQUFRLEtBQUs7QUFBQSxNQUMvQixNQUFNLEtBQUs7QUFBQSxNQUVYLE9BQU8sWUFBWTtBQUFBLE1BQ25CLElBQUksWUFBWTtBQUFBLE1BQ2hCLElBQUksWUFBWTtBQUFBLE1BRWhCLEtBQUssTUFBTSxRQUFRLFlBQVksR0FBRyxJQUM1QixZQUFZLElBQUksQ0FBQyxJQUNqQixZQUFZO0FBQUEsTUFFbEIsUUFBUSxNQUFNLFFBQVEsWUFBWSxNQUFNLElBQ2xDLFlBQVksT0FBTyxNQUFNLEdBQUcsQ0FBQyxJQUM3QixDQUFDO0FBQUEsTUFFUCxNQUFNLFlBQVksUUFBUSxDQUFDO0FBQUEsSUFDN0I7QUFBQSxFQUNGO0FBQ0Y7OztBQzFFQSxzQkFBNEM7OztBQ0U1QyxTQUFTLFdBQVcsT0FBNEM7QUFDOUQsU0FBTyxLQUFLLFVBQVUsd0JBQVMsRUFBRTtBQUNuQztBQUVBLFNBQVMsUUFBUSxPQUFlLFNBQTBCO0FBQ3hELFNBQU8sTUFBTSxLQUFLO0FBQUE7QUFBQSxHQUVsQixtQ0FBUyxXQUFVLEVBQUU7QUFBQTtBQUV2QjtBQUVPLFNBQVMsMEJBQ2QsV0FDUTtBQWZWO0FBZ0JFLFFBQU0scUJBQXFCLFVBQVUsU0FDbEMsSUFBSSxDQUFDLFlBQVk7QUFDaEIsV0FBTyxhQUFhLFdBQVcsUUFBUSxJQUFJLENBQUM7QUFBQSxXQUN2QyxRQUFRLEdBQUc7QUFBQSxZQUNWLFdBQVcsUUFBUSxJQUFJLENBQUM7QUFBQSxhQUN2QixXQUFXLFFBQVEsS0FBSyxDQUFDO0FBQUEsVUFDNUIsV0FBVyxRQUFRLEVBQUUsQ0FBQztBQUFBLFVBQ3RCLFdBQVcsUUFBUSxFQUFFLENBQUM7QUFBQSxFQUM1QixDQUFDLEVBQ0EsS0FBSyxJQUFJO0FBRVosU0FBTztBQUFBO0FBQUEsUUFFRCxXQUFXLFVBQVUsSUFBSSxDQUFDO0FBQUE7QUFBQTtBQUFBLGVBR3BCLGVBQVUsZUFBVixZQUF3QixDQUFDO0FBQUEsY0FDMUIsZUFBVSxjQUFWLFlBQXVCLENBQUM7QUFBQTtBQUFBLFdBRTFCLFdBQVcsVUFBVSxPQUFPLENBQUM7QUFBQSxTQUMvQixXQUFXLFVBQVUsS0FBSyxDQUFDO0FBQUE7QUFBQTtBQUFBLEVBR2xDLHNCQUFzQixNQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTTVCLFFBQVEsU0FBUyxVQUFVLEtBQUssQ0FBQztBQUFBLEVBQ2pDLFFBQVEsY0FBYyxVQUFVLFNBQVMsQ0FBQztBQUFBLEVBQzFDLFFBQVEsV0FBVyxVQUFVLE9BQU8sQ0FBQztBQUFBLEVBQ3JDLFFBQVEsWUFBWSxVQUFVLFFBQVEsQ0FBQztBQUFBLEVBQ3ZDLFFBQVEsU0FBUyxVQUFVLEtBQUssQ0FBQztBQUFBO0FBRW5DOzs7QUQ5Q08sSUFBTSxtQkFBTixNQUF1QjtBQUFBLEVBRzVCLFlBQVksS0FBVTtBQUNwQixTQUFLLE1BQU07QUFBQSxFQUNiO0FBQUEsRUFFQSxNQUFNLG9CQUFvQixXQUEwQjtBQUNsRCxVQUFNLFVBQVUsMEJBQTBCLFNBQVM7QUFFbkQsVUFBTSxXQUFXLFVBQVUsS0FDeEIsUUFBUSxpQkFBaUIsRUFBRSxFQUMzQixLQUFLO0FBRVIsVUFBTSxhQUFhO0FBQ25CLFVBQU0sZUFBVywrQkFBYyxHQUFHLFVBQVUsSUFBSSxRQUFRLEtBQUs7QUFFN0QsVUFBTSxLQUFLLGFBQWEsVUFBVTtBQUVsQyxVQUFNLE9BQU8sTUFBTSxLQUFLLElBQUksTUFBTSxPQUFPLFVBQVUsT0FBTztBQUUxRCxVQUFNLEtBQUssSUFBSSxVQUFVLFFBQVEsSUFBSSxFQUFFLFNBQVMsSUFBSTtBQUVwRCxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSxhQUFhLE1BQTZCO0FBQzlDLFVBQU0sV0FBVyxLQUFLLElBQUksTUFBTSxzQkFBc0IsSUFBSTtBQUUxRCxRQUFJLG9CQUFvQix5QkFBUztBQUMvQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLEtBQUssSUFBSSxNQUFNLGFBQWEsSUFBSTtBQUFBLEVBQ3hDO0FBQ0Y7OztBRXhDQSxJQUFBQyxtQkFBNEM7OztBQ0E1QyxJQUFBQyxtQkFBeUM7QUFJbEMsU0FBUyxtQkFDZCxLQUNBLE9BQ0EsU0FDTTtBQVJSO0FBVUUsUUFBTSxPQUFPLElBQUksc0JBQUs7QUFFdEIsT0FBSyxRQUFRLENBQUMsU0FBUztBQUNyQixTQUNLLFNBQVMsUUFBUSxJQUFJLEVBQ3JCLFFBQVEsWUFBWTtBQUNyQixZQUFNLE9BQU8sSUFBSSxNQUFNLHNCQUFzQixRQUFRLElBQUk7QUFFekQsVUFBSSxFQUFFLGdCQUFnQix5QkFBUTtBQUM1QixZQUFJLHdCQUFPLHlCQUF5QjtBQUNwQztBQUFBLE1BQ0Y7QUFFQSxZQUFNLElBQUksVUFBVSxRQUFRLElBQUksRUFBRSxTQUFTLElBQUk7QUFBQSxJQUNsRCxDQUFDO0FBQUEsRUFDSixDQUFDO0FBRUQsT0FBSyxhQUFhO0FBRWxCLE9BQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsU0FBSztBQUFBLE1BQ0g7QUFBQSxRQUNFLFFBQVEsUUFBUSxNQUFNLFFBQVEsS0FBSyxLQUFLO0FBQUEsUUFDeEMsUUFBUSxLQUFLLE1BQU0sUUFBUSxFQUFFLEtBQUs7QUFBQSxRQUNsQyxRQUFRLEtBQUssTUFBTSxRQUFRLEVBQUUsS0FBSztBQUFBLE1BQ3BDLEVBQ0csT0FBTyxPQUFPLEVBQ2QsS0FBSyxVQUFLO0FBQUEsSUFDZjtBQUVBLFNBQUssWUFBWSxJQUFJO0FBQUEsRUFDdkIsQ0FBQztBQUVELE1BQUksUUFBUSxLQUFLO0FBQ2YsU0FBSyxRQUFRLENBQUMsU0FBUztBQUNyQixXQUFLLFNBQVMsUUFBUSxRQUFRLEdBQUcsRUFBRTtBQUNuQyxXQUFLLFlBQVksSUFBSTtBQUFBLElBQ3ZCLENBQUM7QUFBQSxFQUNIO0FBRUEsYUFBVyxVQUFTLGFBQVEsV0FBUixZQUFrQixDQUFDLEdBQUc7QUFDeEMsU0FBSyxRQUFRLENBQUMsU0FBUztBQUNyQixXQUFLLFNBQVMsS0FBSztBQUNuQixXQUFLLFlBQVksSUFBSTtBQUFBLElBQ3ZCLENBQUM7QUFBQSxFQUNIO0FBRUEsT0FBSyxhQUFhO0FBRWxCLE9BQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsU0FDRyxTQUFTLG1CQUFtQixFQUM1QixRQUFRLE1BQU07QUFDYixnQkFBVSxVQUFVLFVBQVUsUUFBUSxJQUFJO0FBRTFDLFVBQUksd0JBQU8sc0JBQXNCO0FBQUEsSUFDbkMsQ0FBQztBQUFBLEVBQ0wsQ0FBQztBQUVELE9BQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsU0FDRyxTQUFTLGlCQUFpQixFQUMxQixRQUFRLFlBQVk7QUFDbkIsWUFBTSxPQUFPLElBQUksTUFBTSxzQkFBc0IsUUFBUSxJQUFJO0FBQ3pELFVBQUksRUFBRSxnQkFBZ0IseUJBQVE7QUFDNUIsWUFBSSx3QkFBTyx5QkFBeUI7QUFDcEM7QUFBQSxNQUNGO0FBRUEsWUFBTSxJQUFJLFVBQVUsUUFBUSxJQUFJLEVBQUUsU0FBUyxJQUFJO0FBQUEsSUFDakQsQ0FBQztBQUFBLEVBQ0wsQ0FBQztBQUVELE9BQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsU0FDRyxTQUFTLG1CQUFtQixFQUM1QixRQUFRLFlBQVk7QUFFbkIsWUFBTSxPQUNKLElBQUksTUFBTSxzQkFBc0IsUUFBUSxJQUFJO0FBRTlDLFVBQUksRUFBRSxnQkFBZ0IseUJBQVE7QUFDNUIsWUFBSSx3QkFBTyx5QkFBeUI7QUFDcEM7QUFBQSxNQUNGO0FBRUEsWUFBTSxPQUNKLElBQUksVUFBVSxRQUFRLFNBQVMsVUFBVTtBQUUzQyxZQUFNLEtBQUssU0FBUyxJQUFJO0FBQUEsSUFDMUIsQ0FBQztBQUFBLEVBQ0wsQ0FBQztBQUVELE9BQUssaUJBQWlCLEtBQUs7QUFDN0I7OztBRDlGTyxJQUFNLHVCQUFOLGNBQW1DLHVCQUFNO0FBQUEsRUF3QjlDLFlBQ0UsS0FDQSxjQUNBLGtCQUNBO0FBQ0EsVUFBTSxHQUFHO0FBekJYLHVCQUFtQztBQUVuQyx5QkFBZ0I7QUFFaEIsNEJBQXVDLENBQUM7QUFFeEMseUJBQWdCO0FBQ2hCLHVCQUFjO0FBQ2QscUJBQVk7QUFDWixvQkFBVztBQUVYLHNCQUFhO0FBQ2IscUJBQVk7QUFFWixpQkFBUTtBQUNSLHFCQUFZO0FBQ1osbUJBQVU7QUFDVixvQkFBVztBQUNYLGlCQUFRO0FBU04sU0FBSyxlQUFlO0FBQ3BCLFNBQUssbUJBQW1CO0FBQUEsRUFDMUI7QUFBQSxFQUVBLFNBQWU7QUFDYixTQUFLLFFBQVEsU0FBUyxvQkFBb0I7QUFDMUMsU0FBSyxPQUFPO0FBQUEsRUFDZDtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxTQUFLLFVBQVUsTUFBTTtBQUFBLEVBQ3ZCO0FBQUEsRUFFQSxTQUFlO0FBQ2IsVUFBTSxFQUFFLFVBQVUsSUFBSTtBQUV0QixjQUFVLE1BQU07QUFFaEIsY0FBVSxTQUFTLE1BQU07QUFBQSxNQUN2QixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsU0FBSyxvQkFBb0IsU0FBUztBQUVsQyxRQUFJLEtBQUssZ0JBQWdCLFlBQVk7QUFDbkMsV0FBSyxrQkFBa0IsU0FBUztBQUNoQztBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUssZ0JBQWdCLFdBQVc7QUFDbEMsV0FBSyxrQkFBa0IsU0FBUztBQUNoQztBQUFBLElBQ0Y7QUFFQSxTQUFLLGtCQUFrQixTQUFTO0FBQUEsRUFDbEM7QUFBQSxFQUVBLG9CQUFvQixhQUFnQztBQUNsRCxnQkFBWSxTQUFTLEtBQUs7QUFBQSxNQUN4QixLQUFLO0FBQUEsTUFDTCxNQUNFLEtBQUssZ0JBQWdCLGFBQ2pCLDhCQUNBLEtBQUssZ0JBQWdCLFlBQ25CLDZCQUNBO0FBQUEsSUFDVixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsa0JBQWtCLFdBQThCO0FBQzlDLFFBQUkseUJBQVEsU0FBUyxFQUNsQixRQUFRLGdCQUFnQixFQUN4QixRQUFRLENBQUMsU0FBUztBQUNqQixXQUFLLGVBQWUsZUFBZTtBQUNuQyxXQUFLLFNBQVMsS0FBSyxhQUFhO0FBRWhDLFdBQUssU0FBUyxDQUFDLFVBQVU7QUFDdkIsYUFBSyxnQkFBZ0I7QUFBQSxNQUN2QixDQUFDO0FBQUEsSUFDSCxDQUFDO0FBRUgsVUFBTSxZQUFZLFVBQVUsVUFBVTtBQUFBLE1BQ3BDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxVQUFNLFlBQVksVUFBVSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFVBQU0sVUFBVSxVQUFVLFVBQVU7QUFBQSxNQUNsQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsY0FBVSxTQUFTLE1BQU07QUFBQSxNQUN2QixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsU0FBSyxnQkFBZ0IsU0FBUztBQUU5QixVQUFNLFlBQVksVUFBVSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGNBQVUsUUFBUSxPQUFPO0FBRXpCLFlBQVEsU0FBUyxNQUFNO0FBQUEsTUFDckIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sYUFBYSxRQUFRLFVBQVU7QUFBQSxNQUNuQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsZUFBVyxRQUFRLE9BQU87QUFFMUIsVUFBTSxZQUFZLFFBQVEsVUFBVTtBQUFBLE1BQ2xDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxjQUFVLFFBQVEsT0FBTztBQUV6QixVQUFNLFdBQVcsUUFBUSxVQUFVO0FBQUEsTUFDakMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFFBQUkseUJBQVEsUUFBUSxFQUNqQixVQUFVLENBQUMsV0FBVztBQUNyQixhQUNHLGNBQWMsTUFBTSxFQUNwQixPQUFPLEVBQ1AsUUFBUSxNQUFNO0FBQ2IsWUFBSSxDQUFDLEtBQUssY0FBYyxLQUFLLEdBQUc7QUFDOUIsY0FBSSx3QkFBTyw2QkFBNkI7QUFDeEM7QUFBQSxRQUNGO0FBRUEsYUFBSyxjQUFjO0FBQ25CLGFBQUssT0FBTztBQUFBLE1BQ2QsQ0FBQztBQUFBLElBQ0wsQ0FBQztBQUVILFNBQUsscUJBQXFCO0FBQzFCLFNBQUssdUJBQXVCO0FBQzVCLFNBQUssdUJBQXVCO0FBQUEsRUFDOUI7QUFBQSxFQUVBLGdCQUFnQixXQUE4QjtBQUM1QyxVQUFNLFlBQVksVUFBVSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFVBQU0sY0FBYyxVQUFVLFVBQVU7QUFBQSxNQUN0QyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsZ0JBQVksU0FBUyxTQUFTO0FBQUEsTUFDNUIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sY0FBYyxZQUFZLFNBQVMsU0FBUztBQUFBLE1BQ2hELE1BQU07QUFBQSxNQUNOLGFBQWE7QUFBQSxJQUNmLENBQUM7QUFFRCxnQkFBWSxRQUFRLEtBQUs7QUFFekIsZ0JBQVksaUJBQWlCLFNBQVMsTUFBTTtBQUMxQyxXQUFLLGdCQUFnQixZQUFZO0FBQ2pDLFdBQUsscUJBQXFCO0FBQUEsSUFDNUIsQ0FBQztBQUVELFVBQU0sYUFBYSxVQUFVLFVBQVU7QUFBQSxNQUNyQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsZUFBVyxTQUFTLFNBQVM7QUFBQSxNQUMzQixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsVUFBTSxjQUFjLFdBQVcsU0FBUyxRQUFRO0FBRWhELGdCQUFZLFNBQVMsVUFBVTtBQUFBLE1BQzdCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxhQUFTLFFBQVEsR0FBRyxTQUFTLElBQUksU0FBUztBQUN4QyxrQkFBWSxTQUFTLFVBQVU7QUFBQSxRQUM3QixNQUFNLE9BQU8sS0FBSztBQUFBLFFBQ2xCLE9BQU8sT0FBTyxLQUFLO0FBQUEsTUFDckIsQ0FBQztBQUFBLElBQ0g7QUFFQSxnQkFBWSxRQUFRLEtBQUs7QUFFekIsZ0JBQVksaUJBQWlCLFVBQVUsTUFBTTtBQUMzQyxXQUFLLGNBQWMsWUFBWTtBQUMvQixXQUFLLHFCQUFxQjtBQUFBLElBQzVCLENBQUM7QUFFRCxVQUFNLFdBQVcsVUFBVSxVQUFVO0FBQUEsTUFDbkMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGFBQVMsU0FBUyxTQUFTO0FBQUEsTUFDekIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sWUFBWSxTQUFTLFNBQVMsUUFBUTtBQUU1QyxjQUFVLFNBQVMsVUFBVTtBQUFBLE1BQzNCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxlQUFXLE9BQU8sS0FBSyxpQkFBaUIsR0FBRztBQUN6QyxnQkFBVSxTQUFTLFVBQVU7QUFBQSxRQUMzQixNQUFNO0FBQUEsUUFDTixPQUFPO0FBQUEsTUFDVCxDQUFDO0FBQUEsSUFDSDtBQUVBLGNBQVUsUUFBUSxLQUFLO0FBRXZCLGNBQVUsaUJBQWlCLFVBQVUsTUFBTTtBQUN6QyxXQUFLLFlBQVksVUFBVTtBQUMzQixXQUFLLHFCQUFxQjtBQUFBLElBQzVCLENBQUM7QUFFRCxVQUFNLFlBQVksVUFBVSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGNBQVUsU0FBUyxTQUFTO0FBQUEsTUFDMUIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sYUFBYSxVQUFVLFNBQVMsUUFBUTtBQUU5QyxlQUFXLFNBQVMsVUFBVTtBQUFBLE1BQzVCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxlQUFXLFNBQVMsVUFBVTtBQUFBLE1BQzVCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxlQUFXLFNBQVMsVUFBVTtBQUFBLE1BQzVCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxlQUFXLFNBQVMsVUFBVTtBQUFBLE1BQzVCLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNULENBQUM7QUFFRCxlQUFXLFFBQVEsS0FBSztBQUV4QixlQUFXLGlCQUFpQixVQUFVLE1BQU07QUFDMUMsV0FBSyxXQUFXLFdBQVc7QUFDM0IsV0FBSyxxQkFBcUI7QUFBQSxJQUM1QixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsa0JBQWtCLFdBQThCO0FBQzlDLFVBQU0sWUFBWSxVQUFVLFVBQVU7QUFBQSxNQUNwQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsVUFBTSxXQUFXLFVBQVUsVUFBVTtBQUFBLE1BQ25DLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxVQUFNLGFBQWEsU0FBUyxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGVBQVcsU0FBUyxTQUFTO0FBQUEsTUFDM0IsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sYUFBYSxXQUFXLFNBQVMsU0FBUztBQUFBLE1BQzlDLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxlQUFXLFFBQVEsT0FBTyxLQUFLLFVBQVU7QUFFekMsZUFBVyxpQkFBaUIsVUFBVSxNQUFNO0FBQzFDLFlBQU0sU0FBUyxPQUFPLFdBQVcsS0FBSztBQUV0QyxXQUFLLGFBQ0gsT0FBTyxTQUFTLE1BQU0sS0FBSyxTQUFTLElBQ2hDLEtBQUssTUFBTSxNQUFNLElBQ2pCO0FBQUEsSUFDUixDQUFDO0FBRUQsVUFBTSxZQUFZLFNBQVMsVUFBVTtBQUFBLE1BQ25DLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxjQUFVLFNBQVMsU0FBUztBQUFBLE1BQzFCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLFlBQVksVUFBVSxTQUFTLFNBQVM7QUFBQSxNQUM1QyxNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsY0FBVSxRQUFRLE9BQU8sS0FBSyxTQUFTO0FBRXZDLGNBQVUsaUJBQWlCLFVBQVUsTUFBTTtBQUN6QyxZQUFNLFNBQVMsT0FBTyxVQUFVLEtBQUs7QUFFckMsV0FBSyxZQUNILE9BQU8sU0FBUyxNQUFNLEtBQUssU0FBUyxJQUNoQyxLQUFLLE1BQU0sTUFBTSxJQUNqQjtBQUFBLElBQ1IsQ0FBQztBQUVELGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sY0FBYyxVQUFVLFVBQVU7QUFBQSxNQUN0QyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsU0FBSyxpQkFBaUIsYUFBYSxTQUFTLEtBQUssT0FBTyxDQUFDLFVBQVU7QUFDakUsV0FBSyxRQUFRO0FBQUEsSUFDZixDQUFDO0FBRUQsU0FBSyxpQkFBaUIsYUFBYSxjQUFjLEtBQUssV0FBVyxDQUFDLFVBQVU7QUFDMUUsV0FBSyxZQUFZO0FBQUEsSUFDbkIsQ0FBQztBQUVELFNBQUssaUJBQWlCLGFBQWEsV0FBVyxLQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQ3JFLFdBQUssVUFBVTtBQUFBLElBQ2pCLENBQUM7QUFFRCxTQUFLLGlCQUFpQixhQUFhLFlBQVksS0FBSyxVQUFVLENBQUMsVUFBVTtBQUN2RSxXQUFLLFdBQVc7QUFBQSxJQUNsQixDQUFDO0FBRUQsVUFBTSxhQUFhLFVBQVUsVUFBVTtBQUFBLE1BQ3JDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxlQUFXLFNBQVMsU0FBUztBQUFBLE1BQzNCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLFlBQVksV0FBVyxTQUFTLFVBQVU7QUFFaEQsY0FBVSxRQUFRLEtBQUs7QUFDdkIsY0FBVSxPQUFPO0FBRWpCLGNBQVUsaUJBQWlCLFNBQVMsTUFBTTtBQUN4QyxXQUFLLFFBQVEsVUFBVTtBQUFBLElBQ3pCLENBQUM7QUFFRCxTQUFLLG9CQUFvQixXQUFXO0FBQUEsTUFDbEM7QUFBQSxRQUNFLE9BQU87QUFBQSxRQUNQLFNBQVMsTUFBTTtBQUNiLGVBQUssY0FBYztBQUNuQixlQUFLLE9BQU87QUFBQSxRQUNkO0FBQUEsTUFDRjtBQUFBLE1BQ0E7QUFBQSxRQUNFLE9BQU87QUFBQSxRQUNQLFNBQVMsTUFBTTtBQUNiLGVBQUssY0FBYztBQUNuQixlQUFLLE9BQU87QUFBQSxRQUNkO0FBQUEsTUFDRjtBQUFBLE1BQ0E7QUFBQSxRQUNFLE9BQU87QUFBQSxRQUNQLEtBQUs7QUFBQSxRQUNMLFNBQVMsTUFBTTtBQUNiLGVBQUssY0FBYztBQUNuQixlQUFLLE9BQU87QUFBQSxRQUNkO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLGlCQUNFLGFBQ0EsT0FDQSxPQUNBLFVBQ007QUFDTixVQUFNLFVBQVUsWUFBWSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFlBQVEsU0FBUyxTQUFTO0FBQUEsTUFDeEIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sV0FBVyxRQUFRLFNBQVMsVUFBVTtBQUU1QyxhQUFTLFFBQVE7QUFDakIsYUFBUyxPQUFPO0FBRWhCLGFBQVMsaUJBQWlCLFNBQVMsTUFBTTtBQUN2QyxlQUFTLFNBQVMsS0FBSztBQUFBLElBQ3pCLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxrQkFBa0IsV0FBOEI7QUFDOUMsVUFBTSxZQUFZLEtBQUssaUJBQWlCO0FBRXhDLFVBQU0sWUFBWSxVQUFVLFVBQVU7QUFBQSxNQUNwQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsY0FBVSxTQUFTLEtBQUs7QUFBQSxNQUN0QixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsVUFBTSxrQkFBa0IsVUFBVSxTQUFTLFlBQVk7QUFBQSxNQUNyRCxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsb0JBQWdCLFFBQVEsMEJBQTBCLFNBQVM7QUFDM0Qsb0JBQWdCLFdBQVc7QUFFM0IsU0FBSyxvQkFBb0IsV0FBVztBQUFBLE1BQ2xDO0FBQUEsUUFDRSxPQUFPO0FBQUEsUUFDUCxTQUFTLE1BQU07QUFDYixlQUFLLGNBQWM7QUFDbkIsZUFBSyxPQUFPO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsUUFDRSxPQUFPO0FBQUEsUUFDUCxLQUFLO0FBQUEsUUFDTCxTQUFTLFlBQVk7QUFDbkIsZ0JBQU0sS0FBSyxnQkFBZ0I7QUFBQSxRQUM3QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxvQkFDRSxhQUNBLFNBS007QUFFTixVQUFNLFdBQVcsWUFBWSxVQUFVO0FBQUEsTUFDckMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGVBQVcsZ0JBQWdCLFNBQVM7QUFFbEMsWUFBTSxTQUFTLFNBQVMsU0FBUyxVQUFVO0FBQUEsUUFDekMsTUFBTSxhQUFhO0FBQUEsTUFDckIsQ0FBQztBQUVELFVBQUksYUFBYSxLQUFLO0FBQ3BCLGVBQU8sU0FBUyxTQUFTO0FBQUEsTUFDM0I7QUFFQSxhQUFPLGlCQUFpQixTQUFTLE1BQU07QUFDckMsYUFBSyxhQUFhLFFBQVE7QUFBQSxNQUM1QixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLG1CQUFrQztBQUNoQyxXQUFPO0FBQUEsTUFDTCxNQUFNLEtBQUssY0FBYyxLQUFLO0FBQUEsTUFDOUIsWUFBWSxLQUFLO0FBQUEsTUFDakIsV0FBVyxLQUFLO0FBQUEsTUFDaEIsVUFBVSxLQUFLO0FBQUEsTUFDZixPQUFPLEtBQUs7QUFBQSxNQUNaLFdBQVcsS0FBSztBQUFBLE1BQ2hCLFNBQVMsS0FBSztBQUFBLE1BQ2QsVUFBVSxLQUFLO0FBQUEsTUFDZixPQUFPLEtBQUs7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUFBLEVBRUEsbUJBQTZCO0FBamdCL0I7QUFrZ0JJLFVBQU0sU0FBUyxvQkFBSSxJQUFZO0FBRS9CLGVBQVcsV0FBVyxLQUFLLGFBQWEsZUFBZSxHQUFHO0FBQ3hELGlCQUFXLFFBQU8sYUFBUSxTQUFSLFlBQWdCLENBQUMsR0FBRztBQUNwQyxlQUFPLElBQUksT0FBTyxHQUFHLENBQUM7QUFBQSxNQUN4QjtBQUFBLElBQ0Y7QUFFQSxXQUFPLENBQUMsR0FBRyxNQUFNLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQUEsRUFDdEQ7QUFBQSxFQUVBLGFBQWEsVUFBOEM7QUFDekQsV0FBTyxDQUFDLEdBQUcsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU07QUE5Z0J4QztBQStnQk0sWUFBTSxTQUFTLFFBQU8sT0FBRSxVQUFGLFlBQVcsR0FBRztBQUNwQyxZQUFNLFNBQVMsUUFBTyxPQUFFLFVBQUYsWUFBVyxHQUFHO0FBRXBDLGNBQVEsS0FBSyxVQUFVO0FBQUEsUUFDckIsS0FBSztBQUNILGlCQUFPLEVBQUUsS0FBSyxjQUFjLEVBQUUsSUFBSTtBQUFBLFFBRXBDLEtBQUs7QUFDSCxpQkFBTyxTQUFTLFVBQVUsRUFBRSxLQUFLLGNBQWMsRUFBRSxJQUFJO0FBQUEsUUFFdkQsS0FBSztBQUNILGlCQUFPLFNBQVMsVUFBVSxFQUFFLEtBQUssY0FBYyxFQUFFLElBQUk7QUFBQSxRQUV2RCxLQUFLO0FBQUEsUUFDTDtBQUNFLGlCQUFPLEVBQUUsS0FBSyxjQUFjLEVBQUUsSUFBSTtBQUFBLE1BQ3RDO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsdUJBQTZCO0FBQzNCLFVBQU0sWUFBWSxLQUFLLFVBQVU7QUFBQSxNQUMvQjtBQUFBLElBQ0Y7QUFFQSxRQUFJLEVBQUUscUJBQXFCLGNBQWM7QUFDdkM7QUFBQSxJQUNGO0FBRUEsY0FBVSxNQUFNO0FBRWhCLFFBQUksV0FBVyxLQUFLLGFBQWEsZUFBZSxLQUFLLGFBQWE7QUFFbEUsUUFBSSxLQUFLLGFBQWE7QUFDcEIsaUJBQVcsU0FBUztBQUFBLFFBQU8sQ0FBQyxZQUFTO0FBampCM0M7QUFrakJRLHlCQUFPLGFBQVEsVUFBUixZQUFpQixFQUFFLE1BQU0sS0FBSztBQUFBO0FBQUEsTUFDdkM7QUFBQSxJQUNGO0FBRUEsUUFBSSxLQUFLLFdBQVc7QUFDbEIsaUJBQVcsU0FBUztBQUFBLFFBQU8sQ0FBQyxZQUFTO0FBdmpCM0M7QUF3akJTLGdDQUFRLFNBQVIsWUFBZ0IsQ0FBQyxHQUFHLFNBQVMsS0FBSyxTQUFTO0FBQUE7QUFBQSxNQUM5QztBQUFBLElBQ0Y7QUFFQSxlQUFXLEtBQUssYUFBYSxRQUFRO0FBQ3JDLGVBQVcsU0FBUyxNQUFNLEdBQUcsR0FBRztBQUVoQyxlQUFXLFdBQVcsVUFBVTtBQUM5QixVQUFJLHlCQUFRLFNBQVMsRUFDbEIsUUFBUSxRQUFRLElBQUksRUFDcEI7QUFBQSxRQUNDO0FBQUEsVUFDRSxRQUFRLFFBQVEsTUFBTSxRQUFRLEtBQUssS0FBSztBQUFBLFVBQ3hDLFFBQVEsS0FBSyxNQUFNLFFBQVEsRUFBRSxLQUFLO0FBQUEsVUFDbEMsUUFBUSxLQUFLLE1BQU0sUUFBUSxFQUFFLEtBQUs7QUFBQSxRQUNwQyxFQUNHLE9BQU8sT0FBTyxFQUNkLEtBQUssVUFBSyxLQUFLLFFBQVE7QUFBQSxNQUM1QixFQUNDLFVBQVUsQ0FBQyxXQUFXO0FBQ3JCLGVBQ0csY0FBYyxTQUFTLEVBQ3ZCLFFBQVEsQ0FBQyxVQUFVO0FBQ2xCLDZCQUFtQixLQUFLLEtBQUssT0FBTyxPQUFPO0FBQUEsUUFDN0MsQ0FBQztBQUFBLE1BQ0wsQ0FBQyxFQUNBLFVBQVUsQ0FBQyxXQUFXO0FBQ3JCLGVBQ0csY0FBYyxLQUFLLEVBQ25CLE9BQU8sRUFDUCxRQUFRLE1BQU07QUFDYixlQUFLLFdBQVcsT0FBTztBQUFBLFFBQ3pCLENBQUM7QUFBQSxNQUNMLENBQUM7QUFBQSxJQUNMO0FBQUEsRUFDRjtBQUFBLEVBRUEseUJBQStCO0FBQzdCLFVBQU0sYUFBYSxLQUFLLFVBQVU7QUFBQSxNQUNoQztBQUFBLElBQ0Y7QUFFQSxRQUFJLEVBQUUsc0JBQXNCLGNBQWM7QUFDeEM7QUFBQSxJQUNGO0FBRUEsZUFBVyxNQUFNO0FBRWpCLFFBQUksS0FBSyxpQkFBaUIsV0FBVyxHQUFHO0FBQ3RDLGlCQUFXLFNBQVMsS0FBSztBQUFBLFFBQ3ZCLE1BQU07QUFBQSxNQUNSLENBQUM7QUFFRDtBQUFBLElBQ0Y7QUFFQSxlQUFXLFdBQVcsS0FBSyxrQkFBa0I7QUFDM0MsVUFBSSx5QkFBUSxVQUFVLEVBQ25CLFFBQVEsUUFBUSxJQUFJLEVBQ3BCLFFBQVEsUUFBUSxJQUFJLEVBQ3BCLFFBQVEsQ0FBQyxTQUFTO0FBQ2pCLGFBQUssU0FBUyxPQUFPLFFBQVEsR0FBRyxDQUFDO0FBRWpDLGFBQUssU0FBUyxDQUFDLFVBQVU7QUFDdkIsZ0JBQU0sTUFBTSxPQUFPLEtBQUs7QUFFeEIsa0JBQVEsTUFDTixPQUFPLFNBQVMsR0FBRyxLQUFLLE1BQU0sSUFDMUIsS0FBSyxNQUFNLEdBQUcsSUFDZDtBQUVOLGVBQUssdUJBQXVCO0FBQUEsUUFDOUIsQ0FBQztBQUFBLE1BQ0gsQ0FBQyxFQUNBLFVBQVUsQ0FBQyxXQUFXO0FBQ3JCLGVBQ0csY0FBYyxRQUFRLEVBQ3RCLFFBQVEsTUFBTTtBQUNiLGVBQUssbUJBQW1CLEtBQUssaUJBQWlCO0FBQUEsWUFDNUMsQ0FBQyxhQUFhLFNBQVMsU0FBUyxRQUFRO0FBQUEsVUFDMUM7QUFFQSxlQUFLLHVCQUF1QjtBQUM1QixlQUFLLHVCQUF1QjtBQUFBLFFBQzlCLENBQUM7QUFBQSxNQUNMLENBQUM7QUFBQSxJQUNMO0FBQUEsRUFDRjtBQUFBLEVBRUEseUJBQStCO0FBQzdCLFVBQU0sWUFBWSxLQUFLLFVBQVU7QUFBQSxNQUMvQjtBQUFBLElBQ0Y7QUFFQSxRQUFJLEVBQUUscUJBQXFCLGNBQWM7QUFDdkM7QUFBQSxJQUNGO0FBRUEsY0FBVSxNQUFNO0FBRWhCLFVBQU0sVUFBVSxLQUFLLG9CQUFvQjtBQUV6QyxjQUFVLFNBQVMsTUFBTTtBQUFBLE1BQ3ZCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxjQUFVLFNBQVMsS0FBSztBQUFBLE1BQ3RCLE1BQU0sbUJBQW1CLFFBQVEsYUFBYTtBQUFBLElBQ2hELENBQUM7QUFFRCxjQUFVLFNBQVMsS0FBSztBQUFBLE1BQ3RCLE1BQU0sb0JBQW9CLFFBQVEsY0FBYztBQUFBLElBQ2xELENBQUM7QUFFRCxjQUFVLFNBQVMsS0FBSztBQUFBLE1BQ3RCLE1BQU0sMEJBQTBCLFFBQVEsYUFBYSxRQUFRLENBQUMsQ0FBQztBQUFBLElBQ2pFLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxzQkFJRTtBQUNBLFVBQU0sZ0JBQWdCLEtBQUssaUJBQWlCO0FBQUEsTUFDMUMsQ0FBQyxLQUFLLFlBQVksTUFBTSxRQUFRO0FBQUEsTUFDaEM7QUFBQSxJQUNGO0FBRUEsVUFBTSxpQkFBaUIsS0FBSyxpQkFBaUI7QUFFN0MsUUFBSSxjQUFjO0FBQ2xCLFFBQUksa0JBQWtCO0FBRXRCLGVBQVcsV0FBVyxLQUFLLGtCQUFrQjtBQUMzQyxZQUFNLFFBQVEsT0FBTyxRQUFRLEtBQUs7QUFFbEMsVUFBSSxDQUFDLE9BQU8sTUFBTSxLQUFLLEdBQUc7QUFDeEIsdUJBQWUsUUFBUSxRQUFRO0FBQy9CLDJCQUFtQixRQUFRO0FBQUEsTUFDN0I7QUFBQSxJQUNGO0FBRUEsVUFBTSxlQUNKLGtCQUFrQixJQUNkLGNBQWMsa0JBQ2Q7QUFFTixXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFdBQVcsU0FBK0I7QUFDeEMsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQUEsTUFDckMsQ0FBQyxhQUFhLFNBQVMsU0FBUyxRQUFRO0FBQUEsSUFDMUM7QUFFQSxRQUFJLFVBQVU7QUFDWixlQUFTLE9BQU87QUFBQSxJQUNsQixPQUFPO0FBQ0wsV0FBSyxpQkFBaUIsS0FBSztBQUFBLFFBQ3pCLE1BQU0sUUFBUTtBQUFBLFFBQ2QsTUFBTSxRQUFRO0FBQUEsUUFDZCxLQUFLO0FBQUEsUUFDTCxPQUFPLFFBQVE7QUFBQSxRQUNmLElBQUksUUFBUTtBQUFBLFFBQ1osSUFBSSxRQUFRO0FBQUEsTUFDZCxDQUFDO0FBQUEsSUFDSDtBQUVBLFNBQUssdUJBQXVCO0FBQzVCLFNBQUssdUJBQXVCO0FBQUEsRUFDOUI7QUFBQSxFQUVBLE1BQU0sa0JBQWlDO0FBQ3JDLFVBQU0sT0FBTyxLQUFLLGNBQWMsS0FBSztBQUVyQyxRQUFJLENBQUMsTUFBTTtBQUNULFVBQUksd0JBQU8sNkJBQTZCO0FBQ3hDO0FBQUEsSUFDRjtBQUVBLFFBQUk7QUFDRixZQUFNLEtBQUssaUJBQWlCLG9CQUFvQixLQUFLLGlCQUFpQixDQUFDO0FBRXZFLFVBQUksd0JBQU8sb0JBQW9CO0FBQy9CLFdBQUssTUFBTTtBQUFBLElBQ2IsU0FBUyxPQUFPO0FBQ2QsY0FBUSxNQUFNLCtCQUErQixLQUFLO0FBQ2xELFVBQUksd0JBQU8sNENBQTRDO0FBQUEsSUFDekQ7QUFBQSxFQUNGO0FBQ0Y7OztBRTN2QkEsSUFBQUMsbUJBS087QUFJQSxJQUFNLG9CQUFOLE1BQXdCO0FBQUEsRUFHN0IsWUFBWSxRQUFvQztBQUM5QyxTQUFLLFNBQVM7QUFBQSxFQUNoQjtBQUFBLEVBRUEsV0FBaUI7QUFDZixTQUFLLE9BQU87QUFBQSxNQUNWLENBQ0UsSUFDQSxRQUNHO0FBQ0gsYUFBSyxRQUFRLElBQUksR0FBRztBQUFBLE1BQ3RCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFFBQ0UsSUFDQSxLQUNNO0FBOUJWO0FBK0JJLFVBQU0sY0FBYyxJQUFJLGVBQWUsRUFBRTtBQUV6QyxRQUFJLENBQUMsZUFBZSxZQUFZLGNBQWMsR0FBRztBQUMvQztBQUFBLElBQ0Y7QUFFQSxVQUFNLE9BQ0osS0FBSyxPQUFPLElBQUksTUFBTTtBQUFBLE1BQ3BCLElBQUk7QUFBQSxJQUNOO0FBRUYsUUFBSSxFQUFFLGdCQUFnQix5QkFBUTtBQUM1QjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFFBQ0osS0FBSyxPQUFPLElBQUksY0FBYyxhQUFhLElBQUk7QUFFakQsVUFBTSxjQUFjLCtCQUFPO0FBRTNCLFNBQUksMkNBQWEsb0JBQW1CLGFBQWE7QUFDL0M7QUFBQSxJQUNGO0FBRUEsUUFBSSxHQUFHLGNBQWMsd0JBQXdCLEdBQUc7QUFDOUM7QUFBQSxJQUNGO0FBRUEsVUFBTSxZQUFZLEdBQUcsVUFBVTtBQUFBLE1BQzdCLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxjQUFVLFNBQVMsTUFBTTtBQUFBLE1BQ3ZCLE9BQU0saUJBQVksU0FBWixZQUFvQixLQUFLO0FBQUEsSUFDakMsQ0FBQztBQUVELGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLFFBQ0osWUFBWSxhQUNSLGVBQWUsWUFBWSxVQUFVLEtBQ3JDO0FBQUEsUUFDSixZQUFZLFlBQ1IsR0FBRyxZQUFZLFNBQVMsU0FDeEI7QUFBQSxRQUNKLFlBQVksU0FDUixXQUFXLFlBQVksTUFBTSxLQUM3QjtBQUFBLE1BQ04sRUFDRyxPQUFPLE9BQU8sRUFDZCxLQUFLLFVBQUs7QUFBQSxJQUNmLENBQUM7QUFFRCxTQUFLLHFCQUFxQixXQUFXLFdBQVc7QUFDaEQsU0FBSywyQkFBMkIsV0FBVyxXQUFXO0FBQUEsRUFDeEQ7QUFBQSxFQUVBLHFCQUNFLFdBQ0EsYUFDTTtBQTNGVjtBQTRGSSxVQUFNLFdBQVcsTUFBTSxRQUFRLFlBQVksUUFBUSxJQUMvQyxZQUFZLFdBQ1osQ0FBQztBQUVMLFVBQU0sZ0JBQWdCLFNBQVM7QUFBQSxNQUM3QixDQUFDLEtBQWEsWUFBOEI7QUFqR2xELFlBQUFDO0FBa0dRLHFCQUFNLFFBQU9BLE1BQUEsUUFBUSxRQUFSLE9BQUFBLE1BQWUsQ0FBQztBQUFBO0FBQUEsTUFDL0I7QUFBQSxJQUNGO0FBRUEsVUFBTSxpQkFBaUIsU0FBUztBQUVoQyxRQUFJLGNBQWM7QUFDbEIsUUFBSSxrQkFBa0I7QUFFdEIsZUFBVyxXQUFXLFVBQVU7QUFDOUIsWUFBTSxRQUFRLE9BQU8sUUFBUSxLQUFLO0FBRWxDLFVBQUksQ0FBQyxPQUFPLE1BQU0sS0FBSyxHQUFHO0FBQ3hCLGNBQU0sTUFBTSxRQUFPLGFBQVEsUUFBUixZQUFlLENBQUM7QUFFbkMsdUJBQWUsUUFBUTtBQUN2QiwyQkFBbUI7QUFBQSxNQUNyQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLGVBQ0osa0JBQWtCLElBQ2QsY0FBYyxrQkFDZDtBQUVOLGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsS0FBSztBQUFBLE1BQ0wsTUFDRSxHQUFHLGFBQWEsb0JBQ1YsY0FBYyx5QkFDUCxhQUFhLFFBQVEsQ0FBQyxDQUFDO0FBQUEsSUFDeEMsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLDJCQUNFLFdBQ0EsYUFDTTtBQXZJVjtBQXdJSSxVQUFNLFdBQVcsTUFBTSxRQUFRLFlBQVksUUFBUSxJQUMvQyxZQUFZLFdBQ1osQ0FBQztBQUVMLFFBQUksU0FBUyxXQUFXLEdBQUc7QUFDekIsZ0JBQVUsU0FBUyxLQUFLO0FBQUEsUUFDdEIsS0FBSztBQUFBLFFBQ0wsTUFBTTtBQUFBLE1BQ1IsQ0FBQztBQUVEO0FBQUEsSUFDRjtBQUVBLFVBQU0sV0FBVyxVQUFVLFVBQVU7QUFBQSxNQUNuQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsZUFBVyxXQUFXLFVBQVU7QUFDOUIsWUFBTSxPQUFNLGFBQVEsUUFBUixZQUFlO0FBQzNCLFlBQU0sUUFBTyxhQUFRLFNBQVIsWUFBZ0I7QUFFN0IsWUFBTSxPQUFPO0FBQUEsUUFDWCxRQUFRLFFBQVEsTUFBTSxRQUFRLEtBQUssS0FBSztBQUFBLFFBQ3hDLFFBQVEsS0FBSyxNQUFNLFFBQVEsRUFBRSxLQUFLO0FBQUEsUUFDbEMsUUFBUSxLQUFLLE1BQU0sUUFBUSxFQUFFLEtBQUs7QUFBQSxNQUNwQyxFQUNHLE9BQU8sT0FBTyxFQUNkLEtBQUssVUFBSztBQUViLFlBQU0sU0FBUyxTQUFTLFNBQVMsVUFBVTtBQUFBLFFBQ3pDLEtBQUs7QUFBQSxRQUNMLE1BQU0sT0FDRixHQUFHLEdBQUcsS0FBSyxJQUFJLFdBQU0sSUFBSSxLQUN6QixHQUFHLEdBQUcsS0FBSyxJQUFJO0FBQUEsTUFDckIsQ0FBQztBQUVELGFBQU8saUJBQWlCLFNBQVMsQ0FBQyxVQUFVO0FBQzFDLGFBQUssb0JBQW9CLE9BQU8sT0FBTztBQUFBLE1BQ3pDLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUFBLEVBRUEsb0JBQ0UsT0FDQSxTQUNNO0FBckxWO0FBc0xJLFVBQU0sT0FBTyxRQUFRO0FBQ3JCLFVBQU0sUUFBTyxhQUFRLFNBQVIsWUFBZ0I7QUFFN0IsVUFBTSxPQUFPLElBQUksc0JBQUs7QUFFdEIsU0FBSyxRQUFRLENBQUMsU0FBUztBQUNyQixXQUNHLFNBQVMsUUFBUSxJQUFJLEVBQUUsRUFDdkIsUUFBUSxZQUFZO0FBQ25CLGNBQU0sS0FBSyxZQUFZLE1BQU0sU0FBUztBQUFBLE1BQ3hDLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFRCxTQUFLLFFBQVEsQ0FBQyxTQUFTO0FBQ3JCLFdBQ0csU0FBUyxpQkFBaUIsRUFDMUIsUUFBUSxZQUFZO0FBQ25CLGNBQU0sS0FBSyxZQUFZLE1BQU0sU0FBUztBQUFBLE1BQ3hDLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFRCxTQUFLLFFBQVEsQ0FBQyxTQUFTO0FBQ3JCLFdBQ0csU0FBUyxtQkFBbUIsRUFDNUIsUUFBUSxZQUFZO0FBQ25CLGNBQU0sS0FBSyxZQUFZLE1BQU0sT0FBTztBQUFBLE1BQ3RDLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFRCxTQUFLLGFBQWE7QUFFbEIsU0FBSyxRQUFRLENBQUMsU0FBUztBQUNyQixXQUFLO0FBQUEsUUFDSDtBQUFBLFVBQ0UsUUFBUSxRQUFRLE1BQU0sUUFBUSxLQUFLLEtBQUs7QUFBQSxVQUN4QyxRQUFRLEtBQUssTUFBTSxRQUFRLEVBQUUsS0FBSztBQUFBLFVBQ2xDLFFBQVEsS0FBSyxNQUFNLFFBQVEsRUFBRSxLQUFLO0FBQUEsUUFDcEMsRUFDRyxPQUFPLE9BQU8sRUFDZCxLQUFLLFVBQUssS0FBSztBQUFBLE1BQ3BCO0FBRUEsV0FBSyxZQUFZLElBQUk7QUFBQSxJQUN2QixDQUFDO0FBRUQsU0FBSyxpQkFBaUIsS0FBSztBQUFBLEVBQzdCO0FBQUEsRUFFQSxNQUFNLFlBQ0osTUFDQSxNQUNlO0FBQ2YsUUFBSSxPQUFPLFNBQVMsWUFBWSxLQUFLLFdBQVcsR0FBRztBQUNqRCxVQUFJLHdCQUFPLHlCQUF5QjtBQUNwQztBQUFBLElBQ0Y7QUFFQSxVQUFNLE9BQ0osS0FBSyxPQUFPLElBQUksTUFBTSxzQkFBc0IsSUFBSTtBQUVsRCxRQUFJLEVBQUUsZ0JBQWdCLHlCQUFRO0FBQzVCLFVBQUksd0JBQU8seUJBQXlCO0FBQ3BDO0FBQUEsSUFDRjtBQUVBLFFBQUksU0FBUyxTQUFTO0FBQ3BCLFlBQU0sS0FBSyxPQUFPLElBQUksVUFDbkIsUUFBUSxTQUFTLFVBQVUsRUFDM0IsU0FBUyxJQUFJO0FBRWhCO0FBQUEsSUFDRjtBQUVBLFFBQUksU0FBUyxXQUFXO0FBQ3RCLFlBQU0sS0FBSyxPQUFPLElBQUksVUFDbkIsUUFBUSxJQUFJLEVBQ1osU0FBUyxJQUFJO0FBRWhCO0FBQUEsSUFDRjtBQUVBLFVBQU0sS0FBSyxPQUFPLElBQUksVUFDbkIsUUFBUSxLQUFLLEVBQ2IsU0FBUyxJQUFJO0FBQUEsRUFDbEI7QUFDRjs7O0FQblFBLElBQXFCLDZCQUFyQixjQUF3RCx3QkFBTztBQUFBLEVBQS9EO0FBQUE7QUE4REUsU0FBTyxNQUFNO0FBQUEsTUFDWCxnQkFBZ0IsTUFDWixLQUFLLGFBQWEsZUFBZTtBQUFBLElBQ3JDO0FBQUE7QUFBQSxFQXpERixNQUFNLFNBQXdCO0FBRTVCLFlBQVEsSUFBSSwrQkFBK0I7QUFFM0MsU0FBSyxlQUNILElBQUksYUFBYSxLQUFLLEdBQUc7QUFFM0IsU0FBSyxtQkFDSCxJQUFJLGlCQUFpQixLQUFLLEdBQUc7QUFFL0IsU0FBSyxvQkFBb0IsSUFBSSxrQkFBa0IsSUFBSTtBQUNuRCxTQUFLLGtCQUFrQixTQUFTO0FBRWhDLFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNO0FBQ2QsWUFBSTtBQUFBLFVBQ0osS0FBSztBQUFBLFVBQ0wsS0FBSztBQUFBLFVBQ0wsS0FBSztBQUFBLFFBQ1AsRUFBRSxLQUFLO0FBQUEsTUFDUjtBQUFBLElBQ0QsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BRU4sVUFBVSxZQUFZO0FBRXBCLGNBQU0sV0FDSixLQUFLLGFBQWEsZUFBZTtBQUVuQyxjQUFNLGVBQWUsU0FBUyxDQUFDO0FBRS9CLGNBQU0sS0FBSyxpQkFDUixvQkFBb0I7QUFBQSxVQUNuQixNQUFNO0FBQUEsVUFFTixVQUFVLGVBQ04sQ0FBQztBQUFBLFlBQ0MsTUFBTSxhQUFhO0FBQUEsWUFDbkIsTUFBTSxhQUFhO0FBQUEsWUFDbkIsS0FBSztBQUFBLFVBQ1AsQ0FBQyxJQUNELENBQUM7QUFBQSxRQUNQLENBQUM7QUFFSCxZQUFJLHdCQUFPLG1CQUFtQjtBQUFBLE1BQ2hDO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBT0EsV0FBaUI7QUFDZixZQUFRLElBQUksaUNBQWlDO0FBQUEsRUFDL0M7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIl0KfQo=
