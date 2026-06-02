import { EncounterInitiativeMode } from "./types/encounters";

export interface ShadowdarkEncountersSettings {
  encounterFolder: string;
  defaultPartyLevel: number;
  defaultPartySize: number;
  defaultInitiativeMode: EncounterInitiativeMode;
  showDifficulty: boolean;
  showInitiative: boolean;
}

export const DEFAULT_SETTINGS: ShadowdarkEncountersSettings = {
  encounterFolder: "Encounters",
  defaultPartyLevel: 1,
  defaultPartySize: 4,
  defaultInitiativeMode: "shadowdark_raw",
  showDifficulty: true,
  showInitiative: true
};