import { mockEchoDevice, mockEvolutions } from "@/lib/mockData";
import type { EchoDevice, EchoEvolution } from "@/lib/types";

export const localMockEchoDevice: EchoDevice = {
  ...mockEchoDevice,
  id: "ECHO_BOUNCE_001",
  serialNumber: "ECHO_BOUNCE_001",
  echoName: "Sweet Potato",
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

export const localMockEvolutions: EchoEvolution[] = mockEvolutions.map(
  (evolution) => ({
    ...evolution,
    deviceId: localMockEchoDevice.id,
    sourceEchoType: localMockEchoDevice.echoType,
    beforeState: {
      melody: ["C5", "E5", "G5", "E5", "D5", "C5", "D5", "E5"],
      brightness: 0.62,
      calmness: 0.58,
      densityBias: 0.52,
    },
    afterState: localMockEchoDevice.currentState,
    borrowedFragment: {
      original: ["G5", "E5"],
      transposed: ["A5", "G5"],
      insertedAt: 3,
    },
  }),
);
