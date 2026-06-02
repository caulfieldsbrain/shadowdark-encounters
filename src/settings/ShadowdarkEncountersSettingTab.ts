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
  }
}