import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { sampleEchoAudioBands } from "@/lib/echoAudioAnalyser";
import {
  ABS_MAX_PARTICLES,
  buildParticlesFromImage,
  type EchoPersonalityVisual,
} from "@/three/imageParticleSystem";

/** Sprite modulation — tight falloff so dots read as fine points, not mushy clouds. */
function createParticleSpriteTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas unsupported");
  }
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.82, "rgba(255,255,255,1)");
  g.addColorStop(0.93, "rgba(255,255,255,0.28)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

const POINT_SIZE: Record<EchoPersonalityVisual, number> = {
  drift: 0.42,
  ripple: 0.38,
  bloom: 0.48,
};

const AUDIO_SMOOTH = 0.16;

/** Canvas-plane mouse smoothing — lower = heavier / slower response (Drift). */
const MOUSE_LERP_CANVAS = {
  drift: 0.056,
  ripple: 0.2,
  bloom: 0.11,
} as const;

const UNDERWATER_CLEAR: Record<EchoPersonalityVisual, number> = {
  drift: 0x020812,
  ripple: 0x02161a,
  bloom: 0x0a0614,
};

/** Gallery backdrop (`OrbitControls` profile hero). */
const GALLERY_CLEAR = 0xffffff;

const ORBIT_HOVER_YAW_GAIN = 0.62;
const ORBIT_HOVER_PITCH_GAIN = 0.48;

const ORBIT_DRAG_RAD_PER_PX = 0.0041;

const ORBIT_DRAG_DECAY = 0.988;

const ORBIT_DIST_BASE = Math.hypot(0.14, 9.25);
const VIEWPORT_NDC_LERP = 0.095;

export const EchoParticleInteraction = {
  CanvasPlaneMouse: "canvasPlaneMouse",
  OrbitViewport: "orbitViewport",
  /** `three/addons` OrbitControls — drag rotate, wheel zoom (reference-style). */
  OrbitControls: "orbitControls",
} as const;

export type EchoParticleInteractionKind =
  (typeof EchoParticleInteraction)[keyof typeof EchoParticleInteraction];

export type EchoParticleSceneOptions = {
  useWindowMouse?: boolean;
  interaction?: EchoParticleInteractionKind;
};

export class EchoParticleScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;

  private readonly canvas: HTMLCanvasElement;
  private readonly interaction: EchoParticleInteractionKind;
  private orbitControls: OrbitControls | null = null;
  private readonly clock = new THREE.Clock();
  private readonly pointsMaterial: THREE.PointsMaterial;
  private readonly particleMap: THREE.CanvasTexture;
  private points: THREE.Points | null = null;

  /** Snapshot of `position` after build — jitter is added relative to this each frame. */
  private restPositions: Float32Array | null = null;

  /** Base point diameter before audio modulation (personality). */
  private basePointSize = POINT_SIZE.drift;
  private readonly audioSmooth = {
    bass: 0,
    mid: 0,
    high: 0,
    level: 0,
  };

  private currentPersonality: EchoPersonalityVisual | null = null;
  private planeHalfWidth = 5.5;
  private planeHalfHeight = 5.2;

  private mouseTarget = new THREE.Vector2(0, 0);
  private mouseSmooth = new THREE.Vector2(0, 0);

  private viewportNdcTarget = new THREE.Vector2(0, 0);
  private viewportNdcSmooth = new THREE.Vector2(0, 0);
  private orbitDragYawAccum = 0;
  private orbitDragPitchAccum = 0;

  private dragPointerDown = false;

  private fade = {
    active: false,
    from: 1,
    to: 1,
    startWallMs: 0,
    duration: 400,
    resolve: null as (() => void) | null,
  };

  private disposed = false;
  private rafId = 0;

  ready = false;
  private transitionTail: Promise<void> = Promise.resolve();
  private readonly useWindowMouse: boolean;

  constructor(canvas: HTMLCanvasElement, options?: EchoParticleSceneOptions) {
    this.canvas = canvas;
    this.useWindowMouse = options?.useWindowMouse ?? false;
    this.interaction =
      options?.interaction ?? EchoParticleInteraction.CanvasPlaneMouse;

    const useDomOrbit =
      this.interaction === EchoParticleInteraction.OrbitControls;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (useDomOrbit) {
      this.renderer.setClearColor(GALLERY_CLEAR, 1);
    } else {
      this.renderer.setClearColor(UNDERWATER_CLEAR.drift, 1);
    }

    const cam = new THREE.PerspectiveCamera(
      useDomOrbit ? 52 : 48,
      1,
      0.05,
      120,
    );
    cam.position.set(0, 0.14, 9.25);
    cam.lookAt(0, 0, 0);
    this.camera = cam;

    if (useDomOrbit) {
      const oc = new OrbitControls(cam, canvas);
      oc.enableDamping = true;
      oc.dampingFactor = 0.055;
      oc.enablePan = false;
      oc.enableRotate = true;
      oc.minPolarAngle = 0.12;
      oc.maxPolarAngle = Math.PI - 0.12;
      oc.minDistance = 2;
      oc.maxDistance = 48;
      oc.target.set(0, 0, 0);
      oc.update();
      this.orbitControls = oc;
    }

    this.particleMap = createParticleSpriteTexture();
    this.pointsMaterial = new THREE.PointsMaterial({
      map: this.particleMap,
      vertexColors: true,
      size: POINT_SIZE.drift,
      sizeAttenuation: true,
      transparent: true,
      opacity: useDomOrbit ? 1 : 0,
      depthTest: false,
      depthWrite: false,
      blending: useDomOrbit ? THREE.NormalBlending : THREE.AdditiveBlending,
    });

    this.resize();
    window.addEventListener("resize", this.onResize);

    const isOrbitViewport =
      this.interaction === EchoParticleInteraction.OrbitViewport;

    if (isOrbitViewport || this.useWindowMouse) {
      window.addEventListener("mousemove", this.onViewportPointerMoveRef, {
        passive: true,
      });
      window.addEventListener("pointerdown", this.onViewportPointerDown);
      window.addEventListener("pointerup", this.onViewportPointerUp);
      window.addEventListener("pointercancel", this.onViewportPointerUp);
      window.addEventListener("blur", this.onViewportPointerUp);
    }

    if (
      !useDomOrbit &&
      !isOrbitViewport &&
      !this.useWindowMouse
    ) {
      canvas.addEventListener("mousemove", this.onMouseMove);
    } else if (!useDomOrbit && !isOrbitViewport && this.useWindowMouse) {
      window.addEventListener("mousemove", this.onWindowMouseMove, {
        passive: true,
      });
    }

    this.rafId = requestAnimationFrame(this.tick);
  }

  resizeNow() {
    if (!this.disposed) this.resize();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.onResize);

    const isOrbitViewport =
      this.interaction === EchoParticleInteraction.OrbitViewport;
    const useDomOrbitDispose =
      this.interaction === EchoParticleInteraction.OrbitControls;

    if (isOrbitViewport || this.useWindowMouse) {
      window.removeEventListener(
        "mousemove",
        this.onViewportPointerMoveRef,
      );
      window.removeEventListener("pointerdown", this.onViewportPointerDown);
      window.removeEventListener("pointerup", this.onViewportPointerUp);
      window.removeEventListener("pointercancel", this.onViewportPointerUp);
      window.removeEventListener("blur", this.onViewportPointerUp);
    }

    if (
      !useDomOrbitDispose &&
      !isOrbitViewport &&
      !this.useWindowMouse
    ) {
      this.canvas.removeEventListener("mousemove", this.onMouseMove);
    } else if (
      !useDomOrbitDispose &&
      !isOrbitViewport &&
      this.useWindowMouse
    ) {
      window.removeEventListener("mousemove", this.onWindowMouseMove);
    }

    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      this.points = null;
    }
    this.restPositions = null;
    this.orbitControls?.dispose();
    this.orbitControls = null;
    if (this.fade.resolve) {
      this.fade.resolve();
      this.fade.resolve = null;
    }
    this.fade.active = false;
    this.pointsMaterial.dispose();
    this.particleMap.dispose();
    this.renderer.dispose();
  }

  async bootstrap(personality: EchoPersonalityVisual): Promise<void> {
    if (this.disposed) return;
    await this.rebuildGeometry(personality);
    if (this.disposed) return;
    this.resize();
    this.applyPersonalityUniforms(personality);
    this.currentPersonality = personality;
    this.pointsMaterial.opacity = 1;
    if (!this.disposed) {
      this.ready = true;
      requestAnimationFrame(() => {
        if (!this.disposed) {
          this.resize();
          requestAnimationFrame(() => {
            if (!this.disposed) this.resize();
          });
        }
      });
    }
  }

  transitionTo(personality: EchoPersonalityVisual): Promise<void> {
    if (!this.ready || this.disposed) return Promise.resolve();
    this.transitionTail = this.transitionTail.then(() =>
      this.runTransition(personality),
    );
    return this.transitionTail;
  }

  private async runTransition(personality: EchoPersonalityVisual): Promise<void> {
    try {
      if (personality === this.currentPersonality && this.points) return;
      await this.startFade(0, 560);
      if (this.disposed) return;
      await this.rebuildGeometry(personality);
      if (this.disposed) return;
      this.resize();
      this.applyPersonalityUniforms(personality);
      this.currentPersonality = personality;
      await this.startFade(1, 780);
    } catch (err) {
      console.error("[EchoParticleScene] transition failed", err);
    }
  }

  private applyPersonalityUniforms(p: EchoPersonalityVisual) {
    this.basePointSize = POINT_SIZE[p];
    this.pointsMaterial.size = this.basePointSize;

    if (this.interaction !== EchoParticleInteraction.OrbitControls) {
      this.renderer.setClearColor(UNDERWATER_CLEAR[p], 1);
    }
  }

  private attachVertexColors(geometry: THREE.BufferGeometry) {
    const src = geometry.getAttribute("aColor") as THREE.BufferAttribute | null;
    if (!src) return;
    geometry.setAttribute("color", src);
  }

  private async rebuildGeometry(p: EchoPersonalityVisual): Promise<void> {
    const built = await buildParticlesFromImage(p);
    this.planeHalfWidth = built.planeHalfWidth;
    this.planeHalfHeight = built.planeHalfHeight;

    this.attachVertexColors(built.geometry);

    if (this.points) {
      const old = this.points.geometry;
      this.points.geometry = built.geometry;
      old.dispose();
    } else {
      this.points = new THREE.Points(built.geometry, this.pointsMaterial);
      this.points.frustumCulled = false;
      this.points.renderOrder = 1;
      this.scene.add(this.points);
    }

    const posAttr = built.geometry.getAttribute("position");
    if (posAttr?.array) {
      this.restPositions = new Float32Array(
        posAttr.array as Float32Array | ArrayLike<number>,
      );
    }

    built.geometry.computeBoundingSphere();
    this.fitOrbitToParticles();

    if (built.particleCount === 0) {
      console.warn(
        "[EchoParticleScene] No particles generated — check image path and luminanceFloor.",
      );
    }

    if (built.particleCount > ABS_MAX_PARTICLES) {
      console.warn(
        `[EchoParticleScene] particleCount ${built.particleCount} exceeds cap ${ABS_MAX_PARTICLES}`,
      );
    }
  }

  private startFade(to: number, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      this.fade = {
        active: true,
        from: this.pointsMaterial.opacity,
        to,
        startWallMs: performance.now(),
        duration: durationMs,
        resolve,
      };
    });
  }

  private fitOrbitToParticles() {
    if (
      this.interaction !== EchoParticleInteraction.OrbitControls ||
      !this.orbitControls ||
      !this.points
    ) {
      return;
    }
    const sphere = this.points.geometry.boundingSphere;
    if (!sphere) return;

    const c = sphere.center;
    const r = Math.max(sphere.radius, 0.08);
    this.orbitControls.target.copy(c);
    this.camera.position.set(c.x, c.y + r * 0.1, c.z + r * 2.85);
    this.orbitControls.minDistance = r * 0.42;
    this.orbitControls.maxDistance = r * 12;
    this.orbitControls.update();
  }

  /** Per-vertex jitter from FFT; mesh transform stays identity so OrbitControls-only camera motion. */
  private applyOrbitAudioPointJitter(t: number) {
    if (!this.points || !this.restPositions) return;

    const geom = this.points.geometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute | null;
    const rndAttr = geom.getAttribute("aRandom") as THREE.BufferAttribute | null;
    if (!posAttr?.array || !rndAttr?.array) return;

    const arr = posAttr.array as Float32Array;
    const rest = this.restPositions;
    const rnd = rndAttr.array as Float32Array;
    const n = Math.min(rest.length / 3, arr.length / 3, rnd.length);

    const B = this.audioSmooth.bass;
    const M = this.audioSmooth.mid;
    const H = this.audioSmooth.high;
    const L = this.audioSmooth.level;

    const drive = THREE.MathUtils.clamp(
      B * 0.42 + M * 0.36 + H * 0.34 + L * 0.28,
      0,
      1,
    );

    if (drive < 0.002) {
      arr.set(rest);
      posAttr.needsUpdate = true;
      return;
    }

    const amp = drive * 0.26;

    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      const r = rnd[i] ?? 0.5;
      const phase = r * 6283.185;

      const fx = 4.2 + r * 12 + M * 7;
      const fy = 5.1 + r * 10 + H * 8;
      const fz = 3.6 + r * 11 + B * 9;

      const ax =
        Math.sin(t * fx + phase) * Math.cos(t * fx * 0.29 + r * 54.3);
      const ay =
        Math.cos(t * fy + phase * 1.09) * Math.sin(t * fy * 0.31 + r * 41.7);
      const az =
        Math.sin(t * fz + phase * 0.87) * (0.42 + r * 0.58);

      const w = amp * (0.38 + r * 0.62);
      arr[i3] = rest[i3]! + ax * w;
      arr[i3 + 1] = rest[i3 + 1]! + ay * w;
      arr[i3 + 2] = rest[i3 + 2]! + az * w * 0.52;
    }

    posAttr.needsUpdate = true;
  }

  private tick = () => {
    this.rafId = requestAnimationFrame(this.tick);
    if (this.disposed) return;

    const t = this.clock.getElapsedTime();

    if (this.fade.active) {
      const elapsedMs = performance.now() - this.fade.startWallMs;
      const u = Math.min(1, elapsedMs / this.fade.duration);
      const e = u * u * (3 - 2 * u);
      this.pointsMaterial.opacity = THREE.MathUtils.lerp(
        this.fade.from,
        this.fade.to,
        e,
      );
      if (u >= 1) {
        this.pointsMaterial.opacity = this.fade.to;
        this.fade.active = false;
        this.fade.resolve?.();
        this.fade.resolve = null;
      }
    }

    const personality = this.currentPersonality ?? "drift";

    const useDomOrbit =
      this.interaction === EchoParticleInteraction.OrbitControls;

    if (useDomOrbit && this.orbitControls) {
      this.orbitControls.update();
    }

    if (this.interaction === EchoParticleInteraction.OrbitViewport) {
      this.viewportNdcSmooth.x +=
        (this.viewportNdcTarget.x - this.viewportNdcSmooth.x) *
        VIEWPORT_NDC_LERP;
      this.viewportNdcSmooth.y +=
        (this.viewportNdcTarget.y - this.viewportNdcSmooth.y) *
        VIEWPORT_NDC_LERP;

      if (!this.dragPointerDown) {
        this.orbitDragYawAccum *= ORBIT_DRAG_DECAY;
        this.orbitDragPitchAccum *= ORBIT_DRAG_DECAY;
      }
    }

    const isOrbit = this.interaction === EchoParticleInteraction.OrbitViewport;

    if (!isOrbit && !useDomOrbit) {
      const mouseLerp = MOUSE_LERP_CANVAS[personality];
      this.mouseSmooth.x +=
        (this.mouseTarget.x - this.mouseSmooth.x) * mouseLerp;
      this.mouseSmooth.y +=
        (this.mouseTarget.y - this.mouseSmooth.y) * mouseLerp;
      if (this.points) {
        const s = 0.012;
        this.points.position.set(
          this.mouseSmooth.x * s,
          this.mouseSmooth.y * s,
          0,
        );
      }
    }

    const bobX = Math.sin(t * 0.068) * 0.085;
    const bobY = Math.cos(t * 0.052) * 0.055;

    if (useDomOrbit && this.points) {
      this.points.scale.setScalar(1);
      this.points.rotation.set(0, 0, 0);
      this.points.position.set(0, 0, 0);

      const raw = sampleEchoAudioBands();
      const k = AUDIO_SMOOTH;
      this.audioSmooth.bass += (raw.bass - this.audioSmooth.bass) * k;
      this.audioSmooth.mid += (raw.mid - this.audioSmooth.mid) * k;
      this.audioSmooth.high += (raw.high - this.audioSmooth.high) * k;
      this.audioSmooth.level += (raw.level - this.audioSmooth.level) * k;

      this.pointsMaterial.size = this.basePointSize;
      this.applyOrbitAudioPointJitter(t);
    }

    if (!useDomOrbit && isOrbit) {
      const hoverYaw = this.viewportNdcSmooth.x * ORBIT_HOVER_YAW_GAIN;
      const hoverPitch = this.viewportNdcSmooth.y * ORBIT_HOVER_PITCH_GAIN;

      const yawTot = THREE.MathUtils.clamp(
        hoverYaw + this.orbitDragYawAccum,
        -1.25,
        1.25,
      );
      const pitchTot = THREE.MathUtils.clamp(
        hoverPitch + this.orbitDragPitchAccum,
        -1.08,
        1.08,
      );

      const distBreath =
        ORBIT_DIST_BASE + Math.sin(t * 0.031) * 0.09 + bobX * 0.25;

      const cx =
        Math.sin(yawTot) * distBreath * Math.cos(pitchTot) + bobX * 1.65;
      const cy = 0.14 + Math.sin(pitchTot) * distBreath + bobY;
      const cz = Math.cos(yawTot) * distBreath * Math.cos(pitchTot);

      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(
        Math.sin(yawTot * 0.35) * 0.45,
        Math.sin(pitchTot * 0.28) * 0.32,
        0,
      );
    } else if (!useDomOrbit) {
      const parallaxScale =
        personality === "drift" ? 0.14 : personality === "ripple" ? 0.42 : 0.34;

      const posGain =
        personality === "drift" ? 0.042 : personality === "ripple" ? 0.065 : 0.056;
      const lookGain =
        personality === "drift" ? 0.09 : personality === "ripple" ? 0.15 : 0.12;

      this.camera.position.x =
        bobX + this.mouseSmooth.x * parallaxScale * posGain;
      this.camera.position.y =
        0.14 + bobY + this.mouseSmooth.y * parallaxScale * posGain * 0.92;
      this.camera.position.z = 9.25 + Math.sin(t * 0.031) * 0.045;
      this.camera.lookAt(
        this.mouseSmooth.x * lookGain * parallaxScale,
        this.mouseSmooth.y * lookGain * parallaxScale * 0.88,
        0,
      );
    }

    this.renderer.render(this.scene, this.camera);
  };

  private resize = () => {
    const canvasRect = this.canvas.getBoundingClientRect();
    let w = Math.round(canvasRect.width);
    let h = Math.round(canvasRect.height);
    if (w < 8 || h < 8) {
      let el: HTMLElement | null = this.canvas.parentElement;
      while (el) {
        const r = el.getBoundingClientRect();
        if (r.width >= 8 && r.height >= 8) {
          w = Math.round(r.width);
          h = Math.round(r.height);
          break;
        }
        el = el.parentElement;
      }
    }
    w = Math.max(8, w);
    h = Math.max(8, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  };

  private onResize = () => this.resize();

  private ndcFromClient(clientX: number, clientY: number) {
    const w = Math.max(window.innerWidth, 1);
    const h = Math.max(window.innerHeight, 1);
    const nx = clientX / w - 0.5;
    const ny = -(clientY / h - 0.5);
    return { nx: nx * 2, ny: ny * 2 };
  }

  private onViewportPointerMoveRef = (e: MouseEvent | PointerEvent) => {
    if (this.disposed || this.interaction !== EchoParticleInteraction.OrbitViewport)
      return;

    const ndc = this.ndcFromClient(e.clientX, e.clientY);
    this.viewportNdcTarget.set(ndc.nx, ndc.ny);

    if ("buttons" in e && this.dragPointerDown && (e.buttons & 1) !== 0) {
      this.orbitDragYawAccum += e.movementX * ORBIT_DRAG_RAD_PER_PX;
      this.orbitDragPitchAccum -= e.movementY * ORBIT_DRAG_RAD_PER_PX;

      this.orbitDragYawAccum = THREE.MathUtils.clamp(
        this.orbitDragYawAccum,
        -2.35,
        2.35,
      );
      this.orbitDragPitchAccum = THREE.MathUtils.clamp(
        this.orbitDragPitchAccum,
        -2.0,
        2.0,
      );
    }
  };

  private onViewportPointerDown = (e: PointerEvent) => {
    if (this.disposed || this.interaction !== EchoParticleInteraction.OrbitViewport)
      return;
    if (e.button === 0) this.dragPointerDown = true;
  };

  private onViewportPointerUp = () => {
    this.dragPointerDown = false;
  };

  private setMouseFromCanvasEvent(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const fx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const fy = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const nx = fx * 2 - 1;
    const ny = -(fy * 2 - 1);
    this.mouseTarget.set(nx * this.planeHalfWidth, ny * this.planeHalfHeight);
  }

  private onMouseMove = (e: MouseEvent) => {
    this.setMouseFromCanvasEvent(e);
  };

  private onWindowMouseMove = (e: MouseEvent) => {
    this.setMouseFromCanvasEvent(e);
  };
}
