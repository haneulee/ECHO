import { prisma } from "@/lib/prisma";
import type { SoundProfile, SoundVoice } from "@/lib/types";

export type SoundLabPayload = {
  profile: SoundProfile;
  voices: SoundVoice[];
};

export async function getSoundLabPayload(): Promise<SoundLabPayload | null> {
  const row = await prisma.soundProfile.findFirst({
    orderBy: { id: "asc" },
  });
  if (!row) return null;
  const voices = row.voices as unknown as SoundVoice[];
  const profile: SoundProfile = {
    id: row.id,
    name: row.name,
    description: row.description,
    engineType: row.engineType as SoundProfile["engineType"],
    scale: row.scale,
    tempoBpm: row.tempoBpm,
    globalParams: row.globalParams as Record<string, unknown>,
  };
  return { profile, voices };
}
