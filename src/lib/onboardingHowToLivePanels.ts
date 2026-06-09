import { echoJourney } from "@/lib/uiPoetics";

export type HowToLivePanel = {
  id: string;
  chapter: string;
  body: string;
};

export const HOW_TO_LIVE_PANELS: HowToLivePanel[] = echoJourney.map(
  (step, index) => ({
    id: ["carry", "meet", "remember"][index]!,
    chapter: step.title,
    body: step.body,
  }),
);
