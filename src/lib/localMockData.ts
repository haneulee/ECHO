import { mockEchoDevice } from "@/lib/mockData";
import type { EchoDevice } from "@/lib/types";

export const localMockEchoDevice: EchoDevice = {
  ...mockEchoDevice,
  id: "ECHO_BOUNCE_001",
  serialNumber: "ECHO_BOUNCE_001",
  echoName: "Boing Ping",
  echoType: "bounce",
  currentState: {
    melody: ["C5", "E5", "G5", "A5", "G5", "E5", "D5", "C5"],
    brightness: 0.76,
    calmness: 0.46,
    densityBias: 0.68,
    influences: { shy: 0.21, messy: 0.21, bounce: 0.58 },
  },
  lastSyncedAt: "2026-05-20T14:45:00.000Z",
};
