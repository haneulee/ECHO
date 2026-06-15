import { defaultStateForType } from "./echoDeviceDefaults";
import { peerEchoHash, peersForOwner } from "./mockPeerEchoes";
import type {
  DailyMemory,
  EchoDevice,
  EchoEvolution,
  Encounter,
  MockUser,
  SoundProfile,
  SoundVoice,
} from "./types";

export { echoTypeDescriptions, echoTypeLabels } from "./echoTypeMeta";

export const mockUser: MockUser = {
  id: "user_haneul",
  name: "Haneul",
};

export const mockEchoDevice: EchoDevice = {
  id: "ECHO_SHY_001",
  userId: mockUser.id,
  serialNumber: "ECHO_SHY_001",
  echoName: "Namu",
  echoColor: "#8FE6C4",
  firmwareModelName: "ECHO_SHY_001",
  echoType: "shy",
  currentSoundProfileId: "ambient3_meditation_v1",
  currentState: defaultStateForType("shy"),
  lastSyncedAt: "2026-05-06T20:48:00+09:00",
};

export const mockSoundProfile: SoundProfile = {
  id: "ambient3_meditation_v1",
  name: "Meditation Strings",
  description:
    "Long phrases that drink color from whoever stands close—distance paints, it does not shout.",
  engineType: "tonejs",
  scale: "A minor pentatonic",
  tempoBpm: 52,
  globalParams: {
    reverbDecay: 9,
    release: 4.5,
    waveform: "triangle",
  },
};

function makeHarmony(melody: string[]) {
  const fifths: Record<string, string> = {
    A2: "E3",
    D3: "A3",
    E3: "B3",
    G3: "D4",
    C4: "G4",
    D4: "A4",
    E4: "B4",
    G4: "D5",
    A4: "E5",
    C5: "G5",
  };
  const octaves: Record<string, string> = {
    A2: "A3",
    D3: "D4",
    E3: "E4",
    G3: "G4",
    C4: "C5",
    D4: "D5",
    E4: "E5",
    G4: "G5",
    A4: "A5",
    C5: "C6",
  };
  const shimmers: Record<string, string> = {
    A2: "C4",
    D3: "E4",
    E3: "G4",
    G3: "A4",
    C4: "E5",
    D4: "G5",
    E4: "A5",
    G4: "C6",
    A4: "D6",
    C5: "E6",
  };

  return Object.fromEntries(
    melody.map((note) => [
      note,
      {
        fifth: fifths[note] ?? note,
        octave: octaves[note] ?? note,
        shimmer: shimmers[note] ?? note,
      },
    ]),
  );
}

const distanceMapping: SoundVoice["distanceMapping"] = {
  far: { closeness: [0, 0.33], noteCount: 1 },
  near: { closeness: [0.33, 0.66], noteCount: 2 },
  close: { closeness: [0.66, 0.85], noteCount: 3 },
  veryClose: { closeness: [0.85, 1], noteCount: 4 },
};

function makeVoice(
  id: string,
  voiceName: string,
  role: SoundVoice["role"],
  melody: string[],
): SoundVoice {
  return {
    id,
    soundProfileId: mockSoundProfile.id,
    voiceName,
    role,
    engineParams: {
      oscillator: role === "bass" ? "sine" : "triangle",
      attack: 0.9,
      release: role === "bass" ? 5.5 : 4.2,
      reverbSend: 0.82,
    },
    melodyRules: {
      mode: "melody_with_harmonic_expansion",
      melody,
      harmony: makeHarmony(melody),
    },
    distanceMapping,
    mutationRules: {
      triggerZone: "very_close",
      minimumDurationSec: 180,
      exchangeRatio: 0.25,
      maxMutationsPerDay: 2,
    },
  };
}

