import { isDatabaseConnectFailure } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode } from "@/lib/localMockMode";
import { mockSoundProfile, mockSoundVoices } from "@/lib/mockData";
import { prisma } from "@/lib/prisma";
import type { SoundProfile, SoundVoice } from "@/lib/types";

export type SoundLabPayload = {
  profile: SoundProfile;
  voices: SoundVoice[];
};

export async function getSoundLabPayload(): Promise<SoundLabPayload | null> {
  if (isLocalMockMode()) {
    return { profile: mockSoundProfile, voices: mockSoundVoices };
  }
  let row = null;
  try {
    row = await prisma.soundProfile.findFirst({
      orderBy: { id: "asc" },
    });
  } catch (e) {
    if (isDatabaseConnectFailure(e)) {
      return { profile: mockSoundProfile, voices: mockSoundVoices };
    }
    throw e;
  }
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
