import { echoTypeDescriptions, echoTypeLabels } from "@/lib/echoTypeMeta";
import type { DailyMemory, EchoType } from "@/lib/types";

export const ECHO_TYPE_PAGE_ORDER: EchoType[] = ["shy", "messy", "bounce"];

export type EchoTypePageSection = {
  title: string;
  body: string;
};

export type EchoTypePageContent = {
  type: EchoType;
  label: string;
  personality: EchoTypePageSection;
  sound: EchoTypePageSection;
  heroImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  visualization: Pick<
    DailyMemory["visualization"],
    "seed" | "density" | "brightness" | "movement"
  >;
};

export const echoTypePageContent: Record<EchoType, EchoTypePageContent> = {
  shy: {
    type: "shy",
    label: echoTypeLabels.shy,
    personality: {
      title: "Temperament",
      body: `${echoTypeDescriptions.shy} Shy holds back at first—quiet when alone, gently opening when warmth stays near long enough. It reads as tender company rather than loud presence.`,
    },
    sound: {
      title: "Sound",
      body: "A low G3 register with slow attacks and long decays. Notes arrive sparingly with wide spacing, leaving room between each gesture so proximity feels like invitation.",
    },
    heroImage: {
      src: "/assets/landing-echo-field-pair.png",
      alt: "Two Shy Echo companions resting together outdoors",
      width: 768,
      height: 1024,
    },
    visualization: { seed: 3140, density: 0.36, brightness: 0.72, movement: 0.2 },
  },
  messy: {
    type: "messy",
    label: echoTypeLabels.messy,
    personality: {
      title: "Temperament",
      body: `${echoTypeDescriptions.messy} Messy thrives when several companions overlap—curious, restless, and happiest when the air is full of crossing lines.`,
    },
    sound: {
      title: "Sound",
      body: "A bright E6 register with short attacks and quick decay. Rhythms cluster and tangle, turning group proximity into texture rather than one clean melody.",
    },
    heroImage: {
      src: "/assets/landing-echo-hand-pair.png",
      alt: "Messy Echo companions in pink and violet held in hand",
      width: 1280,
      height: 1024,
    },
    visualization: { seed: 912, density: 0.54, brightness: 0.58, movement: 0.28 },
  },
  bounce: {
    type: "bounce",
    label: echoTypeLabels.bounce,
    personality: {
      title: "Temperament",
      body: `${echoTypeDescriptions.bounce} Bounce orients toward bodies—social, forward, and always leaning into where companions gather.`,
    },
    sound: {
      title: "Sound",
      body: "A mid C4 register with confident spacing and a spring in each phrase. Closeness brings brighter harmonics and quicker call-and-response between nearby Echoes.",
    },
    heroImage: {
      src: "/assets/landing-echo-hand-pair.png",
      alt: "Bounce Echo companions in warm yellow and orange",
      width: 1280,
      height: 1024,
    },
    visualization: { seed: 4286, density: 0.68, brightness: 0.74, movement: 0.42 },
  },
};

export function echoTypePagePath(type: EchoType): string {
  return `/${type}`;
}

export function echoTypePrimaryColor(type: EchoType): string {
  const colors: Record<EchoType, string> = {
    shy: "#6ECDE8",
    messy: "#F39AC1",
    bounce: "#FFE36E",
  };
  return colors[type];
}
