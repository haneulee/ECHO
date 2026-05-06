export type EchoType = "shy" | "messy" | "bounce";

export type ProximityZone = "far" | "near" | "close" | "very_close";

export type EchoDevice = {
  id: string;
  userId: string;
  serialNumber: string;
  echoName: string;
  echoType: EchoType;
  currentSoundProfileId: string;
  currentState: {
    melody: string[];
    brightness: number;
    calmness: number;
    densityBias: number;
    influences: {
      shy: number;
      messy: number;
      bounce: number;
    };
  };
  lastSyncedAt: string;
};

export type SoundProfile = {
  id: string;
  name: string;
  description: string;
  engineType: "tonejs" | "mozzi_pdresonant" | "sample" | "wavetable";
  scale: string;
  tempoBpm: number;
  globalParams: Record<string, unknown>;
};

export type SoundVoice = {
  id: string;
  soundProfileId: string;
  voiceName: string;
  role: "melody" | "bass" | "halo" | "texture" | "drone";
  engineParams: Record<string, unknown>;
  melodyRules: {
    mode: "melody_with_harmonic_expansion";
    melody: string[];
    harmony: Record<
      string,
      {
        fifth: string;
        octave: string;
        shimmer: string;
      }
    >;
  };
  distanceMapping: {
    far: { closeness: [number, number]; noteCount: number };
    near: { closeness: [number, number]; noteCount: number };
    close: { closeness: [number, number]; noteCount: number };
    veryClose: { closeness: [number, number]; noteCount: number };
  };
  mutationRules: {
    triggerZone: "very_close";
    minimumDurationSec: number;
    exchangeRatio: number;
    maxMutationsPerDay: number;
  };
};

export type Encounter = {
  id: string;
  deviceId: string;
  otherEchoHash: string;
  otherEchoType: EchoType;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  rssiAvg: number;
  rssiMin: number;
  rssiMax: number;
  proximityZone: ProximityZone;
  closenessAvg: number;
  soundProfileId: string;
};

export type DailyMemory = {
  id: string;
  userId: string;
  deviceId: string;
  date: string;
  soundProfileId: string;
  profileSnapshot: Record<string, unknown>;
  totalEncounters: number;
  totalDurationSec: number;
  dominantZone: ProximityZone;
  dominantEchoType: EchoType;
  composition: {
    style: string;
    tempoBpm: number;
    scale: string;
    voices: Array<{
      echoType: EchoType;
      presence: number;
      melody: string[];
      averageCloseness: number;
    }>;
  };
  visualization: {
    seed: number;
    density: number;
    brightness: number;
    movement: number;
  };
  createdAt: string;
};

export type EchoEvolution = {
  id: string;
  deviceId: string;
  dailyMemoryId: string;
  mutationType:
    | "melody_fragment_exchange"
    | "envelope_shift"
    | "brightness_shift";
  sourceEchoHash: string;
  trigger: {
    proximityZone: "very_close";
    durationSec: number;
    closenessAvg: number;
  };
  beforeState: {
    melody: string[];
    brightness: number;
    calmness: number;
    densityBias: number;
  };
  afterState: {
    melody: string[];
    brightness: number;
    calmness: number;
    densityBias: number;
  };
  borrowedFragment: {
    original: string[];
    transposed: string[];
    insertedAt: number;
  };
  createdAt: string;
};

export type MockUser = {
  id: string;
  name: string;
};
