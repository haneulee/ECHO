import type { DailyMemory, Encounter } from "@/lib/types";

export type TodayApiResponse = {
  encounters: Encounter[];
  dailyMemory: DailyMemory | null;
};
