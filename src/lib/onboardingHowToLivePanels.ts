import type { DailyMemory, EchoType } from "@/lib/types";
import {
  onboardingDemoComposition,
  onboardingDemoEncounters,
} from "@/lib/onboardingDemoData";

export type HowToLivePanel = {
  id: string;
  chapter: string;
  body: string;
  emphasizeEchoType: EchoType;
  visualization: Pick<
    DailyMemory["visualization"],
    "seed" | "density" | "brightness" | "movement"
  >;
};

export const HOW_TO_LIVE_PANELS: HowToLivePanel[] = [
  {
    id: "day",
    chapter: "While the city moves",
    body: "Let Echo ride your ordinary hours. When another leans into range, the weave thickens—you need not trade words to share the weather of the room.",
    emphasizeEchoType: "bounce",
    visualization: {
      seed: 2104,
      density: 0.62,
      brightness: 0.82,
      movement: 0.52,
    },
  },
  {
    id: "night",
    chapter: "Where the nest receives",
    body: "Set Echo down like a cup. The day’s crossings settle into a single hush of sound, and a pale mirroring on glass—open whenever your hands are empty.",
    emphasizeEchoType: "shy",
    visualization: {
      seed: 8842,
      density: 0.38,
      brightness: 0.58,
      movement: 0.22,
    },
  },
  {
    id: "app",
    chapter: "What the glass remembers",
    body: "This day’s pour · older ripples kept side by side · and the place where their temperament breathes and their tune asks you to stay a moment longer.",
    emphasizeEchoType: "messy",
    visualization: {
      seed: 5510,
      density: 0.72,
      brightness: 0.7,
      movement: 0.38,
    },
  },
];

export function howToLiveCompositionEmphasis(
  type: EchoType,
): DailyMemory["composition"] {
  const base = onboardingDemoComposition;
  const voices = base.voices.map((v) => ({
    ...v,
    presence:
      v.echoType === type
        ? Math.min(1, v.presence + 0.32)
        : Math.max(0.08, v.presence * 0.42),
  }));
  const sum = voices.reduce((s, v) => s + v.presence, 0);
  return {
    ...base,
    voices: voices.map((v) => ({ ...v, presence: v.presence / sum })),
  };
}

export function howToLiveEncountersBiased(type: EchoType) {
  return onboardingDemoEncounters.slice(0, 6).map((e, i) => ({
    ...e,
    otherEchoType: i % 2 === 0 ? type : e.otherEchoType,
  }));
}
