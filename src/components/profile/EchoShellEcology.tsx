"use client";

import type { EchoType } from "@/lib/types";
import { echoTypeToPointCloudVisual } from "@/lib/echoPointCloudMapping";

/**
 * Back-compat: 경량 파티클 셸과 동일합니다. 새 코드는 `EchoShellParticles` /
 * `EchoShellBlob`를 직접 쓰는 것을 권장합니다.
 */
export { EchoShellParticles as EchoShellEcology } from "./EchoShellParticles";
export { EchoShellParticles } from "./EchoShellParticles";
export { EchoShellBlob } from "./EchoShellBlob";

/** Echo archetype → ecology id (`shy` → `drift`, …). */
export function echoTypeToShellEcology(t: EchoType) {
  return echoTypeToPointCloudVisual[t];
}

export type { EcologyPersonalityId } from "@/profile-ecology/types";
