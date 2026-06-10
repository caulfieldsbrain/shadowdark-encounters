import {
  App,
  PluginSettingTab,
  Setting
} from "obsidian";

import ShadowdarkEncountersPlugin from "../main";

export class ShadowdarkEncountersSettingTab extends PluginSettingTab {
  plugin: ShadowdarkEncountersPlugin;

  constructor(
    app: App,
    plugin: ShadowdarkEncountersPlugin
  ) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", {
      text: "Shadowdark Encounters Settings"
    });

    new Setting(containerEl)
      .setName("Encounter Folder")
      .setDesc("Folder where encounter notes are created.")
      .addText((text) =>
        text
          .setPlaceholder("Encounters")
          .setValue(this.plugin.settings.encounterFolder)
          .onChange(async (value) => {
            this.plugin.settings.encounterFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default Party Level")
      .addText((text) =>
        text
          .setValue(
            String(this.plugin.settings.defaultPartyLevel)
          )
          .onChange(async (value) => {
            this.plugin.settings.defaultPartyLevel =
              Number(value) || 1;

            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default Party Size")
      .addText((text) =>
        text
          .setValue(
            String(this.plugin.settings.defaultPartySize)
          )
          .onChange(async (value) => {
            this.plugin.settings.defaultPartySize =
              Number(value) || 4;

            await this.plugin.saveSettings();
          })
      );

      new Setting(containerEl)
        .setName("Default Initiative Mode")
        .setDesc("Choose how new encounters generate initiative.")
        .addDropdown((dropdown) =>
          dropdown
            .addOption("shadowdark_raw", "Shadowdark RAW")
            .addOption("individual_monsters", "Individual Monsters")
            .addOption("none", "None")
            .setValue(this.plugin.settings.defaultInitiativeMode)
            .onChange(async (value) => {
              this.plugin.settings.defaultInitiativeMode =
                value as any;

              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Show Difficulty Rating")
        .setDesc("Display encounter difficulty in the rendered encounter card.")
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.showDifficulty)
            .onChange(async (value) => {
              this.plugin.settings.showDifficulty = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Show Initiative Tracker")
        .setDesc("Display initiative in the rendered encounter card.")
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.showInitiative)
            .onChange(async (value) => {
              this.plugin.settings.showInitiative = value;
              await this.plugin.saveSettings();
            })
        );
    }
}