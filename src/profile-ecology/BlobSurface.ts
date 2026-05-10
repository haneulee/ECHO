import * as THREE from "three";

import { MODEL_GRADIENTS } from "./modelGradients";
import { blobFragmentShader } from "./shaders/blob.frag";
import { blobVertexShader } from "./shaders/blob.vert";
import type { EcologyPersonalityId } from "./types";
import type { EcologyUniformSnapshot } from "./types";

/** Match particle shell scale (`IcoNoiseSphere` radius) */
const BLOB_RADIUS = 2.58;
/** 단일 연속 면 — 디테일 높여 유기적 실루엣을 깎기 쉽게 */
const ICO_DETAIL = 9;

export class BlobSurface {
  readonly group = new THREE.Group();
  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
  private readonly geometry: THREE.BufferGeometry;

  constructor() {
    this.geometry = new THREE.IcosahedronGeometry(BLOB_RADIUS, ICO_DETAIL);

    const g0 = MODEL_GRADIENTS.drift;
    this.material = new THREE.ShaderMaterial({
      vertexShader: blobVertexShader,
      fragmentShader: blobFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTimeSpeed: { value: 0.65 },
        uDispStrength: { value: 0.42 },
        uColA: { value: g0.colA.clone() },
        uColB: { value: g0.colB.clone() },
        uBrightness: { value: 0.94 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.y = Math.PI;
    this.group.add(this.mesh);
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
      0.28 + s.blobDisplacement * 1.05 + s.particleDrift * 0.42;
    u.uTimeSpeed.value = 0.48 + s.particleDrift * 0.95;

    const ga = MODEL_GRADIENTS[paletteFrom];
    const gb = MODEL_GRADIENTS[paletteTo];
    const t = THREE.MathUtils.clamp(paletteMix, 0, 1);
    u.uColA.value.copy(ga.colA).lerp(gb.colA, t);
    u.uColB.value.copy(ga.colB).lerp(gb.colB, t);
  }

  setTime(t: number) {
    this.material.uniforms.uTime.value = t;
    const pulse =
      1 +
      Math.sin(t * 1.08) * 0.031 +
      Math.sin(t * 0.42) * 0.017 +
      Math.sin(t * 0.21) * 0.009;
    this.mesh.scale.setScalar(pulse);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
