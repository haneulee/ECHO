"use client";

import type { EcologyPersonalityId } from "@/profile-ecology/types";
import { EchoShellBlob } from "./EchoShellBlob";
import { EchoShellParticles } from "./EchoShellParticles";

export type ProfileHeroLabProps = {
  ecologyPersonality: EcologyPersonalityId;
};

export function ProfileHeroLab({ ecologyPersonality }: ProfileHeroLabProps) {
  return (
    <div className="flex w-full flex-col gap-12">
      <div className="relative aspect-square w-full overflow-hidden rounded-[2px] bg-transparent">
        <EchoShellParticles
          personality={ecologyPersonality}
          particleDensity="lite"
        />
        {/* <EchoShellBlob personality={ecologyPersonality} /> */}
      </div>
    </div>
  );
}
