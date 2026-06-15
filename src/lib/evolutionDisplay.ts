import { melodyNotesFromSemi } from "@/lib/echoFactoryProfile";
import type { EchoEvolution, EchoType } from "@/lib/types";

function formatSemiArray(semis: number[], echoType: EchoType): string[] {
  return melodyNotesFromSemi(echoType, semis);
}

function formatFragmentArray(
  values: unknown[],
  echoType: EchoType,
): string[] {
  if (values.every((value) => typeof value === "number")) {
    return formatSemiArray(values as number[], echoType);
  }
  return values.map((value) => String(value));
}

/** Resolve melody note names for evolution UI — prefers stored melodySemi. */
export function evolutionMelodyNotes(
  state: EchoEvolution["beforeState"],
  deviceEchoType: EchoType,
): string[] {
  if (state.melodySemi?.length) {
    return melodyNotesFromSemi(deviceEchoType, state.melodySemi);
  }
  return state.melody;
}

export function formatBorrowedFragment(
  fragment: EchoEvolution["borrowedFragment"],
  peerEchoType: EchoType | null | undefined,
  deviceEchoType: EchoType,
): { original: string[]; transposed: string[] } {
  if (!fragment) {
    return { original: [], transposed: [] };
  }
  const typeForSemi = peerEchoType ?? deviceEchoType;
  return {
    original: formatFragmentArray(fragment.original, typeForSemi),
    transposed: formatFragmentArray(fragment.transposed, typeForSemi),
  };
}

export function evolutionSourceLabel(evolution: EchoEvolution): string {
  if (evolution.sourceEchoType) {
    return `${evolution.sourceEchoType} echo motif`;
  }
  return evolution.sourceEchoHash;
}
