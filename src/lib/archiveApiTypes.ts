import type { DailyMemory, Encounter } from "@/lib/types";

export type ArchiveApiResponse = {
  items: { memory: DailyMemory; encounters: Encounter[] }[];
};
