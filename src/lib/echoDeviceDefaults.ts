import type { EchoType } from "@/lib/types";

export function defaultStateForType(t: EchoType) {
  const base = {
    melody: ["E4", "G4", "A4", "C5", "D5", "A4", "G4", "E4"] as string[],
    brightness: 0.65,
    calmness: 0.72,
    densityBias: 0.48,
    influences: { shy: 0.33, messy: 0.33, bounce: 0.34 },
  };
  if (t === "shy") {
    base.influences = { shy: 0.55, messy: 0.22, bounce: 0.23 };
  } else if (t === "messy") {
    base.influences = { shy: 0.22, messy: 0.55, bounce: 0.23 };
  } else {
    base.influences = { shy: 0.23, messy: 0.22, bounce: 0.55 };
  }
  return base;
}
