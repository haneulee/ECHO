import type { DailyMemory, EchoType } from "@/lib/types";
import { mockDailyMemory, mockEncounters } from "@/lib/mockData";

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
    chapter: "Day",
    body: "Wear Echo while you move. When another Echo is nearby, yours borrows their melody—distance shapes harmonics, not volume.",
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
    chapter: "Night",
    body: "Dock Echo on the Station. It uploads the day's encounters and turns them into a single sound memory you can open in the app.",
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
    chapter: "App",
    body: "Open Today for the latest memory, Archive for past days, and My Echo to tune personality and hear your melody.",
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
  const base = mockDailyMemory.composition;
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
  return mockEncounters.slice(0, 6).map((e, i) => ({
    ...e,
    otherEchoType: i % 2 === 0 ? type : e.otherEchoType,
  }));
}
