export interface ShadowdarkStatblocksSettings {
  compactMode: boolean;
  showSource: boolean;
  showTags: boolean;
  enableDiceRollerIntegration: boolean;
}

export const DEFAULT_STATBLOCK_RENDER_SETTINGS: ShadowdarkStatblocksSettings = {
  compactMode: true,
  showSource: true,
  showTags: true,
  enableDiceRollerIntegration: false
};