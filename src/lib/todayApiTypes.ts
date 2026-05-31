import type { DailyMemory, EchoDevice, Encounter } from "@/lib/types";

export type TodayApiResponse = {
  encounters: Encounter[];
  dailyMemory: DailyMemory | null;
  device: EchoDevice | null;
  hasPrevPeriod: boolean;
  hasNextPeriod: boolean;
};