export const mockSoundVoices: SoundVoice[] = [
  makeVoice("voice_shy", "Shy", "melody", [
    "E4",
    "G4",
    "A4",
    "C5",
    "A4",
    "G4",
    "E4",
    "D4",
  ]),
  makeVoice("voice_messy", "Messy", "bass", [
    "A2",
    "E3",
    "G3",
    "E3",
    "D3",
    "E3",
  ]),
  makeVoice("voice_bounce", "Bounce", "halo", [
    "C4",
    "D4",
    "E4",
    "G4",
    "E4",
    "D4",
    "C4",
  ]),
];

const MOCK_ENCOUNTER_SLOTS = [
  {
    start: "08:18:00",
    end: "08:28:00",
    durationSec: 612,
    proximityZone: "close" as const,
    closenessAvg: 0.74,
    rssiAvg: -61,
    rssiMin: -72,
    rssiMax: -49,
  },
  {
    start: "11:44:00",
    end: "11:49:00",
    durationSec: 286,
    proximityZone: "near" as const,
    closenessAvg: 0.55,
    rssiAvg: -68,
    rssiMin: -76,
    rssiMax: -58,
  },
  {
    start: "15:02:00",
    end: "15:14:00",
    durationSec: 721,
    proximityZone: "very_close" as const,
    closenessAvg: 0.91,
    rssiAvg: -44,
    rssiMin: -53,
    rssiMax: -36,
  },
  {
    start: "18:31:00",
    end: "18:34:00",
    durationSec: 180,
    proximityZone: "far" as const,
    closenessAvg: 0.27,
    rssiAvg: -77,
    rssiMin: -84,
    rssiMax: -70,
  },
  {
    start: "19:12:00",
    end: "19:21:00",
    durationSec: 548,
    proximityZone: "close" as const,
    closenessAvg: 0.79,
    rssiAvg: -52,
    rssiMin: -64,
    rssiMax: -42,
  },
  {
    start: "20:34:00",
    end: "20:47:00",
    durationSec: 774,
    proximityZone: "very_close" as const,
    closenessAvg: 0.94,
    rssiAvg: -41,
    rssiMin: -49,
    rssiMax: -34,
  },
  {
    start: "20:02:00",
    end: "20:06:00",
    durationSec: 232,
    proximityZone: "near" as const,
    closenessAvg: 0.48,
    rssiAvg: -70,
    rssiMin: -80,
    rssiMax: -61,
  },
  {
    start: "21:08:00",
    end: "21:11:00",
    durationSec: 166,
    proximityZone: "far" as const,
    closenessAvg: 0.22,
    rssiAvg: -82,
    rssiMin: -88,
    rssiMax: -74,
  },
  {
    start: "09:22:00",
    end: "09:31:00",
    durationSec: 540,
    proximityZone: "close" as const,
    closenessAvg: 0.68,
    rssiAvg: -58,
    rssiMin: -66,
    rssiMax: -48,
  },
  {
    start: "16:40:00",
    end: "16:52:00",
    durationSec: 720,
    proximityZone: "near" as const,
    closenessAvg: 0.62,
    rssiAvg: -63,
    rssiMin: -71,
    rssiMax: -55,
  },
];

function buildMockEncountersForDay(date: string, count: number): Encounter[] {
  const peers = peersForOwner(mockEchoDevice.firmwareModelName ?? "ECHO_SHY_001");
  return Array.from({ length: count }, (_, index) => {
    const peer = peers[index % peers.length]!;
    const slot = MOCK_ENCOUNTER_SLOTS[index % MOCK_ENCOUNTER_SLOTS.length]!;
    const profile = defaultStateForType(peer.echoType);
    return {
      id: `enc_${String(index + 1).padStart(2, "0")}`,
      deviceId: mockEchoDevice.id,
      otherEchoHash: peerEchoHash(peer.firmwareModelName),
      otherEchoModelName: peer.firmwareModelName,
      otherEchoName: peer.echoName,
      otherEchoColor: peer.echoColor,
      otherEchoType: peer.echoType,
      startedAt: `${date}T${slot.start}+09:00`,
      endedAt: `${date}T${slot.end}+09:00`,
      durationSec: slot.durationSec,
      rssiAvg: slot.rssiAvg,
      rssiMin: slot.rssiMin,
      rssiMax: slot.rssiMax,
      proximityZone: slot.proximityZone,
      closenessAvg: slot.closenessAvg,
      soundProfileId: mockSoundProfile.id,
      otherEchoProfileSnapshot: {
        melodySemi: profile.melodySemi,
        brightness: profile.brightness,
        calmness: profile.calmness,
        densityBias: profile.densityBias,
      },
      otherEchoSonicSource: "ble_adv" as const,
    };
  });
}

