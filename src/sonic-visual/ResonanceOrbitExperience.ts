import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import type { Encounter } from "@/lib/types";

import { durationToSpanRad, timeOfDayToAngle } from "./orbitTime";
import { orbitParticleFragment, orbitParticleVertex } from "./orbitParticleShader";
import {
  orbitAmbientHue,
  TYPE_INNER,
  TYPE_OUTER,
  proximityGlow,
} from "./resonancePalette";

/** 구 껍질 평균 반지름 */
const SPHERE_MEAN_R = 5.45;
/** 반경 방향 두께(±) — 띠를 두껍게 */
const SHELL_HALF_THICK = 1.52;

function randomUnitDirection(rng: () => number): THREE.Vector3 {
  const az = rng() * Math.PI * 2;
  const cosEl = 2 * rng() - 1;
  const sinEl = Math.sqrt(Math.max(0, 1 - cosEl * cosEl));
  return new THREE.Vector3(
    sinEl * Math.cos(az),
    sinEl * Math.sin(az),
    cosEl,
  );
}

function shellRadialNoise(rng: () => number, halfThick: number): number {
  return (rng() - 0.5) * 2 * halfThick;
}

/**
 * 구면좌표: θ = 하루 각(적도 위 경도), φ = 북극 기준 극각 — 적도는 φ=π/2.
 * 시간 판독은 θ에 고정하고 φ·반경만 살짝 흔들어 부피감만 낸다.
 */
function pointOnSphericalShell(
  theta: number,
  colatitude: number,
  r: number,
): { x: number; y: number; z: number } {
  const sinP = Math.sin(colatitude);
  return {
    x: r * sinP * Math.cos(theta),
    y: r * sinP * Math.sin(theta),
    z: r * Math.cos(colatitude),
  };
}

/** 프로필 IcoNoiseSphere와 유사한 로그 균등 크기 — 일부 덩어리가 크게 튄다 */
function logUniformSize(rng: () => number, lo: number, hi: number): number {
  const t = rng();
  return lo * Math.pow(hi / lo, t);
}

