import type { Encounter, ProximityZone } from "@/lib/types";

const PROXIMITY_RANK: Record<ProximityZone, number> = {
  far: 0,
  near: 1,
  close: 2,
  very_close: 3,
};

/** Stable key for the peer Echo (firmware sticker > BLE hash). */
export function peerEchoKey(encounter: Encounter): string {
  return (
    encounter.otherEchoModelName?.trim() ||
    encounter.otherEchoHash.trim() ||
    encounter.id
  );
}

/** Combined duration + meeting frequency → 0..1 visual weight for orbs / gradients. */
export function getPresenceWeight(
  durationSec: number,
  meetingCount = 1,
): number {
  const durationFactor = Math.min(1, Math.log1p(Math.max(0, durationSec)) / 8);
  const countFactor = Math.min(
    1,
    Math.log1p(Math.max(1, meetingCount)) / Math.log1p(12),
  );
  return Math.min(1, durationFactor * 0.72 + countFactor * 0.28);
}

/**
 * Merge multiple meetings with the same peer into one visual / playback unit.
 * Size scales via summed `durationSec` and `meetingCount`.
 */
export function aggregateEncountersByPeer(
  encounters: Encounter[],
): Encounter[] {
  const groups = new Map<string, Encounter[]>();
  for (const encounter of encounters) {
    const key = peerEchoKey(encounter);
    groups.set(key, [...(groups.get(key) ?? []), encounter]);
  }

  return [...groups.entries()]
    .map(([key, items]) => mergePeerEncounters(key, items))
    .sort(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );
}

function mergePeerEncounters(key: string, items: Encounter[]): Encounter {
  const sorted = [...items].sort(
    (a, b) =>
      new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );
  const first = sorted[0]!;
  const last = sorted.reduce((latest, item) =>
    new Date(item.endedAt).getTime() > new Date(latest.endedAt).getTime()
      ? item
      : latest,
  );
  const totalDuration = sorted.reduce(
    (sum, item) => sum + Math.max(0, item.durationSec),
    0,
  );
  const weightSum = sorted.reduce(
    (sum, item) => sum + Math.max(1, item.durationSec),
    0,
  );
  const weighted = (pick: (item: Encounter) => number) =>
    sorted.reduce(
      (sum, item) => pick(item) * Math.max(1, item.durationSec),
      0,
    ) / weightSum;
  const strongest = sorted.reduce((best, item) =>
    PROXIMITY_RANK[item.proximityZone] > PROXIMITY_RANK[best.proximityZone]
      ? item
      : best,
  );

  return {
    ...first,
    id: `orbit_${key.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    startedAt: first.startedAt,
    endedAt: last.endedAt,
    durationSec: totalDuration,
    rssiAvg: weighted((item) => item.rssiAvg),
    rssiMin: Math.min(...sorted.map((item) => item.rssiMin)),
    rssiMax: Math.max(...sorted.map((item) => item.rssiMax)),
    proximityZone: strongest.proximityZone,
    closenessAvg: weighted((item) => item.closenessAvg),
    meetingCount: sorted.length,
  };
}
