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
      id: "create-test-encounter",
      name: "Create Test Encounter",

      callback: async () => {

        const monsters =
          this.monsterIndex.getAllMonsters();

        const firstMonster = monsters[0];

        await this.encounterService
          .createEncounterNote({
            name: "Test Encounter",

            monsters: firstMonster
              ? [{
                  name: firstMonster.name,
                  path: firstMonster.path,
                  qty: 3
                }]
              : []
          });

        new Notice("Encounter created");
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