function orbitParticleMaterial(opts: { dust: boolean }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTimeSpeed: { value: opts.dust ? 0.38 : 0.56 },
      uDispStrength: { value: opts.dust ? 0.55 : 1.0 },
      uPointScale: { value: opts.dust ? 1.78 : 1.42 },
      uMaxPointPx: { value: opts.dust ? 520 : 480 },
      uBrightness: { value: opts.dust ? 0.82 : 0.94 },
    },
    vertexShader: orbitParticleVertex,
    fragmentShader: orbitParticleFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class ResonanceOrbitExperience {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private readonly canvas: HTMLCanvasElement;
  private readonly controls: OrbitControls;
  private readonly clock = new THREE.Clock();
  private disposed = false;
  private rafId = 0;

  constructor(canvas: HTMLCanvasElement, encounters: Encounter[]) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.14;
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.set(0, 0, 15.8);

    const oc = new OrbitControls(this.camera, canvas);
    oc.enableDamping = true;
    oc.dampingFactor = 0.06;
    oc.rotateSpeed = 0.26;
    oc.enablePan = false;
    oc.minDistance = 11;
    oc.maxDistance = 24;
    oc.minPolarAngle = Math.PI * 0.2;
    oc.maxPolarAngle = Math.PI * 0.8;
    oc.target.set(0, 0, 0);
    oc.update();
    this.controls = oc;

    this.buildFineDust();
    this.buildParticlesAndHits(encounters);

    this.resize();
    window.addEventListener("resize", this.onResize);
    this.rafId = requestAnimationFrame(this.tick);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.onResize);
    this.controls.dispose();
    this.scene.clear();
    this.renderer.dispose();
  }

  resizeNow() {
    if (!this.disposed) this.resize();
  }

  private resize = () => {
    const w = Math.max(8, Math.round(this.canvas.clientWidth));
    const h = Math.max(8, Math.round(this.canvas.clientHeight));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  };

  private buildFineDust() {
    const n = 2400;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const spreads = new Float32Array(n);
    const c1 = new THREE.Color(0x4a7a90);
    const c2 = new THREE.Color(0x6688aa);
    for (let i = 0; i < n; i++) {
      const thick =
        SHELL_HALF_THICK * (0.78 + Math.random() * 0.44) * logUniformSize(Math.random, 0.82, 1.22);
      const r = SPHERE_MEAN_R + shellRadialNoise(Math.random, thick);

      let thetaD: number;
      let phiC: number;
      if (Math.random() < 0.68) {
        thetaD = Math.random() * Math.PI * 2;
        phiC =
          Math.PI / 2 +
          (Math.random() - 0.5) *
            (0.95 + Math.random() * 0.55);
      } else {
        const dir = randomUnitDirection(Math.random);
        thetaD = Math.atan2(dir.y, dir.x);
        phiC = Math.acos(THREE.MathUtils.clamp(dir.z, -1, 1));
      }

      const p = pointOnSphericalShell(thetaD, phiC, r);
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
      const hueAng = thetaD;
      const cc = c1.clone().lerp(c2, Math.random());
      const amb = orbitAmbientHue(hueAng);
      const blended = amb.clone().lerp(cc, 0.52);
      col[i * 3] = blended.r * 0.9;
      col[i * 3 + 1] = blended.g * 0.9;
      col[i * 3 + 2] = blended.b * 0.9;
      sizes[i] =
        (0.22 + Math.random() * 0.28) *
        logUniformSize(Math.random, 0.55, 4.6);
      spreads[i] = 0.4 + Math.random() * 0.3;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geom.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aSpread", new THREE.BufferAttribute(spreads, 1));

    const mat = orbitParticleMaterial({ dust: true });
    const pts = new THREE.Points(geom, mat);
    pts.frustumCulled = false;
    pts.userData.isDust = true;
    this.scene.add(pts);
  }

  private buildParticlesAndHits(encounters: Encounter[]) {
    const sorted = [...encounters].sort(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );

    for (const enc of sorted) {
      const seed =
        enc.id.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0) ^
        enc.durationSec;
      const rng = mulberry32(seed);

      const t0 = timeOfDayToAngle(enc.startedAt);
      const span = durationToSpanRad(enc.durationSec);
      const glow = proximityGlow(enc.proximityZone);
      const inner = TYPE_INNER[enc.otherEchoType];
      const outer = TYPE_OUTER[enc.otherEchoType];

      const particleCount = Math.min(
        210,
        Math.max(
          34,
          Math.floor(
            30 +
              enc.durationSec / 13 +
              enc.closenessAvg * 72 +
              (enc.proximityZone === "very_close" ? 44 : 0),
          ),
        ),
      );

      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const spreads = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        const u = particleCount > 1 ? i / (particleCount - 1) : 0.5;
        const arcJitter = (rng() - 0.5) * span * 0.085;
        const theta = t0 + span * u + arcJitter;

        const radialBulge =
          (enc.closenessAvg * 0.95 + rng() * 0.62) *
          (0.48 + Math.min(1.55, enc.durationSec / 480));

        const latSpread =
          0.24 +
          Math.min(0.36, span * 0.65) +
          radialBulge * 0.045 +
          enc.closenessAvg * 0.06;
        const phiC =
          Math.PI / 2 + (rng() - 0.5) * latSpread * 2 + (rng() - 0.5) * 0.08;

        const halfThick =
          SHELL_HALF_THICK *
          (0.88 + radialBulge * 0.07) *
          glow *
          (enc.proximityZone === "very_close" ? 1.1 : 1);
        const rr = SPHERE_MEAN_R + shellRadialNoise(rng, halfThick);
        const p = pointOnSphericalShell(theta, phiC, rr);
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;

        const mixT = rng();
        const encHue = inner.clone().lerp(outer, mixT * 0.92);
        /** 타입 색이 주도 — 시간 그라데이션은 약하게만 (대략 12%) */
        const timeTint = 0.12;
        const blended = encHue.clone().lerp(orbitAmbientHue(theta), timeTint);
        const amp = Math.max(
          0.64,
          Math.min(1.18, glow * (0.72 + enc.closenessAvg * 0.38)),
        );
        colors[i * 3] = blended.r * amp;
        colors[i * 3 + 1] = blended.g * amp;
        colors[i * 3 + 2] = blended.b * amp;

        spreads[i] = radialBulge + enc.closenessAvg * 0.8;
        const durLift = 0.72 + Math.min(1.15, enc.durationSec / 420);
        sizes[i] =
          (0.16 + rng() * 0.26) *
          logUniformSize(rng, 0.09, 4.2) *
          durLift *
          (0.52 + enc.closenessAvg * 0.92) *
          (enc.proximityZone === "very_close" ? 1.32 : 1);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
      geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      geom.setAttribute("aSpread", new THREE.BufferAttribute(spreads, 1));

      const mat = orbitParticleMaterial({ dust: false });

      const cloud = new THREE.Points(geom, mat);
      cloud.frustumCulled = false;
      cloud.userData.encounterId = enc.id;
      this.scene.add(cloud);
    }
  }

  private onResize = () => this.resize();

  private tick = () => {
    this.rafId = requestAnimationFrame(this.tick);
    if (this.disposed) return;

    const t = this.clock.elapsedTime;
    this.controls.update();

    this.scene.traverse((obj) => {
      if (
        obj instanceof THREE.Points &&
        obj.material instanceof THREE.ShaderMaterial
      ) {
        obj.material.uniforms.uTime.value = t;
      }
    });

    this.renderer.render(this.scene, this.camera);
  };
}
