import * as THREE from "three";

import type { EchoType, ProximityZone } from "@/lib/types";

export const BG_NAVY = 0x0a1324;

/** Thin orbital membrane — teal / cyan */
export const MEMBRANE = new THREE.Color(0x4a8fa8);
export const MEMBRANE_SOFT = new THREE.Color(0x6ec8d4);

/**
 * 만남 입자 색의 기준 — `Encounter.otherEchoType`마다 한 쌍.
 * inner→outer로 살짝 섞인 그라데이션이 한 타입의 팔레트.
 */
export const TYPE_INNER: Record<EchoType, THREE.Color> = {
  shy: new THREE.Color(0xe8c9a8),
  messy: new THREE.Color(0xd484c8),
  bounce: new THREE.Color(0xffb870),
};

export const TYPE_OUTER: Record<EchoType, THREE.Color> = {
  shy: new THREE.Color(0x7ca8d8),
  messy: new THREE.Color(0x8866aa),
  bounce: new THREE.Color(0xe89868),
};

export function proximityGlow(zone: ProximityZone): number {
  switch (zone) {
    case "very_close":
      return 1.35;
    case "close":
      return 1.05;
    case "near":
      return 0.78;
    default:
      return 0.48;
  }
}

/** 궤도 각도별 부드러운 배경 틴트 — 만남 사이 구간이 검게 보이지 않도록 */
export function orbitAmbientHue(theta: number): THREE.Color {
  const twoPi = Math.PI * 2;
  let t = theta % twoPi;
  if (t < 0) t += twoPi;
  const u = t / twoPi;
  const c = new THREE.Color();
  c.setHSL(0.5 + u * 0.4, 0.46, 0.64);
  return c;
}
