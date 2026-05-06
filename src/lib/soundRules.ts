import type { Encounter, ProximityZone } from "./types";

type Harmony = {
  fifth: string;
  octave: string;
  shimmer: string;
};

export function getProximityZone(closeness: number): ProximityZone {
  if (closeness < 0.33) return "far";
  if (closeness < 0.66) return "near";
  if (closeness < 0.85) return "close";
  return "very_close";
}

export function getNoteCountFromCloseness(closeness: number) {
  const zone = getProximityZone(closeness);

  if (zone === "far") return 1;
  if (zone === "near") return 2;
  if (zone === "close") return 3;
  return 4;
}

export function enrichMelodyNote(
  note: string,
  harmony: Record<string, Harmony>,
  closeness: number,
) {
  const harmonicNotes = harmony[note];
  const noteCount = getNoteCountFromCloseness(closeness);

  if (!harmonicNotes) return [note];

  return [
    note,
    harmonicNotes.fifth,
    harmonicNotes.octave,
    harmonicNotes.shimmer,
  ].slice(0, noteCount);
}

export function shouldTriggerMutation(encounter: Encounter) {
  return (
    encounter.proximityZone === "very_close" &&
    encounter.durationSec >= 180 &&
    encounter.closenessAvg >= 0.85
  );
}

export function exchangeMelodyFragment(
  sourceMelody: string[],
  targetMelody: string[],
) {
  const fragmentLength = Math.max(1, Math.ceil(sourceMelody.length * 0.25));
  const sourceStart = Math.max(0, Math.floor(sourceMelody.length / 2) - 1);
  const insertedAt = Math.max(1, Math.floor(targetMelody.length / 2));
  const fragment = sourceMelody.slice(sourceStart, sourceStart + fragmentLength);
  const after = [
    ...targetMelody.slice(0, insertedAt),
    ...fragment,
    ...targetMelody.slice(insertedAt + fragmentLength),
  ];

  return {
    borrowedFragment: fragment,
    insertedAt,
    melody: after,
  };
}
