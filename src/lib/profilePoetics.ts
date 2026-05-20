import type { EchoType } from "./types";

/** Compact local-ish timestamp for profile presence. */
export function vaguePresenceFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Echo archetype → ecology temperament label (visual personality). */
export const echoTemperamentEcology: Record<EchoType, string> = {
  shy: "Drift",
  messy: "Ripple",
  bounce: "Bloom",
};
