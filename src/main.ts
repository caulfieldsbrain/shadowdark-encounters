import { Notice, Plugin } from "obsidian";

import { MonsterIndex } from "./services/MonsterIndex";
import { EncounterService } from "./services/EncounterService";
import { CreateEncounterModal } from "./modals/CreateEncounterModal";

import { EncounterRenderer } from "./renderers/EncounterRenderer";

import {
  ShadowdarkEncountersSettings,
  DEFAULT_SETTINGS
} from "./settings";

import { ShadowdarkEncountersSettingTab }
  from "./settings/ShadowdarkEncountersSettingTab";

import { EncounterIndex } from "./services/EncounterIndex";

import { EncounterBrowserModal } from "./modals/EncounterBrowserModal";

export default class ShadowdarkEncountersPlugin extends Plugin {

  settings!: ShadowdarkEncountersSettings;

  monsterIndex!: MonsterIndex;

  encounterService!: EncounterService;

  encounterRenderer!: EncounterRenderer;

  encounterIndex!: EncounterIndex;

  async onload(): Promise<void> {

    console.log("Loading Shadowdark Encounters");

    await this.loadSettings();

    this.addSettingTab(
      new ShadowdarkEncountersSettingTab(
        this.app,
        this
      )
    );

    this.monsterIndex = 
      new MonsterIndex(this.app);

    this.encounterService =
      new EncounterService(this.app);

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
        const frontmatter = cache?.frontmatter;

        if (frontmatter?.shadowdarkType !== "encounter") {
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
        const frontmatter = cache?.frontmatter;

        if (frontmatter?.shadowdarkType !== "encounter") {
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

  public api = {
    getAllMonsters: () =>
        this.monsterIndex.getAllMonsters()
    };

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  onunload(): void {
    console.log("Unloading Shadowdark Encounters");
  }
}