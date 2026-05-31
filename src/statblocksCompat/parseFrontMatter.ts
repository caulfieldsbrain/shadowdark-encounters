import { ParseResult, ShadowdarkMonster } from "./types";
import { normalizeMonster } from "./normalizeMonster";

export function parseFrontmatter(
  frontmatter: Record<string, unknown>
): ParseResult<ShadowdarkMonster> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!frontmatter || typeof frontmatter !== "object") {
    return {
      success: false,
      errors: ["No valid frontmatter found."],
      warnings
    };
  }

  const monster = normalizeMonster(frontmatter as Partial<ShadowdarkMonster>);

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