export const mockEncounters: Encounter[] = buildMockEncountersForDay(
  "2026-05-06",
  10,
);

export const mockDailyMemory: DailyMemory = {
  id: "memory_2026_05_06",
  userId: mockUser.id,
  deviceId: mockEchoDevice.id,
  date: "2026-05-06",
  soundProfileId: mockSoundProfile.id,
  profileSnapshot: mockEchoDevice.currentState,
  totalEncounters: mockEncounters.length,
  totalDurationSec: mockEncounters.reduce(
    (sum, encounter) => sum + encounter.durationSec,
    0,
  ),
  dominantZone: "close",
  dominantEchoType: "bounce",
  composition: {
    style: "Ambient proximity meditation",
    tempoBpm: 52,
    scale: "A minor pentatonic",
    voices: [
      {
        echoType: "shy",
        presence: 0.36,
        melody: ["E4", "G4", "A4", "C5"],
        averageCloseness: 0.91,
      },
      {
        echoType: "messy",
        presence: 0.2,
        melody: ["A2", "E3", "G3"],
        averageCloseness: 0.55,
      },
      {
        echoType: "bounce",
        presence: 0.44,
        melody: ["C4", "D4", "E4", "G4"],
        averageCloseness: 0.61,
      },
    ],
  },
  visualization: {
    seed: 4286,
    density: 0.68,
    brightness: 0.74,
    movement: 0.42,
  },
  createdAt: "2026-05-06T21:04:00+09:00",
};

export const mockArchive: DailyMemory[] = [
  mockDailyMemory,
  {
    ...mockDailyMemory,
    id: "memory_2026_05_05",
    date: "2026-05-05",
    totalEncounters: 9,
    totalDurationSec: 2512,
    dominantZone: "near",
    dominantEchoType: "messy",
    visualization: {
      seed: 912,
      density: 0.54,
      brightness: 0.58,
      movement: 0.28,
    },
  },
  {
    ...mockDailyMemory,
    id: "memory_2026_05_04",
    date: "2026-05-04",
    totalEncounters: 5,
    totalDurationSec: 1030,
    dominantZone: "far",
    dominantEchoType: "shy",
    visualization: {
      seed: 3140,
      density: 0.36,
      brightness: 0.72,
      movement: 0.2,
    },
  },
];

export const mockEvolutions: EchoEvolution[] = [
  {
    id: "evo_01",
    deviceId: mockEchoDevice.id,
    dailyMemoryId: mockDailyMemory.id,
    mutationType: "melody_fragment_exchange",
    sourceEchoHash: mockEncounters[2]?.otherEchoHash ?? "echo:0000",
    trigger: {
      proximityZone: "very_close",
      durationSec: 721,
      closenessAvg: 0.91,
    },
    beforeState: {
      melodySemi: [0, 3, 5, 7, 5, 3, 0, 0],
      melody: ["G3", "A#3", "C4", "D4", "C4", "A#3", "G3", "G3"],
      brightness: 0.62,
      calmness: 0.84,
      densityBias: 0.38,
    },
    afterState: mockEchoDevice.currentState,
    borrowedFragment: {
      original: [0, 1],
      transposed: [1, 1],
      insertedAt: 2,
    },
    createdAt: "2026-05-06T21:04:00+09:00",
  },
];
