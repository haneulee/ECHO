import type { DailyMemory, Encounter } from "@/lib/types";
import { mockDailyMemory, mockEncounters } from "@/lib/mockData";

/** Canonical onboarding visuals (mirrors seeded demo until live data fills the app). */
export const onboardingDemoComposition: DailyMemory["composition"] =
  mockDailyMemory.composition;

export const onboardingDemoEncounters: Encounter[] =
  mockEncounters.slice(0, 6);

export const onboardingDemoVisualization: DailyMemory["visualization"] =
  mockDailyMemory.visualization;
