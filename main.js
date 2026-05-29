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
var import_obsidian4 = require("obsidian");

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
function getEncounterSummary(encounter) {
  const totalMonsters = encounter.monsters.reduce(
    (sum, monster) => sum + monster.qty,
    0
  );
  const uniqueMonsters = encounter.monsters.length;
  let totalLevels = 0;
  let countedMonsters = 0;
  for (const monster of encounter.monsters) {
    const level = Number(monster.level);
    if (!Number.isNaN(level)) {
      totalLevels += level * monster.qty;
      countedMonsters += monster.qty;
    }
  }
  return {
    totalMonsters,
    uniqueMonsters,
    averageLevel: countedMonsters > 0 ? totalLevels / countedMonsters : 0
  };
}
function section(title, content) {
  return `## ${title}

${(content == null ? void 0 : content.trim()) || ""}
`;
}
function generateEncounterMarkdown(encounter) {
  var _a, _b, _c, _d, _e, _f;
  const monsterLines = encounter.monsters.map(
    (monster) => `- ${monster.qty}x [[${monster.path}|${monster.name}]]`
  ).join("\n");
  const summary = getEncounterSummary(encounter);
  return `---
shadowdarkType: encounter
name: ${encounter.name}
status: planned

partyLevel: ${(_a = encounter.partyLevel) != null ? _a : 1}
partySize: ${(_b = encounter.partySize) != null ? _b : 4}

terrain: ${(_c = encounter.terrain) != null ? _c : ""}
light: ${(_d = encounter.light) != null ? _d : ""}

tags:
  - shadowdark/encounter
---

# ${encounter.name}

## Encounter Summary

- Party Level: ${(_e = encounter.partyLevel) != null ? _e : 1}
- Party Size: ${(_f = encounter.partySize) != null ? _f : 4}
- Total Monsters: ${summary.totalMonsters}
- Unique Monsters: ${summary.uniqueMonsters}
- Average Monster Level: ${summary.averageLevel.toFixed(1)}


## Monsters

${monsterLines || "- None"}

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

// src/main.ts
var ShadowdarkEncountersPlugin = class extends import_obsidian4.Plugin {
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
        new import_obsidian4.Notice("Encounter created");
      }
    });
  }
  onunload() {
    console.log("Unloading Shadowdark Encounters");
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL2NvbnN0YW50cy9wbHVnaW4udHMiLCAic3JjL3NlcnZpY2VzL01vbnN0ZXJJbmRleC50cyIsICJzcmMvc2VydmljZXMvRW5jb3VudGVyU2VydmljZS50cyIsICJzcmMvdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlLnRzIiwgInNyYy9tb2RhbHMvQ3JlYXRlRW5jb3VudGVyTW9kYWwudHMiLCAic3JjL2NvbXBvbmVudHMvTW9uc3RlclByZXZpZXdQb3BvdmVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBNb25zdGVySW5kZXggfSBmcm9tIFwiLi9zZXJ2aWNlcy9Nb25zdGVySW5kZXhcIjtcbmltcG9ydCB7IEVuY291bnRlclNlcnZpY2UgfSBmcm9tIFwiLi9zZXJ2aWNlcy9FbmNvdW50ZXJTZXJ2aWNlXCI7XG5pbXBvcnQgeyBDcmVhdGVFbmNvdW50ZXJNb2RhbCB9IGZyb20gXCIuL21vZGFscy9DcmVhdGVFbmNvdW50ZXJNb2RhbFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTaGFkb3dkYXJrRW5jb3VudGVyc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG5cbiAgbW9uc3RlckluZGV4ITogTW9uc3RlckluZGV4O1xuXG4gIGVuY291bnRlclNlcnZpY2UhOiBFbmNvdW50ZXJTZXJ2aWNlO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgIGNvbnNvbGUubG9nKFwiTG9hZGluZyBTaGFkb3dkYXJrIEVuY291bnRlcnNcIik7XG5cbiAgICB0aGlzLm1vbnN0ZXJJbmRleCA9XG4gICAgICBuZXcgTW9uc3RlckluZGV4KHRoaXMuYXBwKTtcblxuICAgIHRoaXMuZW5jb3VudGVyU2VydmljZSA9XG4gICAgICBuZXcgRW5jb3VudGVyU2VydmljZSh0aGlzLmFwcCk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiY3JlYXRlLXNoYWRvd2RhcmstZW5jb3VudGVyXCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZSBTaGFkb3dkYXJrIEVuY291bnRlclwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgbmV3IENyZWF0ZUVuY291bnRlck1vZGFsKFxuICAgICAgICB0aGlzLmFwcCxcbiAgICAgICAgdGhpcy5tb25zdGVySW5kZXgsXG4gICAgICAgIHRoaXMuZW5jb3VudGVyU2VydmljZVxuICAgICAgKS5vcGVuKCk7XG4gICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJjcmVhdGUtdGVzdC1lbmNvdW50ZXJcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlIFRlc3QgRW5jb3VudGVyXCIsXG5cbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG5cbiAgICAgICAgY29uc3QgbW9uc3RlcnMgPVxuICAgICAgICAgIHRoaXMubW9uc3RlckluZGV4LmdldEFsbE1vbnN0ZXJzKCk7XG5cbiAgICAgICAgY29uc3QgZmlyc3RNb25zdGVyID0gbW9uc3RlcnNbMF07XG5cbiAgICAgICAgYXdhaXQgdGhpcy5lbmNvdW50ZXJTZXJ2aWNlXG4gICAgICAgICAgLmNyZWF0ZUVuY291bnRlck5vdGUoe1xuICAgICAgICAgICAgbmFtZTogXCJUZXN0IEVuY291bnRlclwiLFxuXG4gICAgICAgICAgICBtb25zdGVyczogZmlyc3RNb25zdGVyXG4gICAgICAgICAgICAgID8gW3tcbiAgICAgICAgICAgICAgICAgIG5hbWU6IGZpcnN0TW9uc3Rlci5uYW1lLFxuICAgICAgICAgICAgICAgICAgcGF0aDogZmlyc3RNb25zdGVyLnBhdGgsXG4gICAgICAgICAgICAgICAgICBxdHk6IDNcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICA6IFtdXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3IE5vdGljZShcIkVuY291bnRlciBjcmVhdGVkXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFwaSA9IHtcbiAgICBnZXRBbGxNb25zdGVyczogKCkgPT5cbiAgICAgICAgdGhpcy5tb25zdGVySW5kZXguZ2V0QWxsTW9uc3RlcnMoKVxuICAgIH07XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gICAgY29uc29sZS5sb2coXCJVbmxvYWRpbmcgU2hhZG93ZGFyayBFbmNvdW50ZXJzXCIpO1xuICB9XG59IiwgImV4cG9ydCBjb25zdCBQTFVHSU5fSUQgPSBcInNoYWRvd2RhcmstZW5jb3VudGVyc1wiO1xuXG5leHBvcnQgY29uc3QgRU5DT1VOVEVSX1RZUEUgPSBcImVuY291bnRlclwiO1xuXG5leHBvcnQgY29uc3QgTU9OU1RFUl9UWVBFID0gXCJtb25zdGVyXCI7IiwgImltcG9ydCB7IEFwcCwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IE1PTlNURVJfVFlQRSB9IGZyb20gXCIuLi9jb25zdGFudHMvcGx1Z2luXCI7XG5pbXBvcnQgeyBNb25zdGVyU3VtbWFyeSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmV4cG9ydCBjbGFzcyBNb25zdGVySW5kZXgge1xuICBhcHA6IEFwcDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICB9XG5cbiAgc2VhcmNoTW9uc3RlcnMocXVlcnk6IHN0cmluZyk6IE1vbnN0ZXJTdW1tYXJ5W10ge1xuICAgIGNvbnN0IGxvd2VyID0gcXVlcnkudG9Mb3dlckNhc2UoKS50cmltKCk7XG5cbiAgICBpZiAoIWxvd2VyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEFsbE1vbnN0ZXJzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0QWxsTW9uc3RlcnMoKS5maWx0ZXIoKG1vbnN0ZXIpID0+XG4gICAgICAgIG1vbnN0ZXIubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGxvd2VyKVxuICAgICk7XG59XG5cbiAgZ2V0QWxsTW9uc3RlcnMoKTogTW9uc3RlclN1bW1hcnlbXSB7XG4gICAgY29uc3QgZmlsZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG5cbiAgICBjb25zdCBtb25zdGVyczogTW9uc3RlclN1bW1hcnlbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBjb25zdCBtb25zdGVyID0gdGhpcy5nZXRNb25zdGVyRnJvbUZpbGUoZmlsZSk7XG5cbiAgICAgIGlmIChtb25zdGVyKSB7XG4gICAgICAgIG1vbnN0ZXJzLnB1c2gobW9uc3Rlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vbnN0ZXJzLnNvcnQoKGEsIGIpID0+XG4gICAgICBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpXG4gICAgKTtcbiAgfVxuXG4gIGdldE1vbnN0ZXJGcm9tRmlsZShmaWxlOiBURmlsZSk6IE1vbnN0ZXJTdW1tYXJ5IHwgbnVsbCB7XG4gICAgY29uc3QgY2FjaGUgPVxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG5cbiAgICBjb25zdCBmcm9udG1hdHRlciA9IGNhY2hlPy5mcm9udG1hdHRlcjtcblxuICAgIGlmICghZnJvbnRtYXR0ZXIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChmcm9udG1hdHRlci5zaGFkb3dkYXJrVHlwZSAhPT0gTU9OU1RFUl9UWVBFKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogZnJvbnRtYXR0ZXIubmFtZSB8fCBmaWxlLmJhc2VuYW1lLFxuICAgICAgcGF0aDogZmlsZS5wYXRoLFxuXG4gICAgICBsZXZlbDogZnJvbnRtYXR0ZXIubGV2ZWwsXG4gICAgICBhYzogZnJvbnRtYXR0ZXIuYWMsXG4gICAgICBocDogZnJvbnRtYXR0ZXIuaHAsXG5cbiAgICAgIGF0azogQXJyYXkuaXNBcnJheShmcm9udG1hdHRlci5hdGspXG4gICAgICAgICAgPyBmcm9udG1hdHRlci5hdGtbMF1cbiAgICAgICAgICA6IGZyb250bWF0dGVyLmF0ayxcblxuICAgICAgdHJhaXRzOiBBcnJheS5pc0FycmF5KGZyb250bWF0dGVyLnRyYWl0cylcbiAgICAgICAgICA/IGZyb250bWF0dGVyLnRyYWl0cy5zbGljZSgwLCAyKVxuICAgICAgICAgIDogW10sXG5cbiAgICAgIHRhZ3M6IGZyb250bWF0dGVyLnRhZ3MgfHwgW11cbiAgICB9O1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgbm9ybWFsaXplUGF0aCwgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBFbmNvdW50ZXJEYXRhIH0gZnJvbSBcIi4uL3R5cGVzL2VuY291bnRlcnNcIjtcbmltcG9ydCB7IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24gfSBmcm9tIFwiLi4vdGVtcGxhdGVzL2VuY291bnRlclRlbXBsYXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBFbmNvdW50ZXJTZXJ2aWNlIHtcbiAgYXBwOiBBcHA7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUVuY291bnRlck5vdGUoZW5jb3VudGVyOiBFbmNvdW50ZXJEYXRhKSB7XG4gICAgY29uc3QgY29udGVudCA9IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24oZW5jb3VudGVyKTtcblxuICAgIGNvbnN0IHNhZmVOYW1lID0gZW5jb3VudGVyLm5hbWVcbiAgICAgIC5yZXBsYWNlKC9bXFxcXC86Kj9cIjw+fF0vZywgXCJcIilcbiAgICAgIC50cmltKCk7XG5cbiAgICBjb25zdCBmb2xkZXJQYXRoID0gXCJFbmNvdW50ZXJzXCI7XG4gICAgY29uc3QgZmlsZVBhdGggPSBub3JtYWxpemVQYXRoKGAke2ZvbGRlclBhdGh9LyR7c2FmZU5hbWV9Lm1kYCk7XG5cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihmb2xkZXJQYXRoKTtcblxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUoZmlsZVBhdGgsIGNvbnRlbnQpO1xuXG4gICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUoZmlsZSk7XG5cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlcihwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcblxuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIocGF0aCk7XG4gIH1cbn0iLCAiaW1wb3J0IHsgRW5jb3VudGVyRGF0YSB9IGZyb20gXCIuLi90eXBlcy9lbmNvdW50ZXJzXCI7XG5cbmZ1bmN0aW9uIGdldEVuY291bnRlclN1bW1hcnkoZW5jb3VudGVyOiBFbmNvdW50ZXJEYXRhKToge1xuICB0b3RhbE1vbnN0ZXJzOiBudW1iZXI7XG4gIHVuaXF1ZU1vbnN0ZXJzOiBudW1iZXI7XG4gIGF2ZXJhZ2VMZXZlbDogbnVtYmVyO1xufSB7XG4gIGNvbnN0IHRvdGFsTW9uc3RlcnMgPSBlbmNvdW50ZXIubW9uc3RlcnMucmVkdWNlKFxuICAgIChzdW0sIG1vbnN0ZXIpID0+IHN1bSArIG1vbnN0ZXIucXR5LFxuICAgIDBcbiAgKTtcblxuICBjb25zdCB1bmlxdWVNb25zdGVycyA9IGVuY291bnRlci5tb25zdGVycy5sZW5ndGg7XG5cbiAgbGV0IHRvdGFsTGV2ZWxzID0gMDtcbiAgbGV0IGNvdW50ZWRNb25zdGVycyA9IDA7XG5cbiAgZm9yIChjb25zdCBtb25zdGVyIG9mIGVuY291bnRlci5tb25zdGVycykge1xuICAgIGNvbnN0IGxldmVsID0gTnVtYmVyKG1vbnN0ZXIubGV2ZWwpO1xuXG4gICAgaWYgKCFOdW1iZXIuaXNOYU4obGV2ZWwpKSB7XG4gICAgICB0b3RhbExldmVscyArPSBsZXZlbCAqIG1vbnN0ZXIucXR5O1xuICAgICAgY291bnRlZE1vbnN0ZXJzICs9IG1vbnN0ZXIucXR5O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdG90YWxNb25zdGVycyxcbiAgICB1bmlxdWVNb25zdGVycyxcbiAgICBhdmVyYWdlTGV2ZWw6XG4gICAgICBjb3VudGVkTW9uc3RlcnMgPiAwID8gdG90YWxMZXZlbHMgLyBjb3VudGVkTW9uc3RlcnMgOiAwXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNlY3Rpb24odGl0bGU6IHN0cmluZywgY29udGVudD86IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgIyMgJHt0aXRsZX1cblxuJHtjb250ZW50Py50cmltKCkgfHwgXCJcIn1cbmA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUVuY291bnRlck1hcmtkb3duKFxuICBlbmNvdW50ZXI6IEVuY291bnRlckRhdGFcbik6IHN0cmluZyB7XG4gIGNvbnN0IG1vbnN0ZXJMaW5lcyA9IGVuY291bnRlci5tb25zdGVyc1xuICAgIC5tYXAoKG1vbnN0ZXIpID0+XG4gICAgICBgLSAke21vbnN0ZXIucXR5fXggW1ske21vbnN0ZXIucGF0aH18JHttb25zdGVyLm5hbWV9XV1gXG4gICAgKVxuICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gIGNvbnN0IHN1bW1hcnkgPSBnZXRFbmNvdW50ZXJTdW1tYXJ5KGVuY291bnRlcik7XG5cbiAgcmV0dXJuIGAtLS1cbnNoYWRvd2RhcmtUeXBlOiBlbmNvdW50ZXJcbm5hbWU6ICR7ZW5jb3VudGVyLm5hbWV9XG5zdGF0dXM6IHBsYW5uZWRcblxucGFydHlMZXZlbDogJHtlbmNvdW50ZXIucGFydHlMZXZlbCA/PyAxfVxucGFydHlTaXplOiAke2VuY291bnRlci5wYXJ0eVNpemUgPz8gNH1cblxudGVycmFpbjogJHtlbmNvdW50ZXIudGVycmFpbiA/PyBcIlwifVxubGlnaHQ6ICR7ZW5jb3VudGVyLmxpZ2h0ID8/IFwiXCJ9XG5cbnRhZ3M6XG4gIC0gc2hhZG93ZGFyay9lbmNvdW50ZXJcbi0tLVxuXG4jICR7ZW5jb3VudGVyLm5hbWV9XG5cbiMjIEVuY291bnRlciBTdW1tYXJ5XG5cbi0gUGFydHkgTGV2ZWw6ICR7ZW5jb3VudGVyLnBhcnR5TGV2ZWwgPz8gMX1cbi0gUGFydHkgU2l6ZTogJHtlbmNvdW50ZXIucGFydHlTaXplID8/IDR9XG4tIFRvdGFsIE1vbnN0ZXJzOiAke3N1bW1hcnkudG90YWxNb25zdGVyc31cbi0gVW5pcXVlIE1vbnN0ZXJzOiAke3N1bW1hcnkudW5pcXVlTW9uc3RlcnN9XG4tIEF2ZXJhZ2UgTW9uc3RlciBMZXZlbDogJHtzdW1tYXJ5LmF2ZXJhZ2VMZXZlbC50b0ZpeGVkKDEpfVxuXG5cbiMjIE1vbnN0ZXJzXG5cbiR7bW9uc3RlckxpbmVzIHx8IFwiLSBOb25lXCJ9XG5cbiR7c2VjdGlvbihcIlNldHVwXCIsIGVuY291bnRlci5zZXR1cCl9XG4ke3NlY3Rpb24oXCJSZWFkLUFsb3VkXCIsIGVuY291bnRlci5yZWFkQWxvdWQpfVxuJHtzZWN0aW9uKFwiVGFjdGljc1wiLCBlbmNvdW50ZXIudGFjdGljcyl9XG4ke3NlY3Rpb24oXCJUcmVhc3VyZVwiLCBlbmNvdW50ZXIudHJlYXN1cmUpfVxuJHtzZWN0aW9uKFwiTm90ZXNcIiwgZW5jb3VudGVyLm5vdGVzKX1cbmA7XG59IiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBzaG93TW9uc3RlclByZXZpZXcgfSBmcm9tIFwiLi4vY29tcG9uZW50cy9Nb25zdGVyUHJldmlld1BvcG92ZXJcIjtcbmltcG9ydCB7IEVuY291bnRlclNlcnZpY2UgfSBmcm9tIFwiLi4vc2VydmljZXMvRW5jb3VudGVyU2VydmljZVwiO1xuaW1wb3J0IHsgTW9uc3RlckluZGV4IH0gZnJvbSBcIi4uL3NlcnZpY2VzL01vbnN0ZXJJbmRleFwiO1xuaW1wb3J0IHsgZ2VuZXJhdGVFbmNvdW50ZXJNYXJrZG93biB9IGZyb20gXCIuLi90ZW1wbGF0ZXMvZW5jb3VudGVyVGVtcGxhdGVcIjtcbmltcG9ydCB7IEVuY291bnRlckRhdGEsIE1vbnN0ZXJSZWZlcmVuY2UsIE1vbnN0ZXJTdW1tYXJ5IH0gZnJvbSBcIi4uL3R5cGVzL2VuY291bnRlcnNcIjtcblxudHlwZSBFbmNvdW50ZXJXaXphcmRTdGVwID0gXCJtb25zdGVyc1wiIHwgXCJkZXRhaWxzXCIgfCBcInByZXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIENyZWF0ZUVuY291bnRlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBtb25zdGVySW5kZXg6IE1vbnN0ZXJJbmRleDtcbiAgZW5jb3VudGVyU2VydmljZTogRW5jb3VudGVyU2VydmljZTtcblxuICBjdXJyZW50U3RlcDogRW5jb3VudGVyV2l6YXJkU3RlcCA9IFwibW9uc3RlcnNcIjtcblxuICBlbmNvdW50ZXJOYW1lID0gXCJcIjtcblxuICBzZWxlY3RlZE1vbnN0ZXJzOiBNb25zdGVyUmVmZXJlbmNlW10gPSBbXTtcblxuICBtb25zdGVyU2VhcmNoID0gXCJcIjtcbiAgbGV2ZWxGaWx0ZXIgPSBcIlwiO1xuICB0YWdGaWx0ZXIgPSBcIlwiO1xuICBzb3J0TW9kZSA9IFwibmFtZS1hc2NcIjtcblxuICBwYXJ0eUxldmVsID0gMTtcbiAgcGFydHlTaXplID0gNDtcblxuICBzZXR1cCA9IFwiXCI7XG4gIHJlYWRBbG91ZCA9IFwiXCI7XG4gIHRhY3RpY3MgPSBcIlwiO1xuICB0cmVhc3VyZSA9IFwiXCI7XG4gIG5vdGVzID0gXCJcIjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBtb25zdGVySW5kZXg6IE1vbnN0ZXJJbmRleCxcbiAgICBlbmNvdW50ZXJTZXJ2aWNlOiBFbmNvdW50ZXJTZXJ2aWNlXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG5cbiAgICB0aGlzLm1vbnN0ZXJJbmRleCA9IG1vbnN0ZXJJbmRleDtcbiAgICB0aGlzLmVuY291bnRlclNlcnZpY2UgPSBlbmNvdW50ZXJTZXJ2aWNlO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMubW9kYWxFbC5hZGRDbGFzcyhcInNkLWVuY291bnRlci1tb2RhbFwiKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcmVuZGVyKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuXG4gICAgY29udGVudEVsLmVtcHR5KCk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7XG4gICAgICB0ZXh0OiBcIkNyZWF0ZSBTaGFkb3dkYXJrIEVuY291bnRlclwiXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlclN0ZXBJbmRpY2F0b3IoY29udGVudEVsKTtcblxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGVwID09PSBcIm1vbnN0ZXJzXCIpIHtcbiAgICAgIHRoaXMucmVuZGVyTW9uc3RlclN0ZXAoY29udGVudEVsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jdXJyZW50U3RlcCA9PT0gXCJkZXRhaWxzXCIpIHtcbiAgICAgIHRoaXMucmVuZGVyRGV0YWlsc1N0ZXAoY29udGVudEVsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnJlbmRlclByZXZpZXdTdGVwKGNvbnRlbnRFbCk7XG4gIH1cblxuICByZW5kZXJTdGVwSW5kaWNhdG9yKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXN0ZXAtaW5kaWNhdG9yXCIsXG4gICAgICB0ZXh0OlxuICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID09PSBcIm1vbnN0ZXJzXCJcbiAgICAgICAgICA/IFwiU3RlcCAxIG9mIDM6IEFkZCBNb25zdGVyc1wiXG4gICAgICAgICAgOiB0aGlzLmN1cnJlbnRTdGVwID09PSBcImRldGFpbHNcIlxuICAgICAgICAgICAgPyBcIlN0ZXAgMiBvZiAzOiBBZGQgRGV0YWlsc1wiXG4gICAgICAgICAgICA6IFwiU3RlcCAzIG9mIDM6IFByZXZpZXdcIlxuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyTW9uc3RlclN0ZXAoY29udGVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKFwiRW5jb3VudGVyIG5hbWVcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJHb2JsaW4gQW1idXNoXCIpO1xuICAgICAgICB0ZXh0LnNldFZhbHVlKHRoaXMuZW5jb3VudGVyTmFtZSk7XG5cbiAgICAgICAgdGV4dC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLmVuY291bnRlck5hbWUgPSB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIGNvbnN0IGJ1aWxkZXJFbCA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1idWlsZGVyXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGJyb3dzZXJFbCA9IGJ1aWxkZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1icm93c2VyXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGRyYWZ0RWwgPSBidWlsZGVyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZHJhZnRcIlxuICAgIH0pO1xuXG4gICAgYnJvd3NlckVsLmNyZWF0ZUVsKFwiaDNcIiwge1xuICAgICAgdGV4dDogXCJNb25zdGVyIEJyb3dzZXJcIlxuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJGaWx0ZXJSb3coYnJvd3NlckVsKTtcblxuICAgIGNvbnN0IHJlc3VsdHNFbCA9IGJyb3dzZXJFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1tb25zdGVyLXJlc3VsdHNcIlxuICAgIH0pO1xuXG4gICAgcmVzdWx0c0VsLmRhdGFzZXQucm9sZSA9IFwibW9uc3Rlci1yZXN1bHRzXCI7XG5cbiAgICBkcmFmdEVsLmNyZWF0ZUVsKFwiaDNcIiwge1xuICAgICAgdGV4dDogXCJFbmNvdW50ZXIgRHJhZnRcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VsZWN0ZWRFbCA9IGRyYWZ0RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItc2VsZWN0ZWQtbW9uc3RlcnNcIlxuICAgIH0pO1xuXG4gICAgc2VsZWN0ZWRFbC5kYXRhc2V0LnJvbGUgPSBcInNlbGVjdGVkLW1vbnN0ZXJzXCI7XG5cbiAgICBjb25zdCBzdW1tYXJ5RWwgPSBkcmFmdEVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXN1bW1hcnlcIlxuICAgIH0pO1xuXG4gICAgc3VtbWFyeUVsLmRhdGFzZXQucm9sZSA9IFwiZW5jb3VudGVyLXN1bW1hcnlcIjtcblxuICAgIGNvbnN0IGJ1dHRvbkVsID0gZHJhZnRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1jcmVhdGUtYnV0dG9uXCJcbiAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGJ1dHRvbkVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgIGJ1dHRvblxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiTmV4dFwiKVxuICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5lbmNvdW50ZXJOYW1lLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiRW5jb3VudGVyIG5hbWUgaXMgcmVxdWlyZWQuXCIpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPSBcImRldGFpbHNcIjtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyTW9uc3RlclJlc3VsdHMoKTtcbiAgICB0aGlzLnJlbmRlclNlbGVjdGVkTW9uc3RlcnMoKTtcbiAgICB0aGlzLnJlbmRlckVuY291bnRlclN1bW1hcnkoKTtcbiAgfVxuXG4gIHJlbmRlckZpbHRlclJvdyhicm93c2VyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgZmlsdGVyUm93ID0gYnJvd3NlckVsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1yb3dcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VhcmNoRmllbGQgPSBmaWx0ZXJSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZmlsdGVyLWZpZWxkXCJcbiAgICB9KTtcblxuICAgIHNlYXJjaEZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJTZWFyY2hcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VhcmNoSW5wdXQgPSBzZWFyY2hGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiU2VhcmNoIG1vbnN0ZXJzLi4uXCJcbiAgICB9KTtcblxuICAgIHNlYXJjaElucHV0LnZhbHVlID0gdGhpcy5tb25zdGVyU2VhcmNoO1xuXG4gICAgc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMubW9uc3RlclNlYXJjaCA9IHNlYXJjaElucHV0LnZhbHVlO1xuICAgICAgdGhpcy5yZW5kZXJNb25zdGVyUmVzdWx0cygpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgbGV2ZWxGaWVsZCA9IGZpbHRlclJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1maWx0ZXItZmllbGRcIlxuICAgIH0pO1xuXG4gICAgbGV2ZWxGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiTGV2ZWxcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgbGV2ZWxTZWxlY3QgPSBsZXZlbEZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuXG4gICAgbGV2ZWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJBbnlcIixcbiAgICAgIHZhbHVlOiBcIlwiXG4gICAgfSk7XG5cbiAgICBmb3IgKGxldCBsZXZlbCA9IDA7IGxldmVsIDw9IDEwOyBsZXZlbCsrKSB7XG4gICAgICBsZXZlbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICAgIHRleHQ6IFN0cmluZyhsZXZlbCksXG4gICAgICAgIHZhbHVlOiBTdHJpbmcobGV2ZWwpXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsZXZlbFNlbGVjdC52YWx1ZSA9IHRoaXMubGV2ZWxGaWx0ZXI7XG5cbiAgICBsZXZlbFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHRoaXMubGV2ZWxGaWx0ZXIgPSBsZXZlbFNlbGVjdC52YWx1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9uc3RlclJlc3VsdHMoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRhZ0ZpZWxkID0gZmlsdGVyUm93LmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLWZpbHRlci1maWVsZFwiXG4gICAgfSk7XG5cbiAgICB0YWdGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiVGFnXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHRhZ1NlbGVjdCA9IHRhZ0ZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuXG4gICAgdGFnU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiQW55XCIsXG4gICAgICB2YWx1ZTogXCJcIlxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCB0YWcgb2YgdGhpcy5nZXRBdmFpbGFibGVUYWdzKCkpIHtcbiAgICAgIHRhZ1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICAgIHRleHQ6IHRhZyxcbiAgICAgICAgdmFsdWU6IHRhZ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGFnU2VsZWN0LnZhbHVlID0gdGhpcy50YWdGaWx0ZXI7XG5cbiAgICB0YWdTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnRhZ0ZpbHRlciA9IHRhZ1NlbGVjdC52YWx1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9uc3RlclJlc3VsdHMoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHNvcnRGaWVsZCA9IGZpbHRlclJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1maWx0ZXItZmllbGRcIlxuICAgIH0pO1xuXG4gICAgc29ydEZpZWxkLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogXCJTb3J0XCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNvcnRTZWxlY3QgPSBzb3J0RmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG5cbiAgICBzb3J0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHRleHQ6IFwiTmFtZSBBLVpcIixcbiAgICAgIHZhbHVlOiBcIm5hbWUtYXNjXCJcbiAgICB9KTtcblxuICAgIHNvcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJOYW1lIFotQVwiLFxuICAgICAgdmFsdWU6IFwibmFtZS1kZXNjXCJcbiAgICB9KTtcblxuICAgIHNvcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJMZXZlbCBMb3ctSGlnaFwiLFxuICAgICAgdmFsdWU6IFwibGV2ZWwtYXNjXCJcbiAgICB9KTtcblxuICAgIHNvcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdGV4dDogXCJMZXZlbCBIaWdoLUxvd1wiLFxuICAgICAgdmFsdWU6IFwibGV2ZWwtZGVzY1wiXG4gICAgfSk7XG5cbiAgICBzb3J0U2VsZWN0LnZhbHVlID0gdGhpcy5zb3J0TW9kZTtcblxuICAgIHNvcnRTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnNvcnRNb2RlID0gc29ydFNlbGVjdC52YWx1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9uc3RlclJlc3VsdHMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlckRldGFpbHNTdGVwKGNvbnRlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBkZXRhaWxzRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZGV0YWlscy1zdGVwXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHBhcnR5Um93ID0gZGV0YWlsc0VsLmNyZWF0ZURpdih7XG4gICAgICBjbHM6IFwic2QtZW5jb3VudGVyLXBhcnR5LXJvd1wiXG4gICAgfSk7XG5cbiAgICBjb25zdCBsZXZlbEZpZWxkID0gcGFydHlSb3cuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcGFydHktZmllbGRcIlxuICAgIH0pO1xuXG4gICAgbGV2ZWxGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiUGFydHkgTGV2ZWxcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgbGV2ZWxJbnB1dCA9IGxldmVsRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcIm51bWJlclwiXG4gICAgfSk7XG5cbiAgICBsZXZlbElucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMucGFydHlMZXZlbCk7XG5cbiAgICBsZXZlbElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyKGxldmVsSW5wdXQudmFsdWUpO1xuXG4gICAgICB0aGlzLnBhcnR5TGV2ZWwgPVxuICAgICAgICBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPiAwXG4gICAgICAgICAgPyBNYXRoLmZsb29yKHBhcnNlZClcbiAgICAgICAgICA6IDE7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzaXplRmllbGQgPSBwYXJ0eVJvdy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1wYXJ0eS1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBzaXplRmllbGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICB0ZXh0OiBcIlBhcnR5IFNpemVcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2l6ZUlucHV0ID0gc2l6ZUZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJudW1iZXJcIlxuICAgIH0pO1xuXG4gICAgc2l6ZUlucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMucGFydHlTaXplKTtcblxuICAgIHNpemVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlcihzaXplSW5wdXQudmFsdWUpO1xuXG4gICAgICB0aGlzLnBhcnR5U2l6ZSA9XG4gICAgICAgIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpICYmIHBhcnNlZCA+IDBcbiAgICAgICAgICA/IE1hdGguZmxvb3IocGFyc2VkKVxuICAgICAgICAgIDogNDtcbiAgICB9KTtcblxuICAgIGRldGFpbHNFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJBZGQgb3B0aW9uYWwgR00tZmFjaW5nIGRldGFpbHMgZm9yIHRoaXMgZW5jb3VudGVyLlwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBkZXRhaWxzR3JpZCA9IGRldGFpbHNFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1kZXRhaWxzLWdyaWRcIlxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRUZXh0QXJlYUZpZWxkKGRldGFpbHNHcmlkLCBcIlNldHVwXCIsIHRoaXMuc2V0dXAsICh2YWx1ZSkgPT4ge1xuICAgICAgdGhpcy5zZXR1cCA9IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRUZXh0QXJlYUZpZWxkKGRldGFpbHNHcmlkLCBcIlJlYWQtQWxvdWRcIiwgdGhpcy5yZWFkQWxvdWQsICh2YWx1ZSkgPT4ge1xuICAgICAgdGhpcy5yZWFkQWxvdWQgPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkVGV4dEFyZWFGaWVsZChkZXRhaWxzR3JpZCwgXCJUYWN0aWNzXCIsIHRoaXMudGFjdGljcywgKHZhbHVlKSA9PiB7XG4gICAgICB0aGlzLnRhY3RpY3MgPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkVGV4dEFyZWFGaWVsZChkZXRhaWxzR3JpZCwgXCJUcmVhc3VyZVwiLCB0aGlzLnRyZWFzdXJlLCAodmFsdWUpID0+IHtcbiAgICAgIHRoaXMudHJlYXN1cmUgPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIGNvbnN0IG5vdGVzRmllbGQgPSBkZXRhaWxzRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZGV0YWlscy1maWVsZCBzZC1lbmNvdW50ZXItbm90ZXMtZmllbGRcIlxuICAgIH0pO1xuXG4gICAgbm90ZXNGaWVsZC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgIHRleHQ6IFwiTm90ZXNcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgbm90ZXNBcmVhID0gbm90ZXNGaWVsZC5jcmVhdGVFbChcInRleHRhcmVhXCIpO1xuXG4gICAgbm90ZXNBcmVhLnZhbHVlID0gdGhpcy5ub3RlcztcbiAgICBub3Rlc0FyZWEucm93cyA9IDQ7XG5cbiAgICBub3Rlc0FyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMubm90ZXMgPSBub3Rlc0FyZWEudmFsdWU7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlckZvb3RlckJ1dHRvbnMoY29udGVudEVsLCBbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIkJhY2tcIixcbiAgICAgICAgb25DbGljazogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPSBcIm1vbnN0ZXJzXCI7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiU2tpcCBEZXRhaWxzXCIsXG4gICAgICAgIG9uQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gXCJwcmV2aWV3XCI7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiUHJldmlld1wiLFxuICAgICAgICBjdGE6IHRydWUsXG4gICAgICAgIG9uQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gXCJwcmV2aWV3XCI7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0pO1xuICB9XG5cbiAgYWRkVGV4dEFyZWFGaWVsZChcbiAgICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQsXG4gICAgbGFiZWw6IHN0cmluZyxcbiAgICB2YWx1ZTogc3RyaW5nLFxuICAgIG9uQ2hhbmdlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBmaWVsZEVsID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItZGV0YWlscy1maWVsZFwiXG4gICAgfSk7XG5cbiAgICBmaWVsZEVsLmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgdGV4dDogbGFiZWxcbiAgICB9KTtcblxuICAgIGNvbnN0IHRleHRhcmVhID0gZmllbGRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIpO1xuXG4gICAgdGV4dGFyZWEudmFsdWUgPSB2YWx1ZTtcbiAgICB0ZXh0YXJlYS5yb3dzID0gNDtcblxuICAgIHRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICBvbkNoYW5nZSh0ZXh0YXJlYS52YWx1ZSk7XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJQcmV2aWV3U3RlcChjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgZW5jb3VudGVyID0gdGhpcy5nZXRFbmNvdW50ZXJEYXRhKCk7XG5cbiAgICBjb25zdCBwcmV2aWV3RWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItcHJldmlldy1zdGVwXCJcbiAgICB9KTtcblxuICAgIHByZXZpZXdFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJQcmV2aWV3IHRoZSBtYXJrZG93biB0aGF0IHdpbGwgYmUgY3JlYXRlZC5cIlxuICAgIH0pO1xuXG4gICAgY29uc3QgbWFya2Rvd25QcmV2aWV3ID0gcHJldmlld0VsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcInNkLWVuY291bnRlci1tYXJrZG93bi1wcmV2aWV3XCJcbiAgICB9KTtcblxuICAgIG1hcmtkb3duUHJldmlldy52YWx1ZSA9IGdlbmVyYXRlRW5jb3VudGVyTWFya2Rvd24oZW5jb3VudGVyKTtcbiAgICBtYXJrZG93blByZXZpZXcucmVhZE9ubHkgPSB0cnVlO1xuXG4gICAgdGhpcy5yZW5kZXJGb290ZXJCdXR0b25zKGNvbnRlbnRFbCwgW1xuICAgICAge1xuICAgICAgICBsYWJlbDogXCJCYWNrXCIsXG4gICAgICAgIG9uQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gXCJkZXRhaWxzXCI7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IFwiQ3JlYXRlIEVuY291bnRlclwiLFxuICAgICAgICBjdGE6IHRydWUsXG4gICAgICAgIG9uQ2xpY2s6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUVuY291bnRlcigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXSk7XG4gIH1cblxuICByZW5kZXJGb290ZXJCdXR0b25zKFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBidXR0b25zOiB7XG4gICAgICBsYWJlbDogc3RyaW5nO1xuICAgICAgY3RhPzogYm9vbGVhbjtcbiAgICAgIG9uQ2xpY2s6ICgpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICAgIH1bXVxuICApOiB2b2lkIHtcblxuICAgIGNvbnN0IGZvb3RlckVsID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogXCJzZC1lbmNvdW50ZXItd2l6YXJkLWZvb3RlclwiXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IGJ1dHRvbkNvbmZpZyBvZiBidXR0b25zKSB7XG5cbiAgICAgIGNvbnN0IGJ1dHRvbiA9IGZvb3RlckVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgdGV4dDogYnV0dG9uQ29uZmlnLmxhYmVsXG4gICAgICB9KTtcblxuICAgICAgaWYgKGJ1dHRvbkNvbmZpZy5jdGEpIHtcbiAgICAgICAgYnV0dG9uLmFkZENsYXNzKFwibW9kLWN0YVwiKTtcbiAgICAgIH1cblxuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgYnV0dG9uQ29uZmlnLm9uQ2xpY2soKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGdldEVuY291bnRlckRhdGEoKTogRW5jb3VudGVyRGF0YSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IHRoaXMuZW5jb3VudGVyTmFtZS50cmltKCksXG4gICAgICBwYXJ0eUxldmVsOiB0aGlzLnBhcnR5TGV2ZWwsXG4gICAgICBwYXJ0eVNpemU6IHRoaXMucGFydHlTaXplLFxuICAgICAgbW9uc3RlcnM6IHRoaXMuc2VsZWN0ZWRNb25zdGVycyxcbiAgICAgIHNldHVwOiB0aGlzLnNldHVwLFxuICAgICAgcmVhZEFsb3VkOiB0aGlzLnJlYWRBbG91ZCxcbiAgICAgIHRhY3RpY3M6IHRoaXMudGFjdGljcyxcbiAgICAgIHRyZWFzdXJlOiB0aGlzLnRyZWFzdXJlLFxuICAgICAgbm90ZXM6IHRoaXMubm90ZXNcbiAgICB9O1xuICB9XG5cbiAgZ2V0QXZhaWxhYmxlVGFncygpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgdGFnU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgdGhpcy5tb25zdGVySW5kZXguZ2V0QWxsTW9uc3RlcnMoKSkge1xuICAgICAgZm9yIChjb25zdCB0YWcgb2YgbW9uc3Rlci50YWdzID8/IFtdKSB7XG4gICAgICAgIHRhZ1NldC5hZGQoU3RyaW5nKHRhZykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBbLi4udGFnU2V0XS5zb3J0KChhLCBiKSA9PiBhLmxvY2FsZUNvbXBhcmUoYikpO1xuICB9XG5cbiAgc29ydE1vbnN0ZXJzKG1vbnN0ZXJzOiBNb25zdGVyU3VtbWFyeVtdKTogTW9uc3RlclN1bW1hcnlbXSB7XG4gICAgcmV0dXJuIFsuLi5tb25zdGVyc10uc29ydCgoYSwgYikgPT4ge1xuICAgICAgY29uc3QgYUxldmVsID0gTnVtYmVyKGEubGV2ZWwgPz8gOTk5KTtcbiAgICAgIGNvbnN0IGJMZXZlbCA9IE51bWJlcihiLmxldmVsID8/IDk5OSk7XG5cbiAgICAgIHN3aXRjaCAodGhpcy5zb3J0TW9kZSkge1xuICAgICAgICBjYXNlIFwibmFtZS1kZXNjXCI6XG4gICAgICAgICAgcmV0dXJuIGIubmFtZS5sb2NhbGVDb21wYXJlKGEubmFtZSk7XG5cbiAgICAgICAgY2FzZSBcImxldmVsLWFzY1wiOlxuICAgICAgICAgIHJldHVybiBhTGV2ZWwgLSBiTGV2ZWwgfHwgYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKTtcblxuICAgICAgICBjYXNlIFwibGV2ZWwtZGVzY1wiOlxuICAgICAgICAgIHJldHVybiBiTGV2ZWwgLSBhTGV2ZWwgfHwgYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKTtcblxuICAgICAgICBjYXNlIFwibmFtZS1hc2NcIjpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlck1vbnN0ZXJSZXN1bHRzKCk6IHZvaWQge1xuICAgIGNvbnN0IHJlc3VsdHNFbCA9IHRoaXMuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAnW2RhdGEtcm9sZT1cIm1vbnN0ZXItcmVzdWx0c1wiXSdcbiAgICApO1xuXG4gICAgaWYgKCEocmVzdWx0c0VsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVzdWx0c0VsLmVtcHR5KCk7XG5cbiAgICBsZXQgbW9uc3RlcnMgPSB0aGlzLm1vbnN0ZXJJbmRleC5zZWFyY2hNb25zdGVycyh0aGlzLm1vbnN0ZXJTZWFyY2gpO1xuXG4gICAgaWYgKHRoaXMubGV2ZWxGaWx0ZXIpIHtcbiAgICAgIG1vbnN0ZXJzID0gbW9uc3RlcnMuZmlsdGVyKChtb25zdGVyKSA9PlxuICAgICAgICBTdHJpbmcobW9uc3Rlci5sZXZlbCA/PyBcIlwiKSA9PT0gdGhpcy5sZXZlbEZpbHRlclxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy50YWdGaWx0ZXIpIHtcbiAgICAgIG1vbnN0ZXJzID0gbW9uc3RlcnMuZmlsdGVyKChtb25zdGVyKSA9PlxuICAgICAgICAobW9uc3Rlci50YWdzID8/IFtdKS5pbmNsdWRlcyh0aGlzLnRhZ0ZpbHRlcilcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbW9uc3RlcnMgPSB0aGlzLnNvcnRNb25zdGVycyhtb25zdGVycyk7XG4gICAgbW9uc3RlcnMgPSBtb25zdGVycy5zbGljZSgwLCAxMDApO1xuXG4gICAgZm9yIChjb25zdCBtb25zdGVyIG9mIG1vbnN0ZXJzKSB7XG4gICAgICBuZXcgU2V0dGluZyhyZXN1bHRzRWwpXG4gICAgICAgIC5zZXROYW1lKG1vbnN0ZXIubmFtZSlcbiAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgW1xuICAgICAgICAgICAgbW9uc3Rlci5sZXZlbCA/IGBMViAke21vbnN0ZXIubGV2ZWx9YCA6IG51bGwsXG4gICAgICAgICAgICBtb25zdGVyLmFjID8gYEFDICR7bW9uc3Rlci5hY31gIDogbnVsbCxcbiAgICAgICAgICAgIG1vbnN0ZXIuaHAgPyBgSFAgJHttb25zdGVyLmhwfWAgOiBudWxsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCIgXHUyMDIyIFwiKSB8fCBtb25zdGVyLnBhdGhcbiAgICAgICAgKVxuICAgICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+IHtcbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiUHJldmlld1wiKVxuICAgICAgICAgICAgLm9uQ2xpY2soKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIHNob3dNb25zdGVyUHJldmlldyh0aGlzLmFwcCwgZXZlbnQsIG1vbnN0ZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT4ge1xuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJBZGRcIilcbiAgICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmFkZE1vbnN0ZXIobW9uc3Rlcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmVuZGVyU2VsZWN0ZWRNb25zdGVycygpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZEVsID0gdGhpcy5jb250ZW50RWwucXVlcnlTZWxlY3RvcihcbiAgICAgICdbZGF0YS1yb2xlPVwic2VsZWN0ZWQtbW9uc3RlcnNcIl0nXG4gICAgKTtcblxuICAgIGlmICghKHNlbGVjdGVkRWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxlY3RlZEVsLmVtcHR5KCk7XG5cbiAgICBpZiAodGhpcy5zZWxlY3RlZE1vbnN0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc2VsZWN0ZWRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICB0ZXh0OiBcIk5vIG1vbnN0ZXJzIHNlbGVjdGVkIHlldC5cIlxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgdGhpcy5zZWxlY3RlZE1vbnN0ZXJzKSB7XG4gICAgICBuZXcgU2V0dGluZyhzZWxlY3RlZEVsKVxuICAgICAgICAuc2V0TmFtZShtb25zdGVyLm5hbWUpXG4gICAgICAgIC5zZXREZXNjKG1vbnN0ZXIucGF0aClcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhtb25zdGVyLnF0eSkpO1xuXG4gICAgICAgICAgdGV4dC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHF0eSA9IE51bWJlcih2YWx1ZSk7XG5cbiAgICAgICAgICAgIG1vbnN0ZXIucXR5ID1cbiAgICAgICAgICAgICAgTnVtYmVyLmlzRmluaXRlKHF0eSkgJiYgcXR5ID4gMFxuICAgICAgICAgICAgICAgID8gTWF0aC5mbG9vcihxdHkpXG4gICAgICAgICAgICAgICAgOiAxO1xuXG4gICAgICAgICAgICB0aGlzLnJlbmRlckVuY291bnRlclN1bW1hcnkoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIlJlbW92ZVwiKVxuICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkTW9uc3RlcnMgPSB0aGlzLnNlbGVjdGVkTW9uc3RlcnMuZmlsdGVyKFxuICAgICAgICAgICAgICAgIChzZWxlY3RlZCkgPT4gc2VsZWN0ZWQucGF0aCAhPT0gbW9uc3Rlci5wYXRoXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgdGhpcy5yZW5kZXJTZWxlY3RlZE1vbnN0ZXJzKCk7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyRW5jb3VudGVyU3VtbWFyeSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlckVuY291bnRlclN1bW1hcnkoKTogdm9pZCB7XG4gICAgY29uc3Qgc3VtbWFyeUVsID0gdGhpcy5jb250ZW50RWwucXVlcnlTZWxlY3RvcihcbiAgICAgICdbZGF0YS1yb2xlPVwiZW5jb3VudGVyLXN1bW1hcnlcIl0nXG4gICAgKTtcblxuICAgIGlmICghKHN1bW1hcnlFbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN1bW1hcnlFbC5lbXB0eSgpO1xuXG4gICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMuZ2V0RW5jb3VudGVyU3VtbWFyeSgpO1xuXG4gICAgc3VtbWFyeUVsLmNyZWF0ZUVsKFwiaDRcIiwge1xuICAgICAgdGV4dDogXCJFbmNvdW50ZXIgU3VtbWFyeVwiXG4gICAgfSk7XG5cbiAgICBzdW1tYXJ5RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBUb3RhbCBNb25zdGVyczogJHtzdW1tYXJ5LnRvdGFsTW9uc3RlcnN9YFxuICAgIH0pO1xuXG4gICAgc3VtbWFyeUVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgVW5pcXVlIE1vbnN0ZXJzOiAke3N1bW1hcnkudW5pcXVlTW9uc3RlcnN9YFxuICAgIH0pO1xuXG4gICAgc3VtbWFyeUVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgQXZlcmFnZSBNb25zdGVyIExldmVsOiAke3N1bW1hcnkuYXZlcmFnZUxldmVsLnRvRml4ZWQoMSl9YFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0RW5jb3VudGVyU3VtbWFyeSgpOiB7XG4gICAgdG90YWxNb25zdGVyczogbnVtYmVyO1xuICAgIHVuaXF1ZU1vbnN0ZXJzOiBudW1iZXI7XG4gICAgYXZlcmFnZUxldmVsOiBudW1iZXI7XG4gIH0ge1xuICAgIGNvbnN0IHRvdGFsTW9uc3RlcnMgPSB0aGlzLnNlbGVjdGVkTW9uc3RlcnMucmVkdWNlKFxuICAgICAgKHN1bSwgbW9uc3RlcikgPT4gc3VtICsgbW9uc3Rlci5xdHksXG4gICAgICAwXG4gICAgKTtcblxuICAgIGNvbnN0IHVuaXF1ZU1vbnN0ZXJzID0gdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLmxlbmd0aDtcblxuICAgIGxldCB0b3RhbExldmVscyA9IDA7XG4gICAgbGV0IGNvdW50ZWRNb25zdGVycyA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IG1vbnN0ZXIgb2YgdGhpcy5zZWxlY3RlZE1vbnN0ZXJzKSB7XG4gICAgICBjb25zdCBsZXZlbCA9IE51bWJlcihtb25zdGVyLmxldmVsKTtcblxuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4obGV2ZWwpKSB7XG4gICAgICAgIHRvdGFsTGV2ZWxzICs9IGxldmVsICogbW9uc3Rlci5xdHk7XG4gICAgICAgIGNvdW50ZWRNb25zdGVycyArPSBtb25zdGVyLnF0eTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhdmVyYWdlTGV2ZWwgPVxuICAgICAgY291bnRlZE1vbnN0ZXJzID4gMFxuICAgICAgICA/IHRvdGFsTGV2ZWxzIC8gY291bnRlZE1vbnN0ZXJzXG4gICAgICAgIDogMDtcblxuICAgIHJldHVybiB7XG4gICAgICB0b3RhbE1vbnN0ZXJzLFxuICAgICAgdW5pcXVlTW9uc3RlcnMsXG4gICAgICBhdmVyYWdlTGV2ZWxcbiAgICB9O1xuICB9XG5cbiAgYWRkTW9uc3Rlcihtb25zdGVyOiBNb25zdGVyU3VtbWFyeSk6IHZvaWQge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5zZWxlY3RlZE1vbnN0ZXJzLmZpbmQoXG4gICAgICAoc2VsZWN0ZWQpID0+IHNlbGVjdGVkLnBhdGggPT09IG1vbnN0ZXIucGF0aFxuICAgICk7XG5cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIGV4aXN0aW5nLnF0eSArPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNlbGVjdGVkTW9uc3RlcnMucHVzaCh7XG4gICAgICAgIG5hbWU6IG1vbnN0ZXIubmFtZSxcbiAgICAgICAgcGF0aDogbW9uc3Rlci5wYXRoLFxuICAgICAgICBxdHk6IDEsXG4gICAgICAgIGxldmVsOiBtb25zdGVyLmxldmVsLFxuICAgICAgICBhYzogbW9uc3Rlci5hYyxcbiAgICAgICAgaHA6IG1vbnN0ZXIuaHBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyU2VsZWN0ZWRNb25zdGVycygpO1xuICAgIHRoaXMucmVuZGVyRW5jb3VudGVyU3VtbWFyeSgpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlRW5jb3VudGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG5hbWUgPSB0aGlzLmVuY291bnRlck5hbWUudHJpbSgpO1xuXG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICBuZXcgTm90aWNlKFwiRW5jb3VudGVyIG5hbWUgaXMgcmVxdWlyZWQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmVuY291bnRlclNlcnZpY2UuY3JlYXRlRW5jb3VudGVyTm90ZSh0aGlzLmdldEVuY291bnRlckRhdGEoKSk7XG5cbiAgICAgIG5ldyBOb3RpY2UoXCJFbmNvdW50ZXIgY3JlYXRlZC5cIik7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gY3JlYXRlIGVuY291bnRlcjpcIiwgZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcIkZhaWxlZCB0byBjcmVhdGUgZW5jb3VudGVyLiBDaGVjayBjb25zb2xlLlwiKTtcbiAgICB9XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBNZW51LCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IE1vbnN0ZXJTdW1tYXJ5IH0gZnJvbSBcIi4uL3R5cGVzL2VuY291bnRlcnNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dNb25zdGVyUHJldmlldyhcbiAgYXBwOiBBcHAsXG4gIGV2ZW50OiBNb3VzZUV2ZW50LFxuICBtb25zdGVyOiBNb25zdGVyU3VtbWFyeVxuKTogdm9pZCB7XG5cbiAgY29uc3QgbWVudSA9IG5ldyBNZW51KCk7XG5cbiAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgaXRlbVxuICAgICAgICAuc2V0VGl0bGUobW9uc3Rlci5uYW1lKVxuICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG1vbnN0ZXIucGF0aCk7XG5cbiAgICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJNb25zdGVyIGZpbGUgbm90IGZvdW5kLlwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBhcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUoZmlsZSk7XG4gICAgIH0pO1xuICB9KTtcblxuICBtZW51LmFkZFNlcGFyYXRvcigpO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW0uc2V0VGl0bGUoXG4gICAgICBbXG4gICAgICAgIG1vbnN0ZXIubGV2ZWwgPyBgTFYgJHttb25zdGVyLmxldmVsfWAgOiBudWxsLFxuICAgICAgICBtb25zdGVyLmFjID8gYEFDICR7bW9uc3Rlci5hY31gIDogbnVsbCxcbiAgICAgICAgbW9uc3Rlci5ocCA/IGBIUCAke21vbnN0ZXIuaHB9YCA6IG51bGxcbiAgICAgIF1cbiAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAuam9pbihcIiBcdTIwMjIgXCIpXG4gICAgKTtcblxuICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gIH0pO1xuXG4gIGlmIChtb25zdGVyLmF0aykge1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbS5zZXRUaXRsZShgQVRLOiAke21vbnN0ZXIuYXRrfWApO1xuICAgICAgaXRlbS5zZXREaXNhYmxlZCh0cnVlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZvciAoY29uc3QgdHJhaXQgb2YgbW9uc3Rlci50cmFpdHMgPz8gW10pIHtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uc2V0VGl0bGUodHJhaXQpO1xuICAgICAgaXRlbS5zZXREaXNhYmxlZCh0cnVlKTtcbiAgICB9KTtcbiAgfVxuXG4gIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cbiAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgaXRlbVxuICAgICAgLnNldFRpdGxlKFwiQ29weSBNb25zdGVyIFBhdGhcIilcbiAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobW9uc3Rlci5wYXRoKTtcblxuICAgICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBwYXRoIGNvcGllZC5cIik7XG4gICAgICB9KTtcbiAgfSk7XG5cbiAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgaXRlbVxuICAgICAgLnNldFRpdGxlKFwiT3BlbiBpbiBOZXcgVGFiXCIpXG4gICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG1vbnN0ZXIucGF0aCk7XG4gICAgICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgYXBwLndvcmtzcGFjZS5nZXRMZWFmKHRydWUpLm9wZW5GaWxlKGZpbGUpO1xuICAgICAgfSk7XG4gIH0pO1xuXG4gIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgIGl0ZW1cbiAgICAgIC5zZXRUaXRsZShcIk9wZW4gdG8gdGhlIFJpZ2h0XCIpXG4gICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG5cbiAgICAgICAgY29uc3QgZmlsZSA9XG4gICAgICAgICAgYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChtb25zdGVyLnBhdGgpO1xuXG4gICAgICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiTW9uc3RlciBmaWxlIG5vdCBmb3VuZC5cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGVhZiA9XG4gICAgICAgICAgYXBwLndvcmtzcGFjZS5nZXRMZWFmKFwic3BsaXRcIiwgXCJ2ZXJ0aWNhbFwiKTtcblxuICAgICAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuICAgICAgfSk7XG4gIH0pO1xuXG4gIG1lbnUuc2hvd0F0TW91c2VFdmVudChldmVudCk7XG59Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQStCOzs7QUNJeEIsSUFBTSxlQUFlOzs7QUNBckIsSUFBTSxlQUFOLE1BQW1CO0FBQUEsRUFHeEIsWUFBWSxLQUFVO0FBQ3BCLFNBQUssTUFBTTtBQUFBLEVBQ2I7QUFBQSxFQUVBLGVBQWUsT0FBaUM7QUFDOUMsVUFBTSxRQUFRLE1BQU0sWUFBWSxFQUFFLEtBQUs7QUFFdkMsUUFBSSxDQUFDLE9BQU87QUFDUixhQUFPLEtBQUssZUFBZTtBQUFBLElBQy9CO0FBRUEsV0FBTyxLQUFLLGVBQWUsRUFBRTtBQUFBLE1BQU8sQ0FBQyxZQUNqQyxRQUFRLEtBQUssWUFBWSxFQUFFLFNBQVMsS0FBSztBQUFBLElBQzdDO0FBQUEsRUFDSjtBQUFBLEVBRUUsaUJBQW1DO0FBQ2pDLFVBQU0sUUFBUSxLQUFLLElBQUksTUFBTSxpQkFBaUI7QUFFOUMsVUFBTSxXQUE2QixDQUFDO0FBRXBDLGVBQVcsUUFBUSxPQUFPO0FBQ3hCLFlBQU0sVUFBVSxLQUFLLG1CQUFtQixJQUFJO0FBRTVDLFVBQUksU0FBUztBQUNYLGlCQUFTLEtBQUssT0FBTztBQUFBLE1BQ3ZCO0FBQUEsSUFDRjtBQUVBLFdBQU8sU0FBUztBQUFBLE1BQUssQ0FBQyxHQUFHLE1BQ3ZCLEVBQUUsS0FBSyxjQUFjLEVBQUUsSUFBSTtBQUFBLElBQzdCO0FBQUEsRUFDRjtBQUFBLEVBRUEsbUJBQW1CLE1BQW9DO0FBQ3JELFVBQU0sUUFDSixLQUFLLElBQUksY0FBYyxhQUFhLElBQUk7QUFFMUMsVUFBTSxjQUFjLCtCQUFPO0FBRTNCLFFBQUksQ0FBQyxhQUFhO0FBQ2hCLGFBQU87QUFBQSxJQUNUO0FBRUEsUUFBSSxZQUFZLG1CQUFtQixjQUFjO0FBQy9DLGFBQU87QUFBQSxJQUNUO0FBRUEsV0FBTztBQUFBLE1BQ0wsTUFBTSxZQUFZLFFBQVEsS0FBSztBQUFBLE1BQy9CLE1BQU0sS0FBSztBQUFBLE1BRVgsT0FBTyxZQUFZO0FBQUEsTUFDbkIsSUFBSSxZQUFZO0FBQUEsTUFDaEIsSUFBSSxZQUFZO0FBQUEsTUFFaEIsS0FBSyxNQUFNLFFBQVEsWUFBWSxHQUFHLElBQzVCLFlBQVksSUFBSSxDQUFDLElBQ2pCLFlBQVk7QUFBQSxNQUVsQixRQUFRLE1BQU0sUUFBUSxZQUFZLE1BQU0sSUFDbEMsWUFBWSxPQUFPLE1BQU0sR0FBRyxDQUFDLElBQzdCLENBQUM7QUFBQSxNQUVQLE1BQU0sWUFBWSxRQUFRLENBQUM7QUFBQSxJQUM3QjtBQUFBLEVBQ0Y7QUFDRjs7O0FDMUVBLHNCQUE0Qzs7O0FDRTVDLFNBQVMsb0JBQW9CLFdBSTNCO0FBQ0EsUUFBTSxnQkFBZ0IsVUFBVSxTQUFTO0FBQUEsSUFDdkMsQ0FBQyxLQUFLLFlBQVksTUFBTSxRQUFRO0FBQUEsSUFDaEM7QUFBQSxFQUNGO0FBRUEsUUFBTSxpQkFBaUIsVUFBVSxTQUFTO0FBRTFDLE1BQUksY0FBYztBQUNsQixNQUFJLGtCQUFrQjtBQUV0QixhQUFXLFdBQVcsVUFBVSxVQUFVO0FBQ3hDLFVBQU0sUUFBUSxPQUFPLFFBQVEsS0FBSztBQUVsQyxRQUFJLENBQUMsT0FBTyxNQUFNLEtBQUssR0FBRztBQUN4QixxQkFBZSxRQUFRLFFBQVE7QUFDL0IseUJBQW1CLFFBQVE7QUFBQSxJQUM3QjtBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0E7QUFBQSxJQUNBLGNBQ0Usa0JBQWtCLElBQUksY0FBYyxrQkFBa0I7QUFBQSxFQUMxRDtBQUNGO0FBRUEsU0FBUyxRQUFRLE9BQWUsU0FBMEI7QUFDeEQsU0FBTyxNQUFNLEtBQUs7QUFBQTtBQUFBLEdBRWxCLG1DQUFTLFdBQVUsRUFBRTtBQUFBO0FBRXZCO0FBRU8sU0FBUywwQkFDZCxXQUNRO0FBM0NWO0FBNENFLFFBQU0sZUFBZSxVQUFVLFNBQzVCO0FBQUEsSUFBSSxDQUFDLFlBQ0osS0FBSyxRQUFRLEdBQUcsT0FBTyxRQUFRLElBQUksSUFBSSxRQUFRLElBQUk7QUFBQSxFQUNyRCxFQUNDLEtBQUssSUFBSTtBQUVaLFFBQU0sVUFBVSxvQkFBb0IsU0FBUztBQUU3QyxTQUFPO0FBQUE7QUFBQSxRQUVELFVBQVUsSUFBSTtBQUFBO0FBQUE7QUFBQSxlQUdSLGVBQVUsZUFBVixZQUF3QixDQUFDO0FBQUEsY0FDMUIsZUFBVSxjQUFWLFlBQXVCLENBQUM7QUFBQTtBQUFBLFlBRTFCLGVBQVUsWUFBVixZQUFxQixFQUFFO0FBQUEsVUFDekIsZUFBVSxVQUFWLFlBQW1CLEVBQUU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFNMUIsVUFBVSxJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUEsa0JBSUQsZUFBVSxlQUFWLFlBQXdCLENBQUM7QUFBQSxpQkFDMUIsZUFBVSxjQUFWLFlBQXVCLENBQUM7QUFBQSxvQkFDcEIsUUFBUSxhQUFhO0FBQUEscUJBQ3BCLFFBQVEsY0FBYztBQUFBLDJCQUNoQixRQUFRLGFBQWEsUUFBUSxDQUFDLENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS3hELGdCQUFnQixRQUFRO0FBQUE7QUFBQSxFQUV4QixRQUFRLFNBQVMsVUFBVSxLQUFLLENBQUM7QUFBQSxFQUNqQyxRQUFRLGNBQWMsVUFBVSxTQUFTLENBQUM7QUFBQSxFQUMxQyxRQUFRLFdBQVcsVUFBVSxPQUFPLENBQUM7QUFBQSxFQUNyQyxRQUFRLFlBQVksVUFBVSxRQUFRLENBQUM7QUFBQSxFQUN2QyxRQUFRLFNBQVMsVUFBVSxLQUFLLENBQUM7QUFBQTtBQUVuQzs7O0FEbkZPLElBQU0sbUJBQU4sTUFBdUI7QUFBQSxFQUc1QixZQUFZLEtBQVU7QUFDcEIsU0FBSyxNQUFNO0FBQUEsRUFDYjtBQUFBLEVBRUEsTUFBTSxvQkFBb0IsV0FBMEI7QUFDbEQsVUFBTSxVQUFVLDBCQUEwQixTQUFTO0FBRW5ELFVBQU0sV0FBVyxVQUFVLEtBQ3hCLFFBQVEsaUJBQWlCLEVBQUUsRUFDM0IsS0FBSztBQUVSLFVBQU0sYUFBYTtBQUNuQixVQUFNLGVBQVcsK0JBQWMsR0FBRyxVQUFVLElBQUksUUFBUSxLQUFLO0FBRTdELFVBQU0sS0FBSyxhQUFhLFVBQVU7QUFFbEMsVUFBTSxPQUFPLE1BQU0sS0FBSyxJQUFJLE1BQU0sT0FBTyxVQUFVLE9BQU87QUFFMUQsVUFBTSxLQUFLLElBQUksVUFBVSxRQUFRLElBQUksRUFBRSxTQUFTLElBQUk7QUFFcEQsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sYUFBYSxNQUE2QjtBQUM5QyxVQUFNLFdBQVcsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLElBQUk7QUFFMUQsUUFBSSxvQkFBb0IseUJBQVM7QUFDL0I7QUFBQSxJQUNGO0FBRUEsVUFBTSxLQUFLLElBQUksTUFBTSxhQUFhLElBQUk7QUFBQSxFQUN4QztBQUNGOzs7QUV4Q0EsSUFBQUMsbUJBQTRDOzs7QUNBNUMsSUFBQUMsbUJBQXlDO0FBSWxDLFNBQVMsbUJBQ2QsS0FDQSxPQUNBLFNBQ007QUFSUjtBQVVFLFFBQU0sT0FBTyxJQUFJLHNCQUFLO0FBRXRCLE9BQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsU0FDSyxTQUFTLFFBQVEsSUFBSSxFQUNyQixRQUFRLFlBQVk7QUFDckIsWUFBTSxPQUFPLElBQUksTUFBTSxzQkFBc0IsUUFBUSxJQUFJO0FBRXpELFVBQUksRUFBRSxnQkFBZ0IseUJBQVE7QUFDNUIsWUFBSSx3QkFBTyx5QkFBeUI7QUFDcEM7QUFBQSxNQUNGO0FBRUEsWUFBTSxJQUFJLFVBQVUsUUFBUSxJQUFJLEVBQUUsU0FBUyxJQUFJO0FBQUEsSUFDbEQsQ0FBQztBQUFBLEVBQ0osQ0FBQztBQUVELE9BQUssYUFBYTtBQUVsQixPQUFLLFFBQVEsQ0FBQyxTQUFTO0FBQ3JCLFNBQUs7QUFBQSxNQUNIO0FBQUEsUUFDRSxRQUFRLFFBQVEsTUFBTSxRQUFRLEtBQUssS0FBSztBQUFBLFFBQ3hDLFFBQVEsS0FBSyxNQUFNLFFBQVEsRUFBRSxLQUFLO0FBQUEsUUFDbEMsUUFBUSxLQUFLLE1BQU0sUUFBUSxFQUFFLEtBQUs7QUFBQSxNQUNwQyxFQUNHLE9BQU8sT0FBTyxFQUNkLEtBQUssVUFBSztBQUFBLElBQ2Y7QUFFQSxTQUFLLFlBQVksSUFBSTtBQUFBLEVBQ3ZCLENBQUM7QUFFRCxNQUFJLFFBQVEsS0FBSztBQUNmLFNBQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsV0FBSyxTQUFTLFFBQVEsUUFBUSxHQUFHLEVBQUU7QUFDbkMsV0FBSyxZQUFZLElBQUk7QUFBQSxJQUN2QixDQUFDO0FBQUEsRUFDSDtBQUVBLGFBQVcsVUFBUyxhQUFRLFdBQVIsWUFBa0IsQ0FBQyxHQUFHO0FBQ3hDLFNBQUssUUFBUSxDQUFDLFNBQVM7QUFDckIsV0FBSyxTQUFTLEtBQUs7QUFDbkIsV0FBSyxZQUFZLElBQUk7QUFBQSxJQUN2QixDQUFDO0FBQUEsRUFDSDtBQUVBLE9BQUssYUFBYTtBQUVsQixPQUFLLFFBQVEsQ0FBQyxTQUFTO0FBQ3JCLFNBQ0csU0FBUyxtQkFBbUIsRUFDNUIsUUFBUSxNQUFNO0FBQ2IsZ0JBQVUsVUFBVSxVQUFVLFFBQVEsSUFBSTtBQUUxQyxVQUFJLHdCQUFPLHNCQUFzQjtBQUFBLElBQ25DLENBQUM7QUFBQSxFQUNMLENBQUM7QUFFRCxPQUFLLFFBQVEsQ0FBQyxTQUFTO0FBQ3JCLFNBQ0csU0FBUyxpQkFBaUIsRUFDMUIsUUFBUSxZQUFZO0FBQ25CLFlBQU0sT0FBTyxJQUFJLE1BQU0sc0JBQXNCLFFBQVEsSUFBSTtBQUN6RCxVQUFJLEVBQUUsZ0JBQWdCLHlCQUFRO0FBQzVCLFlBQUksd0JBQU8seUJBQXlCO0FBQ3BDO0FBQUEsTUFDRjtBQUVBLFlBQU0sSUFBSSxVQUFVLFFBQVEsSUFBSSxFQUFFLFNBQVMsSUFBSTtBQUFBLElBQ2pELENBQUM7QUFBQSxFQUNMLENBQUM7QUFFRCxPQUFLLFFBQVEsQ0FBQyxTQUFTO0FBQ3JCLFNBQ0csU0FBUyxtQkFBbUIsRUFDNUIsUUFBUSxZQUFZO0FBRW5CLFlBQU0sT0FDSixJQUFJLE1BQU0sc0JBQXNCLFFBQVEsSUFBSTtBQUU5QyxVQUFJLEVBQUUsZ0JBQWdCLHlCQUFRO0FBQzVCLFlBQUksd0JBQU8seUJBQXlCO0FBQ3BDO0FBQUEsTUFDRjtBQUVBLFlBQU0sT0FDSixJQUFJLFVBQVUsUUFBUSxTQUFTLFVBQVU7QUFFM0MsWUFBTSxLQUFLLFNBQVMsSUFBSTtBQUFBLElBQzFCLENBQUM7QUFBQSxFQUNMLENBQUM7QUFFRCxPQUFLLGlCQUFpQixLQUFLO0FBQzdCOzs7QUQ5Rk8sSUFBTSx1QkFBTixjQUFtQyx1QkFBTTtBQUFBLEVBd0I5QyxZQUNFLEtBQ0EsY0FDQSxrQkFDQTtBQUNBLFVBQU0sR0FBRztBQXpCWCx1QkFBbUM7QUFFbkMseUJBQWdCO0FBRWhCLDRCQUF1QyxDQUFDO0FBRXhDLHlCQUFnQjtBQUNoQix1QkFBYztBQUNkLHFCQUFZO0FBQ1osb0JBQVc7QUFFWCxzQkFBYTtBQUNiLHFCQUFZO0FBRVosaUJBQVE7QUFDUixxQkFBWTtBQUNaLG1CQUFVO0FBQ1Ysb0JBQVc7QUFDWCxpQkFBUTtBQVNOLFNBQUssZUFBZTtBQUNwQixTQUFLLG1CQUFtQjtBQUFBLEVBQzFCO0FBQUEsRUFFQSxTQUFlO0FBQ2IsU0FBSyxRQUFRLFNBQVMsb0JBQW9CO0FBQzFDLFNBQUssT0FBTztBQUFBLEVBQ2Q7QUFBQSxFQUVBLFVBQWdCO0FBQ2QsU0FBSyxVQUFVLE1BQU07QUFBQSxFQUN2QjtBQUFBLEVBRUEsU0FBZTtBQUNiLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFFdEIsY0FBVSxNQUFNO0FBRWhCLGNBQVUsU0FBUyxNQUFNO0FBQUEsTUFDdkIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFNBQUssb0JBQW9CLFNBQVM7QUFFbEMsUUFBSSxLQUFLLGdCQUFnQixZQUFZO0FBQ25DLFdBQUssa0JBQWtCLFNBQVM7QUFDaEM7QUFBQSxJQUNGO0FBRUEsUUFBSSxLQUFLLGdCQUFnQixXQUFXO0FBQ2xDLFdBQUssa0JBQWtCLFNBQVM7QUFDaEM7QUFBQSxJQUNGO0FBRUEsU0FBSyxrQkFBa0IsU0FBUztBQUFBLEVBQ2xDO0FBQUEsRUFFQSxvQkFBb0IsYUFBZ0M7QUFDbEQsZ0JBQVksU0FBUyxLQUFLO0FBQUEsTUFDeEIsS0FBSztBQUFBLE1BQ0wsTUFDRSxLQUFLLGdCQUFnQixhQUNqQiw4QkFDQSxLQUFLLGdCQUFnQixZQUNuQiw2QkFDQTtBQUFBLElBQ1YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLGtCQUFrQixXQUE4QjtBQUM5QyxRQUFJLHlCQUFRLFNBQVMsRUFDbEIsUUFBUSxnQkFBZ0IsRUFDeEIsUUFBUSxDQUFDLFNBQVM7QUFDakIsV0FBSyxlQUFlLGVBQWU7QUFDbkMsV0FBSyxTQUFTLEtBQUssYUFBYTtBQUVoQyxXQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQ3ZCLGFBQUssZ0JBQWdCO0FBQUEsTUFDdkIsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUVILFVBQU0sWUFBWSxVQUFVLFVBQVU7QUFBQSxNQUNwQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsVUFBTSxZQUFZLFVBQVUsVUFBVTtBQUFBLE1BQ3BDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxVQUFNLFVBQVUsVUFBVSxVQUFVO0FBQUEsTUFDbEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGNBQVUsU0FBUyxNQUFNO0FBQUEsTUFDdkIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFNBQUssZ0JBQWdCLFNBQVM7QUFFOUIsVUFBTSxZQUFZLFVBQVUsVUFBVTtBQUFBLE1BQ3BDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxjQUFVLFFBQVEsT0FBTztBQUV6QixZQUFRLFNBQVMsTUFBTTtBQUFBLE1BQ3JCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLGFBQWEsUUFBUSxVQUFVO0FBQUEsTUFDbkMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGVBQVcsUUFBUSxPQUFPO0FBRTFCLFVBQU0sWUFBWSxRQUFRLFVBQVU7QUFBQSxNQUNsQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsY0FBVSxRQUFRLE9BQU87QUFFekIsVUFBTSxXQUFXLFFBQVEsVUFBVTtBQUFBLE1BQ2pDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxRQUFJLHlCQUFRLFFBQVEsRUFDakIsVUFBVSxDQUFDLFdBQVc7QUFDckIsYUFDRyxjQUFjLE1BQU0sRUFDcEIsT0FBTyxFQUNQLFFBQVEsTUFBTTtBQUNiLFlBQUksQ0FBQyxLQUFLLGNBQWMsS0FBSyxHQUFHO0FBQzlCLGNBQUksd0JBQU8sNkJBQTZCO0FBQ3hDO0FBQUEsUUFDRjtBQUVBLGFBQUssY0FBYztBQUNuQixhQUFLLE9BQU87QUFBQSxNQUNkLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFSCxTQUFLLHFCQUFxQjtBQUMxQixTQUFLLHVCQUF1QjtBQUM1QixTQUFLLHVCQUF1QjtBQUFBLEVBQzlCO0FBQUEsRUFFQSxnQkFBZ0IsV0FBOEI7QUFDNUMsVUFBTSxZQUFZLFVBQVUsVUFBVTtBQUFBLE1BQ3BDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxVQUFNLGNBQWMsVUFBVSxVQUFVO0FBQUEsTUFDdEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGdCQUFZLFNBQVMsU0FBUztBQUFBLE1BQzVCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLGNBQWMsWUFBWSxTQUFTLFNBQVM7QUFBQSxNQUNoRCxNQUFNO0FBQUEsTUFDTixhQUFhO0FBQUEsSUFDZixDQUFDO0FBRUQsZ0JBQVksUUFBUSxLQUFLO0FBRXpCLGdCQUFZLGlCQUFpQixTQUFTLE1BQU07QUFDMUMsV0FBSyxnQkFBZ0IsWUFBWTtBQUNqQyxXQUFLLHFCQUFxQjtBQUFBLElBQzVCLENBQUM7QUFFRCxVQUFNLGFBQWEsVUFBVSxVQUFVO0FBQUEsTUFDckMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGVBQVcsU0FBUyxTQUFTO0FBQUEsTUFDM0IsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sY0FBYyxXQUFXLFNBQVMsUUFBUTtBQUVoRCxnQkFBWSxTQUFTLFVBQVU7QUFBQSxNQUM3QixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsSUFDVCxDQUFDO0FBRUQsYUFBUyxRQUFRLEdBQUcsU0FBUyxJQUFJLFNBQVM7QUFDeEMsa0JBQVksU0FBUyxVQUFVO0FBQUEsUUFDN0IsTUFBTSxPQUFPLEtBQUs7QUFBQSxRQUNsQixPQUFPLE9BQU8sS0FBSztBQUFBLE1BQ3JCLENBQUM7QUFBQSxJQUNIO0FBRUEsZ0JBQVksUUFBUSxLQUFLO0FBRXpCLGdCQUFZLGlCQUFpQixVQUFVLE1BQU07QUFDM0MsV0FBSyxjQUFjLFlBQVk7QUFDL0IsV0FBSyxxQkFBcUI7QUFBQSxJQUM1QixDQUFDO0FBRUQsVUFBTSxXQUFXLFVBQVUsVUFBVTtBQUFBLE1BQ25DLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxhQUFTLFNBQVMsU0FBUztBQUFBLE1BQ3pCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLFlBQVksU0FBUyxTQUFTLFFBQVE7QUFFNUMsY0FBVSxTQUFTLFVBQVU7QUFBQSxNQUMzQixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsSUFDVCxDQUFDO0FBRUQsZUFBVyxPQUFPLEtBQUssaUJBQWlCLEdBQUc7QUFDekMsZ0JBQVUsU0FBUyxVQUFVO0FBQUEsUUFDM0IsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLE1BQ1QsQ0FBQztBQUFBLElBQ0g7QUFFQSxjQUFVLFFBQVEsS0FBSztBQUV2QixjQUFVLGlCQUFpQixVQUFVLE1BQU07QUFDekMsV0FBSyxZQUFZLFVBQVU7QUFDM0IsV0FBSyxxQkFBcUI7QUFBQSxJQUM1QixDQUFDO0FBRUQsVUFBTSxZQUFZLFVBQVUsVUFBVTtBQUFBLE1BQ3BDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxjQUFVLFNBQVMsU0FBUztBQUFBLE1BQzFCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLGFBQWEsVUFBVSxTQUFTLFFBQVE7QUFFOUMsZUFBVyxTQUFTLFVBQVU7QUFBQSxNQUM1QixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsSUFDVCxDQUFDO0FBRUQsZUFBVyxTQUFTLFVBQVU7QUFBQSxNQUM1QixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsSUFDVCxDQUFDO0FBRUQsZUFBVyxTQUFTLFVBQVU7QUFBQSxNQUM1QixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsSUFDVCxDQUFDO0FBRUQsZUFBVyxTQUFTLFVBQVU7QUFBQSxNQUM1QixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsSUFDVCxDQUFDO0FBRUQsZUFBVyxRQUFRLEtBQUs7QUFFeEIsZUFBVyxpQkFBaUIsVUFBVSxNQUFNO0FBQzFDLFdBQUssV0FBVyxXQUFXO0FBQzNCLFdBQUsscUJBQXFCO0FBQUEsSUFDNUIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLGtCQUFrQixXQUE4QjtBQUM5QyxVQUFNLFlBQVksVUFBVSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFVBQU0sV0FBVyxVQUFVLFVBQVU7QUFBQSxNQUNuQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsVUFBTSxhQUFhLFNBQVMsVUFBVTtBQUFBLE1BQ3BDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxlQUFXLFNBQVMsU0FBUztBQUFBLE1BQzNCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLGFBQWEsV0FBVyxTQUFTLFNBQVM7QUFBQSxNQUM5QyxNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsZUFBVyxRQUFRLE9BQU8sS0FBSyxVQUFVO0FBRXpDLGVBQVcsaUJBQWlCLFVBQVUsTUFBTTtBQUMxQyxZQUFNLFNBQVMsT0FBTyxXQUFXLEtBQUs7QUFFdEMsV0FBSyxhQUNILE9BQU8sU0FBUyxNQUFNLEtBQUssU0FBUyxJQUNoQyxLQUFLLE1BQU0sTUFBTSxJQUNqQjtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sWUFBWSxTQUFTLFVBQVU7QUFBQSxNQUNuQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsY0FBVSxTQUFTLFNBQVM7QUFBQSxNQUMxQixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsVUFBTSxZQUFZLFVBQVUsU0FBUyxTQUFTO0FBQUEsTUFDNUMsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELGNBQVUsUUFBUSxPQUFPLEtBQUssU0FBUztBQUV2QyxjQUFVLGlCQUFpQixVQUFVLE1BQU07QUFDekMsWUFBTSxTQUFTLE9BQU8sVUFBVSxLQUFLO0FBRXJDLFdBQUssWUFDSCxPQUFPLFNBQVMsTUFBTSxLQUFLLFNBQVMsSUFDaEMsS0FBSyxNQUFNLE1BQU0sSUFDakI7QUFBQSxJQUNSLENBQUM7QUFFRCxjQUFVLFNBQVMsS0FBSztBQUFBLE1BQ3RCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLGNBQWMsVUFBVSxVQUFVO0FBQUEsTUFDdEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFNBQUssaUJBQWlCLGFBQWEsU0FBUyxLQUFLLE9BQU8sQ0FBQyxVQUFVO0FBQ2pFLFdBQUssUUFBUTtBQUFBLElBQ2YsQ0FBQztBQUVELFNBQUssaUJBQWlCLGFBQWEsY0FBYyxLQUFLLFdBQVcsQ0FBQyxVQUFVO0FBQzFFLFdBQUssWUFBWTtBQUFBLElBQ25CLENBQUM7QUFFRCxTQUFLLGlCQUFpQixhQUFhLFdBQVcsS0FBSyxTQUFTLENBQUMsVUFBVTtBQUNyRSxXQUFLLFVBQVU7QUFBQSxJQUNqQixDQUFDO0FBRUQsU0FBSyxpQkFBaUIsYUFBYSxZQUFZLEtBQUssVUFBVSxDQUFDLFVBQVU7QUFDdkUsV0FBSyxXQUFXO0FBQUEsSUFDbEIsQ0FBQztBQUVELFVBQU0sYUFBYSxVQUFVLFVBQVU7QUFBQSxNQUNyQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBRUQsZUFBVyxTQUFTLFNBQVM7QUFBQSxNQUMzQixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsVUFBTSxZQUFZLFdBQVcsU0FBUyxVQUFVO0FBRWhELGNBQVUsUUFBUSxLQUFLO0FBQ3ZCLGNBQVUsT0FBTztBQUVqQixjQUFVLGlCQUFpQixTQUFTLE1BQU07QUFDeEMsV0FBSyxRQUFRLFVBQVU7QUFBQSxJQUN6QixDQUFDO0FBRUQsU0FBSyxvQkFBb0IsV0FBVztBQUFBLE1BQ2xDO0FBQUEsUUFDRSxPQUFPO0FBQUEsUUFDUCxTQUFTLE1BQU07QUFDYixlQUFLLGNBQWM7QUFDbkIsZUFBSyxPQUFPO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsUUFDRSxPQUFPO0FBQUEsUUFDUCxTQUFTLE1BQU07QUFDYixlQUFLLGNBQWM7QUFDbkIsZUFBSyxPQUFPO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsUUFDRSxPQUFPO0FBQUEsUUFDUCxLQUFLO0FBQUEsUUFDTCxTQUFTLE1BQU07QUFDYixlQUFLLGNBQWM7QUFDbkIsZUFBSyxPQUFPO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxpQkFDRSxhQUNBLE9BQ0EsT0FDQSxVQUNNO0FBQ04sVUFBTSxVQUFVLFlBQVksVUFBVTtBQUFBLE1BQ3BDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxZQUFRLFNBQVMsU0FBUztBQUFBLE1BQ3hCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLFdBQVcsUUFBUSxTQUFTLFVBQVU7QUFFNUMsYUFBUyxRQUFRO0FBQ2pCLGFBQVMsT0FBTztBQUVoQixhQUFTLGlCQUFpQixTQUFTLE1BQU07QUFDdkMsZUFBUyxTQUFTLEtBQUs7QUFBQSxJQUN6QixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsa0JBQWtCLFdBQThCO0FBQzlDLFVBQU0sWUFBWSxLQUFLLGlCQUFpQjtBQUV4QyxVQUFNLFlBQVksVUFBVSxVQUFVO0FBQUEsTUFDcEMsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sa0JBQWtCLFVBQVUsU0FBUyxZQUFZO0FBQUEsTUFDckQsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELG9CQUFnQixRQUFRLDBCQUEwQixTQUFTO0FBQzNELG9CQUFnQixXQUFXO0FBRTNCLFNBQUssb0JBQW9CLFdBQVc7QUFBQSxNQUNsQztBQUFBLFFBQ0UsT0FBTztBQUFBLFFBQ1AsU0FBUyxNQUFNO0FBQ2IsZUFBSyxjQUFjO0FBQ25CLGVBQUssT0FBTztBQUFBLFFBQ2Q7QUFBQSxNQUNGO0FBQUEsTUFDQTtBQUFBLFFBQ0UsT0FBTztBQUFBLFFBQ1AsS0FBSztBQUFBLFFBQ0wsU0FBUyxZQUFZO0FBQ25CLGdCQUFNLEtBQUssZ0JBQWdCO0FBQUEsUUFDN0I7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsb0JBQ0UsYUFDQSxTQUtNO0FBRU4sVUFBTSxXQUFXLFlBQVksVUFBVTtBQUFBLE1BQ3JDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxlQUFXLGdCQUFnQixTQUFTO0FBRWxDLFlBQU0sU0FBUyxTQUFTLFNBQVMsVUFBVTtBQUFBLFFBQ3pDLE1BQU0sYUFBYTtBQUFBLE1BQ3JCLENBQUM7QUFFRCxVQUFJLGFBQWEsS0FBSztBQUNwQixlQUFPLFNBQVMsU0FBUztBQUFBLE1BQzNCO0FBRUEsYUFBTyxpQkFBaUIsU0FBUyxNQUFNO0FBQ3JDLGFBQUssYUFBYSxRQUFRO0FBQUEsTUFDNUIsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQUEsRUFFQSxtQkFBa0M7QUFDaEMsV0FBTztBQUFBLE1BQ0wsTUFBTSxLQUFLLGNBQWMsS0FBSztBQUFBLE1BQzlCLFlBQVksS0FBSztBQUFBLE1BQ2pCLFdBQVcsS0FBSztBQUFBLE1BQ2hCLFVBQVUsS0FBSztBQUFBLE1BQ2YsT0FBTyxLQUFLO0FBQUEsTUFDWixXQUFXLEtBQUs7QUFBQSxNQUNoQixTQUFTLEtBQUs7QUFBQSxNQUNkLFVBQVUsS0FBSztBQUFBLE1BQ2YsT0FBTyxLQUFLO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLG1CQUE2QjtBQWpnQi9CO0FBa2dCSSxVQUFNLFNBQVMsb0JBQUksSUFBWTtBQUUvQixlQUFXLFdBQVcsS0FBSyxhQUFhLGVBQWUsR0FBRztBQUN4RCxpQkFBVyxRQUFPLGFBQVEsU0FBUixZQUFnQixDQUFDLEdBQUc7QUFDcEMsZUFBTyxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQUEsTUFDeEI7QUFBQSxJQUNGO0FBRUEsV0FBTyxDQUFDLEdBQUcsTUFBTSxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQztBQUFBLEVBQ3REO0FBQUEsRUFFQSxhQUFhLFVBQThDO0FBQ3pELFdBQU8sQ0FBQyxHQUFHLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNO0FBOWdCeEM7QUErZ0JNLFlBQU0sU0FBUyxRQUFPLE9BQUUsVUFBRixZQUFXLEdBQUc7QUFDcEMsWUFBTSxTQUFTLFFBQU8sT0FBRSxVQUFGLFlBQVcsR0FBRztBQUVwQyxjQUFRLEtBQUssVUFBVTtBQUFBLFFBQ3JCLEtBQUs7QUFDSCxpQkFBTyxFQUFFLEtBQUssY0FBYyxFQUFFLElBQUk7QUFBQSxRQUVwQyxLQUFLO0FBQ0gsaUJBQU8sU0FBUyxVQUFVLEVBQUUsS0FBSyxjQUFjLEVBQUUsSUFBSTtBQUFBLFFBRXZELEtBQUs7QUFDSCxpQkFBTyxTQUFTLFVBQVUsRUFBRSxLQUFLLGNBQWMsRUFBRSxJQUFJO0FBQUEsUUFFdkQsS0FBSztBQUFBLFFBQ0w7QUFDRSxpQkFBTyxFQUFFLEtBQUssY0FBYyxFQUFFLElBQUk7QUFBQSxNQUN0QztBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLHVCQUE2QjtBQUMzQixVQUFNLFlBQVksS0FBSyxVQUFVO0FBQUEsTUFDL0I7QUFBQSxJQUNGO0FBRUEsUUFBSSxFQUFFLHFCQUFxQixjQUFjO0FBQ3ZDO0FBQUEsSUFDRjtBQUVBLGNBQVUsTUFBTTtBQUVoQixRQUFJLFdBQVcsS0FBSyxhQUFhLGVBQWUsS0FBSyxhQUFhO0FBRWxFLFFBQUksS0FBSyxhQUFhO0FBQ3BCLGlCQUFXLFNBQVM7QUFBQSxRQUFPLENBQUMsWUFBUztBQWpqQjNDO0FBa2pCUSx5QkFBTyxhQUFRLFVBQVIsWUFBaUIsRUFBRSxNQUFNLEtBQUs7QUFBQTtBQUFBLE1BQ3ZDO0FBQUEsSUFDRjtBQUVBLFFBQUksS0FBSyxXQUFXO0FBQ2xCLGlCQUFXLFNBQVM7QUFBQSxRQUFPLENBQUMsWUFBUztBQXZqQjNDO0FBd2pCUyxnQ0FBUSxTQUFSLFlBQWdCLENBQUMsR0FBRyxTQUFTLEtBQUssU0FBUztBQUFBO0FBQUEsTUFDOUM7QUFBQSxJQUNGO0FBRUEsZUFBVyxLQUFLLGFBQWEsUUFBUTtBQUNyQyxlQUFXLFNBQVMsTUFBTSxHQUFHLEdBQUc7QUFFaEMsZUFBVyxXQUFXLFVBQVU7QUFDOUIsVUFBSSx5QkFBUSxTQUFTLEVBQ2xCLFFBQVEsUUFBUSxJQUFJLEVBQ3BCO0FBQUEsUUFDQztBQUFBLFVBQ0UsUUFBUSxRQUFRLE1BQU0sUUFBUSxLQUFLLEtBQUs7QUFBQSxVQUN4QyxRQUFRLEtBQUssTUFBTSxRQUFRLEVBQUUsS0FBSztBQUFBLFVBQ2xDLFFBQVEsS0FBSyxNQUFNLFFBQVEsRUFBRSxLQUFLO0FBQUEsUUFDcEMsRUFDRyxPQUFPLE9BQU8sRUFDZCxLQUFLLFVBQUssS0FBSyxRQUFRO0FBQUEsTUFDNUIsRUFDQyxVQUFVLENBQUMsV0FBVztBQUNyQixlQUNHLGNBQWMsU0FBUyxFQUN2QixRQUFRLENBQUMsVUFBVTtBQUNsQiw2QkFBbUIsS0FBSyxLQUFLLE9BQU8sT0FBTztBQUFBLFFBQzdDLENBQUM7QUFBQSxNQUNMLENBQUMsRUFDQSxVQUFVLENBQUMsV0FBVztBQUNyQixlQUNHLGNBQWMsS0FBSyxFQUNuQixPQUFPLEVBQ1AsUUFBUSxNQUFNO0FBQ2IsZUFBSyxXQUFXLE9BQU87QUFBQSxRQUN6QixDQUFDO0FBQUEsTUFDTCxDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLHlCQUErQjtBQUM3QixVQUFNLGFBQWEsS0FBSyxVQUFVO0FBQUEsTUFDaEM7QUFBQSxJQUNGO0FBRUEsUUFBSSxFQUFFLHNCQUFzQixjQUFjO0FBQ3hDO0FBQUEsSUFDRjtBQUVBLGVBQVcsTUFBTTtBQUVqQixRQUFJLEtBQUssaUJBQWlCLFdBQVcsR0FBRztBQUN0QyxpQkFBVyxTQUFTLEtBQUs7QUFBQSxRQUN2QixNQUFNO0FBQUEsTUFDUixDQUFDO0FBRUQ7QUFBQSxJQUNGO0FBRUEsZUFBVyxXQUFXLEtBQUssa0JBQWtCO0FBQzNDLFVBQUkseUJBQVEsVUFBVSxFQUNuQixRQUFRLFFBQVEsSUFBSSxFQUNwQixRQUFRLFFBQVEsSUFBSSxFQUNwQixRQUFRLENBQUMsU0FBUztBQUNqQixhQUFLLFNBQVMsT0FBTyxRQUFRLEdBQUcsQ0FBQztBQUVqQyxhQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQ3ZCLGdCQUFNLE1BQU0sT0FBTyxLQUFLO0FBRXhCLGtCQUFRLE1BQ04sT0FBTyxTQUFTLEdBQUcsS0FBSyxNQUFNLElBQzFCLEtBQUssTUFBTSxHQUFHLElBQ2Q7QUFFTixlQUFLLHVCQUF1QjtBQUFBLFFBQzlCLENBQUM7QUFBQSxNQUNILENBQUMsRUFDQSxVQUFVLENBQUMsV0FBVztBQUNyQixlQUNHLGNBQWMsUUFBUSxFQUN0QixRQUFRLE1BQU07QUFDYixlQUFLLG1CQUFtQixLQUFLLGlCQUFpQjtBQUFBLFlBQzVDLENBQUMsYUFBYSxTQUFTLFNBQVMsUUFBUTtBQUFBLFVBQzFDO0FBRUEsZUFBSyx1QkFBdUI7QUFDNUIsZUFBSyx1QkFBdUI7QUFBQSxRQUM5QixDQUFDO0FBQUEsTUFDTCxDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLHlCQUErQjtBQUM3QixVQUFNLFlBQVksS0FBSyxVQUFVO0FBQUEsTUFDL0I7QUFBQSxJQUNGO0FBRUEsUUFBSSxFQUFFLHFCQUFxQixjQUFjO0FBQ3ZDO0FBQUEsSUFDRjtBQUVBLGNBQVUsTUFBTTtBQUVoQixVQUFNLFVBQVUsS0FBSyxvQkFBb0I7QUFFekMsY0FBVSxTQUFTLE1BQU07QUFBQSxNQUN2QixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsY0FBVSxTQUFTLEtBQUs7QUFBQSxNQUN0QixNQUFNLG1CQUFtQixRQUFRLGFBQWE7QUFBQSxJQUNoRCxDQUFDO0FBRUQsY0FBVSxTQUFTLEtBQUs7QUFBQSxNQUN0QixNQUFNLG9CQUFvQixRQUFRLGNBQWM7QUFBQSxJQUNsRCxDQUFDO0FBRUQsY0FBVSxTQUFTLEtBQUs7QUFBQSxNQUN0QixNQUFNLDBCQUEwQixRQUFRLGFBQWEsUUFBUSxDQUFDLENBQUM7QUFBQSxJQUNqRSxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsc0JBSUU7QUFDQSxVQUFNLGdCQUFnQixLQUFLLGlCQUFpQjtBQUFBLE1BQzFDLENBQUMsS0FBSyxZQUFZLE1BQU0sUUFBUTtBQUFBLE1BQ2hDO0FBQUEsSUFDRjtBQUVBLFVBQU0saUJBQWlCLEtBQUssaUJBQWlCO0FBRTdDLFFBQUksY0FBYztBQUNsQixRQUFJLGtCQUFrQjtBQUV0QixlQUFXLFdBQVcsS0FBSyxrQkFBa0I7QUFDM0MsWUFBTSxRQUFRLE9BQU8sUUFBUSxLQUFLO0FBRWxDLFVBQUksQ0FBQyxPQUFPLE1BQU0sS0FBSyxHQUFHO0FBQ3hCLHVCQUFlLFFBQVEsUUFBUTtBQUMvQiwyQkFBbUIsUUFBUTtBQUFBLE1BQzdCO0FBQUEsSUFDRjtBQUVBLFVBQU0sZUFDSixrQkFBa0IsSUFDZCxjQUFjLGtCQUNkO0FBRU4sV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxXQUFXLFNBQStCO0FBQ3hDLFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUFBLE1BQ3JDLENBQUMsYUFBYSxTQUFTLFNBQVMsUUFBUTtBQUFBLElBQzFDO0FBRUEsUUFBSSxVQUFVO0FBQ1osZUFBUyxPQUFPO0FBQUEsSUFDbEIsT0FBTztBQUNMLFdBQUssaUJBQWlCLEtBQUs7QUFBQSxRQUN6QixNQUFNLFFBQVE7QUFBQSxRQUNkLE1BQU0sUUFBUTtBQUFBLFFBQ2QsS0FBSztBQUFBLFFBQ0wsT0FBTyxRQUFRO0FBQUEsUUFDZixJQUFJLFFBQVE7QUFBQSxRQUNaLElBQUksUUFBUTtBQUFBLE1BQ2QsQ0FBQztBQUFBLElBQ0g7QUFFQSxTQUFLLHVCQUF1QjtBQUM1QixTQUFLLHVCQUF1QjtBQUFBLEVBQzlCO0FBQUEsRUFFQSxNQUFNLGtCQUFpQztBQUNyQyxVQUFNLE9BQU8sS0FBSyxjQUFjLEtBQUs7QUFFckMsUUFBSSxDQUFDLE1BQU07QUFDVCxVQUFJLHdCQUFPLDZCQUE2QjtBQUN4QztBQUFBLElBQ0Y7QUFFQSxRQUFJO0FBQ0YsWUFBTSxLQUFLLGlCQUFpQixvQkFBb0IsS0FBSyxpQkFBaUIsQ0FBQztBQUV2RSxVQUFJLHdCQUFPLG9CQUFvQjtBQUMvQixXQUFLLE1BQU07QUFBQSxJQUNiLFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSwrQkFBK0IsS0FBSztBQUNsRCxVQUFJLHdCQUFPLDRDQUE0QztBQUFBLElBQ3pEO0FBQUEsRUFDRjtBQUNGOzs7QUxydkJBLElBQXFCLDZCQUFyQixjQUF3RCx3QkFBTztBQUFBLEVBQS9EO0FBQUE7QUF5REUsU0FBTyxNQUFNO0FBQUEsTUFDWCxnQkFBZ0IsTUFDWixLQUFLLGFBQWEsZUFBZTtBQUFBLElBQ3JDO0FBQUE7QUFBQSxFQXRERixNQUFNLFNBQXdCO0FBRTVCLFlBQVEsSUFBSSwrQkFBK0I7QUFFM0MsU0FBSyxlQUNILElBQUksYUFBYSxLQUFLLEdBQUc7QUFFM0IsU0FBSyxtQkFDSCxJQUFJLGlCQUFpQixLQUFLLEdBQUc7QUFFL0IsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLE1BQU07QUFDZCxZQUFJO0FBQUEsVUFDSixLQUFLO0FBQUEsVUFDTCxLQUFLO0FBQUEsVUFDTCxLQUFLO0FBQUEsUUFDUCxFQUFFLEtBQUs7QUFBQSxNQUNSO0FBQUEsSUFDRCxDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFFTixVQUFVLFlBQVk7QUFFcEIsY0FBTSxXQUNKLEtBQUssYUFBYSxlQUFlO0FBRW5DLGNBQU0sZUFBZSxTQUFTLENBQUM7QUFFL0IsY0FBTSxLQUFLLGlCQUNSLG9CQUFvQjtBQUFBLFVBQ25CLE1BQU07QUFBQSxVQUVOLFVBQVUsZUFDTixDQUFDO0FBQUEsWUFDQyxNQUFNLGFBQWE7QUFBQSxZQUNuQixNQUFNLGFBQWE7QUFBQSxZQUNuQixLQUFLO0FBQUEsVUFDUCxDQUFDLElBQ0QsQ0FBQztBQUFBLFFBQ1AsQ0FBQztBQUVILFlBQUksd0JBQU8sbUJBQW1CO0FBQUEsTUFDaEM7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFPQSxXQUFpQjtBQUNmLFlBQVEsSUFBSSxpQ0FBaUM7QUFBQSxFQUMvQztBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
