import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { BlobSurface } from "./BlobSurface";
import { ecologySnapshots } from "./personalities";
import {
  cloneEcologySnapshot,
  lerpEcologySnapshots,
} from "./snapshotUtils";
import type { EcologyPersonalityId } from "./types";
import type { EcologyUniformSnapshot } from "./types";

const TRANSITION_SEC = 1.65;

/** 단일 메시 블롭 — 포인트 클라우드 없음 */
export class ShellBlobExperience {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private readonly canvas: HTMLCanvasElement;

  private readonly blob: BlobSurface;
  private readonly controls: OrbitControls;

  private readonly clock = new THREE.Clock();
  private disposed = false;
  private rafId = 0;

  private personalityId: EcologyPersonalityId = "drift";
  private paletteFromId: EcologyPersonalityId = "drift";
  private currentSnapshot: EcologyUniformSnapshot;
  private transitionFrom: EcologyUniformSnapshot | null = null;
  private transitionTargetId: EcologyPersonalityId = "drift";
  private transitionU = 1;

  constructor(canvas: HTMLCanvasElement, initial: EcologyPersonalityId) {
    this.canvas = canvas;
    this.personalityId = initial;
    this.paletteFromId = initial;
    this.transitionTargetId = initial;
    this.currentSnapshot = cloneEcologySnapshot(ecologySnapshots[initial]);

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

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.08, 220);
    this.camera.position.set(0, 0.45, 11.2);

    const oc = new OrbitControls(this.camera, canvas);
    oc.enableDamping = true;
    oc.rotateSpeed = 0.5;
    oc.dampingFactor = 0.25;
    oc.enablePan = false;
    oc.enableZoom = false;
    oc.minDistance = 5.2;
    oc.maxDistance = 38;
    oc.minPolarAngle = 0.1;
    oc.maxPolarAngle = Math.PI - 0.1;
    oc.target.set(0, 0, 0);
    oc.update();
    this.controls = oc;

    this.blob = new BlobSurface();
    this.blob.applySnapshot(this.currentSnapshot, initial, initial, 1);
    this.scene.add(this.blob.group);

    window.addEventListener("resize", this.onResize);
    canvas.style.cursor = "grab";

    this.resize();
    this.rafId = requestAnimationFrame(this.tick);
  }

  resizeNow() {
    if (!this.disposed) this.resize();
  }

  setPersonality(id: EcologyPersonalityId) {
    if (this.disposed) return;
    if (id === this.transitionTargetId && this.transitionU >= 1) return;

    this.paletteFromId = this.personalityId;
    this.transitionFrom = cloneEcologySnapshot(this.currentSnapshot);
    this.transitionTargetId = id;
    this.personalityId = id;
    this.transitionU = 0;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.onResize);

    this.controls.dispose();
    this.blob.dispose();
    this.renderer.dispose();
  }

  private resize = () => {
    const w = Math.max(8, Math.round(this.canvas.clientWidth));
    const h = Math.max(8, Math.round(this.canvas.clientHeight));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    const pr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pr);
  };

  private stepTransition(dt: number) {
    if (this.transitionU >= 1) return;

    this.transitionU = Math.min(1, this.transitionU + dt / TRANSITION_SEC);
    const e = this.transitionU * this.transitionU * (3 - 2 * this.transitionU);

    if (!this.transitionFrom) {
      this.transitionFrom = cloneEcologySnapshot(this.currentSnapshot);
    }

    this.currentSnapshot = lerpEcologySnapshots(
      this.transitionFrom,
      ecologySnapshots[this.transitionTargetId],
      e,
    );

    if (this.transitionU >= 1) {
      this.transitionFrom = null;
    }
  }

  private tick = () => {
    this.rafId = requestAnimationFrame(this.tick);
    if (this.disposed) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    this.stepTransition(dt);

    const s = this.currentSnapshot;

    this.controls.update();

    this.blob.setTime(t);

    const paletteT =
      this.transitionU >= 1
        ? 1
        : this.transitionU * this.transitionU * (3 - 2 * this.transitionU);
    this.blob.applySnapshot(
      s,
      this.paletteFromId,
      this.personalityId,
      paletteT,
    );

    this.renderer.setClearColor(0x000000, 0);
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    this.resize();
  };
}
