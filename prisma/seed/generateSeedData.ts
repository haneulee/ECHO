import { DateTime } from "luxon";
import type { EchoType, ProximityZone } from "@prisma/client";

import { defaultStateForType } from "../../src/lib/echoDeviceDefaults";
import { factoryStateForType, melodyNotesFromSemi } from "../../src/lib/echoFactoryProfile";
import {
  peerEchoHash,
  peersForOwner,
  type MockPeerEcho,
} from "../../src/lib/mockPeerEchoes";
import { factoryPeerProfileSnapshot } from "../../src/lib/peerSonicSnapshot";
import { mockSoundProfile } from "../../src/lib/mockData";

export const SEED_PASSWORD = "echoecho";
export const SEED_TIME_ZONE = "Europe/Zurich";
/** Always rich mock data on these calendar days (YYYY-MM-DD in seed timezone). */
export const PINNED_SHOWCASE_DATES = [
  "2026-06-18",
  "2026-06-19",
  "2026-06-22",
] as const;

export type SeedUserTier = "power" | "small";

export type SeedUserSpec = {
  id: string;
  name: string;
  tier: SeedUserTier;
  device: {
    id: string;
    serialNumber: string;
    echoName: string;
    echoColor: string;
    firmwareModelName: string;
    echoType: EchoType;
  };
};

/** One account per canonical firmware unit — ECHO_SHY_001, ECHO_BOUNCE_001, ECHO_MESSY_001 only. */
export const SEED_USERS: SeedUserSpec[] = [
  {
    id: "user_haneul",
    name: "Haneul",
    tier: "power",
    device: {
      id: "ECHO_SHY_001",
      serialNumber: "ECHO_SHY_001",
      echoName: "Namu",
      echoColor: "#8FE6C4",
      firmwareModelName: "ECHO_SHY_001",
      echoType: "shy",
    },
  },
  {
    id: "user_mira",
    name: "Mira",
    tier: "power",
    device: {
      id: "ECHO_BOUNCE_001",
      serialNumber: "ECHO_BOUNCE_001",
      echoName: "Spring Sky",
      echoColor: "#FFE36E",
      firmwareModelName: "ECHO_BOUNCE_001",
      echoType: "bounce",
    },
  },
  {
    id: "user_jin",
    name: "Jin",
    tier: "power",
    device: {
      id: "ECHO_MESSY_001",
      serialNumber: "ECHO_MESSY_001",
      echoName: "Happy Spill",
      echoColor: "#FF9F6E",
      firmwareModelName: "ECHO_MESSY_001",
      echoType: "messy",
    },
  },
];

const PROXIMITY_ZONES: ProximityZone[] = ["far", "near", "close", "very_close"];

function peerSnapshot(type: EchoType) {
  return factoryPeerProfileSnapshot(type);
}

