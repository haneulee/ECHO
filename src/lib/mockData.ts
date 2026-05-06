import type {
  DailyMemory,
  EchoDevice,
  EchoEvolution,
  EchoType,
  Encounter,
  MockUser,
  SoundProfile,
  SoundVoice,
} from "./types";

export const mockUser: MockUser = {
  id: "user_haneul",
  name: "Haneul",
};

export const echoTypeLabels: Record<EchoType, string> = {
  light: "Light String",
  deep: "Deep String",
  halo: "Halo String",
};

export const echoTypeDescriptions: Record<EchoType, string> = {
  light: "Upper melodic voice",
  deep: "Grounding low voice",
  halo: "Floating response voice",
};

export const mockEchoDevice: EchoDevice = {
  id: "echo_namu_001",
  userId: mockUser.id,
  serialNumber: "ECHO-LS-0428",
  echoName: "Namu",
  echoType: "light",
  currentSoundProfileId: "ambient3_meditation_v1",
  currentState: {
    melody: ["E4", "G4", "A4", "C5", "D5", "A4", "G4", "E4"],
    brightness: 0.68,
    calmness: 0.82,
    densityBias: 0.44,
    influences: {
      light: 0.46,
      deep: 0.22,
      halo: 0.32,
    },
  },
  lastSyncedAt: "2026-05-06T20:48:00+09:00",
};

export const mockSoundProfile: SoundProfile = {
  id: "ambient3_meditation_v1",
  name: "Meditation Strings",
  description:
    "Slow melodic fragments that gain harmonic density through proximity.",
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
  makeVoice(
    "voice_light_string",
    "Light String",
    "melody",
    ["E4", "G4", "A4", "C5", "A4", "G4", "E4", "D4"],
  ),
  makeVoice(
    "voice_deep_string",
    "Deep String",
    "bass",
    ["A2", "E3", "G3", "E3", "D3", "E3"],
  ),
  makeVoice(
    "voice_halo_string",
    "Halo String",
    "halo",
    ["C4", "D4", "E4", "G4", "E4", "D4", "C4"],
  ),
];

