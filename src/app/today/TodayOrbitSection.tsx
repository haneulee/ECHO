"use client";

import { ResonanceOrbitCanvas } from "@/sonic-visual/ResonanceOrbitCanvas";
import type { Encounter } from "@/lib/types";

export function TodayOrbitSection({ encounters }: { encounters: Encounter[] }) {
  return (
    <div className="relative z-0 mx-auto mt-1 flex w-full max-w-[920px] justify-center px-1 sm:mt-2">
      <ResonanceOrbitCanvas encounters={encounters} />
    </div>
  );
}
