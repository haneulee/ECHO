import type { DailyMemory, EchoDevice, Encounter } from "@/lib/types";

export type ArchiveApiResponse = {
  device: EchoDevice | null;
  items: { memory: DailyMemory; encounters: Encounter[] }[];
};
