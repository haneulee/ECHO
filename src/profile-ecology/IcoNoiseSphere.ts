import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { MODEL_GRADIENTS } from "./modelGradients";
import { icosphereFragmentShader } from "./shaders/icosphere.frag";
import { icosphereVertexShader } from "./shaders/icosphere.vert";
import type { EcologyPersonalityId } from "./types";
import type { EcologyUniformSnapshot } from "./types";

const ICO_RADIUS = 2.18;

/** 경량: 파티클 수·크기 모두 절약 */
export const ICO_NOISE_SPHERE_LITE = {
  fibonacciCount: 11_000,
  icoDetail: 7,
} as const;

/** 이전 초밀도 프로필 (~36만+) */
export const ICO_NOISE_SPHERE_HEAVY = {
  fibonacciCount: 360_000,
  icoDetail: 10,
} as const;

export type IcoNoiseSphereDensity =
  | typeof ICO_NOISE_SPHERE_LITE
  | typeof ICO_NOISE_SPHERE_HEAVY;

const FIB_INDEX_OFFSET = 8_000_000;

function rand01(ix: number, salt: number): number {
  const x = Math.sin(ix * 12.9898 + salt * 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

/** 로그 균등 랜덤 — 전체 스케일만 작게 */
function particleSizeMultiplier(ix: number): number {
  const lo = 0.032;
  const hi = 3.6;
  const t = rand01(ix, 9.41);
  return lo * Math.pow(hi / lo, t) * 0.74;
}

function buildIcospherePointsGeometry(icoDetail: number): THREE.BufferGeometry {
  const base = new THREE.IcosahedronGeometry(ICO_RADIUS, icoDetail);
  const posAttr = base.attributes.position as THREE.BufferAttribute;
  const n = posAttr.count;
  const sizes = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    sizes[i] = particleSizeMultiplier(i);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", posAttr.clone());
  geom.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  base.dispose();
  return geom;
}

function buildFibonacciSphereGeometry(
  count: number,
  radius: number,
  indexOffset: number,
): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const inv = count > 1 ? 1 / (count - 1) : 0;

  for (let i = 0; i < count; i++) {
    const y = 1 - i * inv * 2;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const x = Math.cos(theta) * rr;
    const z = Math.sin(theta) * rr;
    positions[i * 3] = x * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = z * radius;
    sizes[i] = particleSizeMultiplier(indexOffset + i);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  return geom;
}

export class IcoNoiseSphere {
  readonly group = new THREE.Group();
  private readonly points: THREE.Points;
  private readonly material: THREE.ShaderMaterial;
  private readonly geometry: THREE.BufferGeometry;

  constructor(density: IcoNoiseSphereDensity = ICO_NOISE_SPHERE_LITE) {
    const { fibonacciCount, icoDetail } = density;
    const gIco = buildIcospherePointsGeometry(icoDetail);

    let merged: THREE.BufferGeometry;
    if (fibonacciCount <= 0) {
      merged = gIco;
    } else {
      const gFib = buildFibonacciSphereGeometry(
        fibonacciCount,
        ICO_RADIUS * 0.9985,
        FIB_INDEX_OFFSET,
      );
      const m = mergeGeometries([gIco, gFib]);
      gIco.dispose();
      gFib.dispose();
      if (!m) {
        throw new Error("IcoNoiseSphere: mergeGeometries failed");
      }
      merged = m;
    }

    const g0 = MODEL_GRADIENTS.drift;
    this.material = new THREE.ShaderMaterial({
      vertexShader: icosphereVertexShader,
      fragmentShader: icosphereFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTimeSpeed: { value: 0.85 },
        uDispStrength: { value: 2.45 },
        uPointScale: { value: 0.58 },
        uMaxPointPx: { value: 128 },
        uColA: { value: g0.colA.clone() },
        uColB: { value: g0.colB.clone() },
        uBrightness: { value: 0.92 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.geometry = merged;
    this.points = new THREE.Points(merged, this.material);
    this.points.frustumCulled = false;
    this.points.rotation.y = Math.PI;
    this.group.add(this.points);
  }

  applySnapshot(
    s: EcologyUniformSnapshot,
    paletteFrom: EcologyPersonalityId,
    paletteTo: EcologyPersonalityId,
    paletteMix: number,
  ) {
    const u = this.material.uniforms;
    u.uBrightness.value = s.particleBrightness * 1.02;
    u.uDispStrength.value =
      1.85 + s.blobDisplacement * 5.2 + s.particleDrift * 2.4;
    u.uPointScale.value = (0.42 + s.particlePointScale * 5.4) * 0.62;
    u.uTimeSpeed.value = 0.58 + s.particleDrift * 1.35;

    const ga = MODEL_GRADIENTS[paletteFrom];
    const gb = MODEL_GRADIENTS[paletteTo];
    const t = THREE.MathUtils.clamp(paletteMix, 0, 1);
    u.uColA.value.copy(ga.colA).lerp(gb.colA, t);
    u.uColB.value.copy(ga.colB).lerp(gb.colB, t);
  }

  setTime(t: number) {
    this.material.uniforms.uTime.value = t;
  }

  setMaxPointPx(px: number) {
    this.material.uniforms.uMaxPointPx.value = THREE.MathUtils.clamp(px, 12, 280);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
