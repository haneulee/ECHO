import type { EchoType } from "./types";

/** Vague, sensory time-of-day language — avoids clocks and syncing vocabulary. */
export function vaguePresenceFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "The air stayed patient.";

  const h = d.getHours();
  if (h < 5) return "Night kept its veil intact.";
  if (h < 12) return "Morning arrived without insistence.";
  if (h < 17) return "The middle hours softened distance.";
  if (h < 21) return "Before dusk, something leaned closer.";
  return "Dark folded slowly inward.";
}

/** Echo archetype → ecology temperament label (visual personality). */
export const echoTemperamentEcology: Record<EchoType, string> = {
  shy: "Drift",
  messy: "Ripple",
  bounce: "Bloom",
};
