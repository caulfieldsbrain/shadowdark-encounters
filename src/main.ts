import { Notice, Plugin } from "obsidian";

import { MonsterIndex } from "./services/MonsterIndex";
import { EncounterService } from "./services/EncounterService";
import { CreateEncounterModal } from "./modals/CreateEncounterModal";

import { EncounterRenderer } from "./renderers/EncounterRenderer";

export default class ShadowdarkEncountersPlugin extends Plugin {

  monsterIndex!: MonsterIndex;

  encounterService!: EncounterService;

  encounterRenderer!: EncounterRenderer;

  async onload(): Promise<void> {

    console.log("Loading Shadowdark Encounters");

    this.monsterIndex =
      new MonsterIndex(this.app);

    this.encounterService =
      new EncounterService(this.app);

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
        const frontmatter = cache?.frontmatter;

        if (frontmatter?.shadowdarkType !== "encounter") {
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
        const frontmatter = cache?.frontmatter;

        if (frontmatter?.shadowdarkType !== "encounter") {
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

  public api = {
    getAllMonsters: () =>
        this.monsterIndex.getAllMonsters()
    };

  onunload(): void {
    console.log("Unloading Shadowdark Encounters");
  }
}