export const mockEncounters: Encounter[] = [
  {
    id: "enc_01",
    deviceId: mockEchoDevice.id,
    otherEchoHash: "echo:74a9",
    otherEchoType: "halo",
    startedAt: "2026-05-06T08:18:00+09:00",
    endedAt: "2026-05-06T08:28:00+09:00",
    durationSec: 612,
    rssiAvg: -61,
    rssiMin: -72,
    rssiMax: -49,
    proximityZone: "close",
    closenessAvg: 0.74,
    soundProfileId: mockSoundProfile.id,
  },
  {
    id: "enc_02",
    deviceId: mockEchoDevice.id,
    otherEchoHash: "echo:1bc2",
    otherEchoType: "deep",
    startedAt: "2026-05-06T11:44:00+09:00",
    endedAt: "2026-05-06T11:49:00+09:00",
    durationSec: 286,
    rssiAvg: -68,
    rssiMin: -76,
    rssiMax: -58,
    proximityZone: "near",
    closenessAvg: 0.55,
    soundProfileId: mockSoundProfile.id,
  },
  {
    id: "enc_03",
    deviceId: mockEchoDevice.id,
    otherEchoHash: "echo:8e10",
    otherEchoType: "light",
    startedAt: "2026-05-06T15:02:00+09:00",
    endedAt: "2026-05-06T15:14:00+09:00",
    durationSec: 721,
    rssiAvg: -44,
    rssiMin: -53,
    rssiMax: -36,
    proximityZone: "very_close",
    closenessAvg: 0.91,
    soundProfileId: mockSoundProfile.id,
  },
  {
    id: "enc_04",
    deviceId: mockEchoDevice.id,
    otherEchoHash: "echo:502f",
    otherEchoType: "halo",
    startedAt: "2026-05-06T18:31:00+09:00",
    endedAt: "2026-05-06T18:34:00+09:00",
    durationSec: 180,
    rssiAvg: -77,
    rssiMin: -84,
    rssiMax: -70,
    proximityZone: "far",
    closenessAvg: 0.27,
    soundProfileId: mockSoundProfile.id,
  },
  {
    id: "enc_05",
    deviceId: mockEchoDevice.id,
    otherEchoHash: "echo:29fd",
    otherEchoType: "deep",
    startedAt: "2026-05-06T19:12:00+09:00",
    endedAt: "2026-05-06T19:21:00+09:00",
    durationSec: 548,
    rssiAvg: -52,
    rssiMin: -64,
    rssiMax: -42,
    proximityZone: "close",
    closenessAvg: 0.79,
    soundProfileId: mockSoundProfile.id,
  },
  {
    id: "enc_06",
    deviceId: mockEchoDevice.id,
    otherEchoHash: "echo:c14b",
    otherEchoType: "light",
    startedAt: "2026-05-06T20:02:00+09:00",
    endedAt: "2026-05-06T20:06:00+09:00",
    durationSec: 232,
    rssiAvg: -70,
    rssiMin: -80,
    rssiMax: -61,
    proximityZone: "near",
    closenessAvg: 0.48,
    soundProfileId: mockSoundProfile.id,
  },
  {
    id: "enc_07",
    deviceId: mockEchoDevice.id,
    otherEchoHash: "echo:91aa",
    otherEchoType: "halo",
    startedAt: "2026-05-06T20:34:00+09:00",
    endedAt: "2026-05-06T20:47:00+09:00",
    durationSec: 774,
    rssiAvg: -41,
    rssiMin: -49,
    rssiMax: -34,
    proximityZone: "very_close",
    closenessAvg: 0.94,
    soundProfileId: mockSoundProfile.id,
  },
  {
    id: "enc_08",
    deviceId: mockEchoDevice.id,
    otherEchoHash: "echo:6e31",
    otherEchoType: "light",
    startedAt: "2026-05-06T21:08:00+09:00",
    endedAt: "2026-05-06T21:11:00+09:00",
    durationSec: 166,
    rssiAvg: -82,
    rssiMin: -88,
    rssiMax: -74,
    proximityZone: "far",
    closenessAvg: 0.22,
    soundProfileId: mockSoundProfile.id,
  },
];

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
  dominantEchoType: "halo",
  memoryPhrase: "Namu kept a pale ring of voices from the afternoon.",
  composition: {
    style: "Ambient proximity meditation",
    tempoBpm: 52,
    scale: "A minor pentatonic",
    voices: [
      {
        echoType: "light",
        presence: 0.36,
        melody: ["E4", "G4", "A4", "C5"],
        averageCloseness: 0.91,
      },
      {
        echoType: "deep",
        presence: 0.2,
        melody: ["A2", "E3", "G3"],
        averageCloseness: 0.55,
      },
      {
        echoType: "halo",
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
    totalEncounters: 7,
    totalDurationSec: 2512,
    dominantZone: "near",
    dominantEchoType: "deep",
    memoryPhrase: "A low blue thread stayed beside Namu after rain.",
    visualization: { seed: 912, density: 0.54, brightness: 0.58, movement: 0.28 },
  },
  {
    ...mockDailyMemory,
    id: "memory_2026_05_04",
    date: "2026-05-04",
    totalEncounters: 3,
    totalDurationSec: 1030,
    dominantZone: "far",
    dominantEchoType: "light",
    memoryPhrase: "Only a few yellow notes crossed the morning room.",
    visualization: { seed: 3140, density: 0.36, brightness: 0.72, movement: 0.2 },
  },
];

export const mockEvolutions: EchoEvolution[] = [
  {
    id: "evo_01",
    deviceId: mockEchoDevice.id,
    dailyMemoryId: mockDailyMemory.id,
    mutationType: "melody_fragment_exchange",
    sourceEchoHash: "echo:8e10",
    trigger: {
      proximityZone: "very_close",
      durationSec: 721,
      closenessAvg: 0.91,
    },
    beforeState: {
      melody: ["E4", "G4", "A4", "C5", "A4", "G4", "E4", "D4"],
      brightness: 0.62,
      calmness: 0.84,
      densityBias: 0.38,
    },
    afterState: mockEchoDevice.currentState,
    borrowedFragment: {
      original: ["C5", "D5"],
      transposed: ["D5", "A4"],
      insertedAt: 4,
    },
    createdAt: "2026-05-06T21:04:00+09:00",
  },
];
