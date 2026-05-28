import { getEchoColorPalette } from "@/lib/visualRules";
import type { Encounter } from "@/lib/types";

export function encounterDisplayName(encounter: Encounter): string {
  const registeredName = encounter.otherEchoName?.trim();
  if (registeredName) return registeredName;
  if (encounter.otherEchoModelName?.trim()) return encounter.otherEchoModelName.trim();
  return `Echo ${encounter.otherEchoHash.replace(/^echo:/, "")}`;
}

export function encounterDisplayColor(encounter: Encounter): string {
  const registeredColor = encounter.otherEchoColor?.trim();
  if (registeredColor) return registeredColor;
  return getEchoColorPalette(encounter.otherEchoType)[1];
}

export function encounterDisplayPalette(encounter: Encounter): string[] {
  const registeredColor = encounter.otherEchoColor?.trim();
  if (!registeredColor) return getEchoColorPalette(encounter.otherEchoType);
  return [registeredColor, registeredColor, registeredColor];
}