function appendShyCumulativeEvolutions(
  evolutions: GeneratedEvolution[],
  memoryId: string,
  createdAt: Date,
) {
  const shyFactory = factoryStateForType("shy");
  const afterMessySemi = [0, 3, 1, 7, 5, 3, 0, 0] as const;
  const afterMessy = {
    melodySemi: [...afterMessySemi],
    melody: melodyNotesFromSemi("shy", [...afterMessySemi]),
    brightness: 0.39,
    calmness: 0.9,
    densityBias: 0.28,
  };
  const finalSemi = [0, 3, 1, 6, 5, 4, 0, 0] as const;
  const finalState = {
    melodySemi: [...finalSemi],
    melody: melodyNotesFromSemi("shy", [...finalSemi]),
    brightness: 0.41,
    calmness: 0.84,
    densityBias: 0.33,
    influences: { shy: 0.58, messy: 0.21, bounce: 0.22 },
  };

  evolutions.push({
    id: "evo_ECHO_SHY_001_messy",
    deviceId: "ECHO_SHY_001",
    dailyMemoryId: memoryId,
    mutationType: "melody_fragment_exchange",
    sourceEchoHash: "ECHO_MESSY_001",
    sourceEchoType: "messy",
    trigger: { durationSec: 72, closenessAvg: 0.58 },
    beforeState: {
      melodySemi: shyFactory.melodySemi,
      brightness: shyFactory.brightness,
      calmness: shyFactory.calmness,
      densityBias: shyFactory.densityBias,
    },
    afterState: afterMessy,
    borrowedFragment: { original: [0, 1], transposed: [1, 1], insertedAt: 2 },
    createdAt,
  });

  evolutions.push({
    id: "evo_ECHO_SHY_001_bounce",
    deviceId: "ECHO_SHY_001",
    dailyMemoryId: memoryId,
    mutationType: "melody_fragment_exchange",
    sourceEchoHash: "ECHO_BOUNCE_001",
    sourceEchoType: "bounce",
    trigger: { durationSec: 81, closenessAvg: 0.62 },
    beforeState: afterMessy,
    afterState: finalState,
    borrowedFragment: { original: [4, 7], transposed: [5, 7], insertedAt: 3 },
    createdAt: new Date(createdAt.getTime() + 60_000),
  });

  return finalState;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function eachIsoDate(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T12:00:00.000Z`);
  const last = new Date(`${end}T12:00:00.000Z`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function encounterTimestamp(date: string, hour: number, minute: number): Date {
  const [year, month, day] = date.split("-").map(Number);
  return DateTime.fromObject(
    { year, month, day, hour, minute, second: 0, millisecond: 0 },
    { zone: SEED_TIME_ZONE },
  )
    .toUTC()
    .toJSDate();
}

function pickZone(rand: () => number): ProximityZone {
  const roll = rand();
  if (roll < 0.12) return "far";
  if (roll < 0.34) return "near";
  if (roll < 0.72) return "close";
  return "very_close";
}

function closenessForZone(zone: ProximityZone, rand: () => number): number {
  const ranges: Record<ProximityZone, [number, number]> = {
    far: [0.08, 0.28],
    near: [0.34, 0.58],
    close: [0.62, 0.84],
    very_close: [0.86, 0.98],
  };
  const [min, max] = ranges[zone];
  return min + rand() * (max - min);
}

function rssiForZone(zone: ProximityZone, rand: () => number) {
  const avgByZone: Record<ProximityZone, number> = {
    far: -78,
    near: -66,
    close: -58,
    very_close: -50,
  };
  const avg = avgByZone[zone] + (rand() - 0.5) * 8;
  return {
    rssiAvg: avg,
    rssiMin: Math.round(avg - 8 - rand() * 6),
    rssiMax: Math.round(avg + 6 + rand() * 6),
  };
}

function pickPeer(rand: () => number, peers: MockPeerEcho[]): MockPeerEcho {
  return peers[Math.floor(rand() * peers.length)]!;
}

function buildComposition(
  encounters: Array<{ otherEchoType: EchoType; closenessAvg: number }>,
) {
  const types: EchoType[] = ["shy", "messy", "bounce"];
  const voices = types.map((echoType) => {
    const matching = encounters.filter((e) => e.otherEchoType === echoType);
    const presence = matching.length / Math.max(1, encounters.length);
    const averageCloseness = matching.length
      ? matching.reduce((sum, e) => sum + e.closenessAvg, 0) / matching.length
      : 0.5;
    return {
      echoType,
      presence,
      melody: defaultStateForType(echoType).melody.slice(0, 4),
      averageCloseness,
    };
  });
  const sum = voices.reduce((total, voice) => total + voice.presence, 0) || 1;
  return {
    style: "Ambient proximity meditation",
    tempoBpm: 52,
    scale: "A minor pentatonic",
    voices: voices.map((voice) => ({
      ...voice,
      presence: voice.presence / sum,
    })),
  };
}

function buildVisualization(date: string, deviceId: string, count: number) {
  const seed = hashString(`${deviceId}:${date}`) % 10000;
  return {
    seed,
    density: Math.min(0.92, 0.28 + count * 0.05),
    brightness: Math.min(0.9, 0.52 + count * 0.03),
    movement: Math.min(0.52, 0.16 + count * 0.025),
  };
}

function dominantZone(
  encounters: Array<{ proximityZone: ProximityZone }>,
): ProximityZone {
  const rank: Record<ProximityZone, number> = {
    far: 0,
    near: 1,
    close: 2,
    very_close: 3,
  };
  return encounters.reduce(
    (best, encounter) =>
      rank[encounter.proximityZone] > rank[best]
        ? encounter.proximityZone
        : best,
    "far" as ProximityZone,
  );
}

function dominantEchoType(
  encounters: Array<{ otherEchoType: EchoType }>,
): EchoType {
  const counts: Record<EchoType, number> = { shy: 0, messy: 0, bounce: 0 };
  for (const encounter of encounters) {
    counts[encounter.otherEchoType] += 1;
  }
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "shy") as EchoType;
}

export type GeneratedEncounter = {
  id: string;
  deviceId: string;
  otherEchoHash: string;
  otherEchoModelName: string;
  otherEchoType: EchoType;
  startedAt: Date;
  endedAt: Date;
  durationSec: number;
  rssiAvg: number;
  rssiMin: number;
  rssiMax: number;
  proximityZone: ProximityZone;
  closenessAvg: number;
  soundProfileId: string;
  otherEchoProfileSnapshot: object;
  otherEchoSonicSource: string;
};

export type GeneratedDailyMemory = {
  id: string;
  userId: string;
  deviceId: string;
  date: string;
  soundProfileId: string;
  profileSnapshot: object;
  totalEncounters: number;
  totalDurationSec: number;
  dominantZone: ProximityZone;
  dominantEchoType: EchoType;
  composition: object;
  visualization: object;
  createdAt: Date;
};

export type GeneratedEvolution = {
  id: string;
  deviceId: string;
  dailyMemoryId: string;
  mutationType: string;
  sourceEchoHash: string;
  sourceEchoType: EchoType;
  trigger: object;
  beforeState: object;
  afterState: object;
  borrowedFragment: object;
  createdAt: Date;
};

export type GeneratedSeedData = {
  encounters: GeneratedEncounter[];
  dailyMemories: GeneratedDailyMemory[];
  evolutions: GeneratedEvolution[];
  deviceStateOverrides: Record<string, object>;
};

/** Today + pinned days in seed timezone — main/overview get rich data after re-seed. */
export function seedShowcaseDates() {
  const now = DateTime.now().setZone(SEED_TIME_ZONE);
  const today = now.toISODate()!;
  const showcaseDays = Array.from(
    new Set<string>([today, ...PINNED_SHOWCASE_DATES]),
  ).sort();
  const rangeStart = now.minus({ days: 90 }).toISODate()!;
  const rangeEnd = showcaseDays[showcaseDays.length - 1]!;
  return { rangeStart, rangeEnd, today, showcaseDays };
}

export function generateSeedData(
  rangeStart?: string,
  rangeEnd?: string,
): GeneratedSeedData {
  const showcase = seedShowcaseDates();
  const start = rangeStart ?? showcase.rangeStart;
  const end = rangeEnd ?? showcase.rangeEnd;
  const { today: todayIso, showcaseDays } = showcase;
  const showcaseDaySet = new Set(showcaseDays);

  const encounters: GeneratedEncounter[] = [];
  const dailyMemories: GeneratedDailyMemory[] = [];
  const evolutions: GeneratedEvolution[] = [];
  const deviceStateOverrides: Record<string, object> = {};
  const dates = eachIsoDate(start, end);

  for (const user of SEED_USERS) {
    const peers = peersForOwner(user.device.firmwareModelName);
    const state = defaultStateForType(user.device.echoType);
    let encounterCounter = 0;

    for (const date of dates) {
      const rand = mulberry32(hashString(`${user.id}:${date}`));
      const isShowcaseDay = showcaseDaySet.has(date);

      if (!isShowcaseDay) {
        const activeChance = user.tier === "power" ? 0.82 : 0.26;
        if (rand() > activeChance) continue;
      }

      const minCount = user.tier === "power" ? 4 : 0;
      const maxCount = user.tier === "power" ? 14 : 3;
      const count = isShowcaseDay
        ? 12 + Math.floor(rand() * 5)
        : minCount + Math.floor(rand() * (maxCount - minCount + 1));
      if (count === 0) continue;

      const dayEncounters: GeneratedEncounter[] = [];
      const hours = [8, 9, 10, 11, 13, 14, 15, 17, 18, 19, 20, 21];

      for (let index = 0; index < count; index += 1) {
        const peer = pickPeer(rand, peers);
        const zone = pickZone(rand);
        const closenessAvg = closenessForZone(zone, rand);
        const rssi = rssiForZone(zone, rand);
        const hour = hours[Math.min(index, hours.length - 1)] ?? 12;
        const minute = Math.floor(rand() * 50) + 5;
        const startedAt = encounterTimestamp(date, hour, minute);
        const durationSec = 120 + Math.floor(rand() * 780);
        const endedAt = new Date(startedAt.getTime() + durationSec * 1000);
        encounterCounter += 1;

        dayEncounters.push({
          id: `enc_${user.device.id}_${date.replace(/-/g, "")}_${index + 1}`,
          deviceId: user.device.id,
          otherEchoHash: peerEchoHash(peer.firmwareModelName),
          otherEchoModelName: peer.firmwareModelName,
          otherEchoType: peer.echoType,
          startedAt,
          endedAt,
          durationSec,
          rssiAvg: rssi.rssiAvg,
          rssiMin: rssi.rssiMin,
          rssiMax: rssi.rssiMax,
          proximityZone: zone,
          closenessAvg,
          soundProfileId: mockSoundProfile.id,
          otherEchoProfileSnapshot: peerSnapshot(peer.echoType),
          otherEchoSonicSource: "ble_adv",
        });
      }

      encounters.push(...dayEncounters);

      const memoryId = `memory_${user.device.id}_${date.replace(/-/g, "")}`;
      const totalDurationSec = dayEncounters.reduce(
        (sum, encounter) => sum + encounter.durationSec,
        0,
      );
      dailyMemories.push({
        id: memoryId,
        userId: user.id,
        deviceId: user.device.id,
        date,
        soundProfileId: mockSoundProfile.id,
        profileSnapshot: state,
        totalEncounters: dayEncounters.length,
        totalDurationSec,
        dominantZone: dominantZone(dayEncounters),
        dominantEchoType: dominantEchoType(dayEncounters),
        composition: buildComposition(dayEncounters),
        visualization: buildVisualization(
          date,
          user.device.id,
          dayEncounters.length,
        ),
        createdAt: encounterTimestamp(date, 21, 4),
      });

      if (
        user.tier === "power" &&
        user.device.id !== "ECHO_SHY_001" &&
        dayEncounters.some(
          (encounter) => encounter.proximityZone === "very_close",
        )
      ) {
        const source = dayEncounters.find(
          (encounter) => encounter.proximityZone === "very_close",
        );
        if (source && rand() < 0.18 && evolutions.length < 24) {
          evolutions.push({
            id: `evo_${user.device.id}_${encounterCounter}`,
            deviceId: user.device.id,
            dailyMemoryId: memoryId,
            mutationType: "melody_fragment_exchange",
            sourceEchoHash: source.otherEchoHash,
            sourceEchoType: source.otherEchoType,
            trigger: {
              proximityZone: source.proximityZone,
              durationSec: source.durationSec,
              closenessAvg: source.closenessAvg,
            },
            beforeState: {
              melodySemi: state.melodySemi,
              brightness: state.brightness - 0.06,
              calmness: state.calmness,
              densityBias: state.densityBias - 0.04,
            },
            afterState: {
              melodySemi: state.melodySemi,
              brightness: state.brightness,
              calmness: state.calmness,
              densityBias: state.densityBias,
            },
            borrowedFragment: {
              original: [0, 2],
              transposed: [1, 2],
              insertedAt: 4,
            },
            createdAt: encounterTimestamp(date, 21, 30),
          });
        }
      }
    }
  }

  const shyMemory =
    dailyMemories.find(
      (memory) => memory.deviceId === "ECHO_SHY_001" && memory.date === todayIso,
    ) ??
    dailyMemories.find(
      (memory) => memory.deviceId === "ECHO_SHY_001" && memory.date === end,
    );
  if (shyMemory) {
    const finalState = appendShyCumulativeEvolutions(
      evolutions,
      shyMemory.id,
      encounterTimestamp(shyMemory.date, 21, 30),
    );
    deviceStateOverrides.ECHO_SHY_001 = finalState;
  }

  return { encounters, dailyMemories, evolutions, deviceStateOverrides };
}
