"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

import { getPresenceWeight } from "@/lib/aggregateEncountersByPeer";
import {
  encounterDisplayName,
  encounterDisplayPalette,
} from "@/lib/encounterDisplay";
import {
  ensureDisplayFontsLoaded,
  resolveDisplayFontFamily,
} from "@/lib/displayFont";
import type { EchoDevice, Encounter } from "@/lib/types";

const DEFAULT_ECHO_ACCENT = "#FF9F6E";
const SCENE_FOG = 0xfcfaf6;
/** Lowers orbits + terrain in the viewport so the cluster sits nearer screen center. */
const SCENE_LAYOUT_Y = -2.05;
const SCENE_FOCUS = new THREE.Vector3(0, -1.12, -3.2);

type SonicPresenceLandscapeProps = {
  device: EchoDevice | null;
  encounters: Encounter[];
  title?: ReactNode;
  soundControl?: ReactNode;
  onSelectEncounter?: (encounter: Encounter) => void;
  onSelectSelf?: () => void;
  playingEncounterId?: string | null;
  playingSelf?: boolean;
  variant?: "full" | "echoOnly";
  /** Overview: no orbit play chrome; dim non-playing peers while audio plays. */
  presencePlaybackMode?: "default" | "overview";
  /** Fill the parent box instead of the full viewport (e.g. onboarding preview). */
  embedded?: boolean;
};

type PresenceBody = {
  encounter: Encounter;
  anchor: THREE.Group;
  shell: THREE.Sprite;
  core: THREE.Sprite;
  halo: THREE.Sprite;
  playCenter: THREE.Sprite | null;
  playIcon: THREE.Sprite | null;
  label: THREE.Sprite | null;
  timeLabel: THREE.Sprite | null;
  haloRestColor: THREE.Color;
  haloBaseOpacity: number;
  haloBaseScale: number;
  ringBaseOpacity: number;
  base: THREE.Vector3;
  baseScale: number;
  phase: number;
  driftRadius: number;
  driftSpeed: number;
  driftTilt: number;
  bob: number;
  spin: number;
};

const LABEL_TEXT_COLOR = "#1a1a1a";
const LABEL_TIME_COLOR = "#5c5c5c";

function hashUnit(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (Math.abs(hash) % 10000) / 10000;
}

function makeGlowTexture(color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, `${color}8f`);
  gradient.addColorStop(0.34, `${color}82`);
  gradient.addColorStop(0.72, `${color}46`);
  gradient.addColorStop(1, `${color}00`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeOrbitRingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const ring = ctx.createRadialGradient(128, 128, 0, 128, 128, 122);
  ring.addColorStop(0, "rgba(255,255,255,0.96)");
  ring.addColorStop(0.42, "rgba(255,255,255,0.98)");
  ring.addColorStop(0.68, "rgba(255,255,255,1)");
  ring.addColorStop(0.88, "rgba(255,255,255,0.96)");
  ring.addColorStop(0.96, "rgba(255,255,255,0.64)");
  ring.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = ring;
  ctx.fillRect(0, 0, 256, 256);

  const edge = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  edge.addColorStop(0, "rgba(255,255,255,0.18)");
  edge.addColorStop(0.62, "rgba(255,255,255,0.2)");
  edge.addColorStop(0.82, "rgba(255,255,255,0.72)");
  edge.addColorStop(0.92, "rgba(255,255,255,1)");
  edge.addColorStop(0.98, "rgba(255,255,255,0.76)");
  edge.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeDotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.62, "rgba(255,255,255,0.92)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makePlayCenterTexture(color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
  glow.addColorStop(0, `${color}f2`);
  glow.addColorStop(0.48, `${color}b8`);
  glow.addColorStop(0.76, "rgba(255,255,255,0.76)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);

  ctx.beginPath();
  ctx.arc(64, 64, 24, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makePlayingIconSprite() {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.beginPath();
  ctx.arc(48, 48, 30, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(26,26,26,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(40, 32);
  ctx.lineTo(40, 64);
  ctx.lineTo(66, 48);
  ctx.closePath();
  ctx.fillStyle = "rgba(26,26,26,0.82)";
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.34, 0.34, 1);
  sprite.visible = false;
  return sprite;
}

function groundYAt(x: number, z: number) {
  const centerRise = Math.exp(-(x * x) / 180 - ((z + 5) * (z + 5)) / 120);
  return (
    -3.15 +
    centerRise * 2.05 +
    Math.sin(x * 0.42) * 0.82 +
    Math.cos(z * 0.35) * 0.68 +
    Math.sin((x + z) * 0.22) * 0.96 +
    Math.cos((x - z) * 0.18) * 0.52
  );
}

function makeTextSprite(
  label: string,
  color: string,
  options?: { compact?: boolean; variant?: "name" | "time" },
) {
  const variant = options?.variant ?? "name";
  const compact = variant === "name" && (options?.compact ?? false);
  const canvas = document.createElement("canvas");
  canvas.width = variant === "time" ? 320 : compact ? 384 : 512;
  canvas.height = variant === "time" ? 64 : compact ? 96 : 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const fontSize = variant === "time" ? 22 : compact ? 30 : 38;
  const family = resolveDisplayFontFamily();
  ctx.font = `400 ${fontSize}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: variant === "time" ? 0.88 : compact ? 0.82 : 1,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  if (variant === "time") {
    sprite.scale.set(1.72, 0.34, 1);
  } else {
    sprite.scale.set(compact ? 2.05 : 3.05, compact ? 0.48 : 0.74, 1);
  }
  return sprite;
}

function labelYAboveSphere(sphereRadius: number, labelScaleY: number) {
  return sphereRadius + labelScaleY * 0.5 + 0.04;
}

const NAME_LABEL_FONT = 30;
const NAME_LABEL_CANVAS_H = 96;
const TIME_LABEL_FONT = 22;
const TIME_LABEL_CANVAS_H = 64;
const LABEL_STACK_GAP = 0.015;

function spriteTextHalfHeight(
  fontSize: number,
  canvasHeight: number,
  scaleY: number,
) {
  return ((fontSize * 0.5) / canvasHeight) * scaleY;
}

function timeLabelYBelowName(
  nameY: number,
  nameScaleY: number,
  timeScaleY: number,
) {
  return (
    nameY -
    spriteTextHalfHeight(NAME_LABEL_FONT, NAME_LABEL_CANVAS_H, nameScaleY) -
    LABEL_STACK_GAP -
    spriteTextHalfHeight(TIME_LABEL_FONT, TIME_LABEL_CANVAS_H, timeScaleY)
  );
}

function makeAbstractGround() {
  const group = new THREE.Group();
  const positions: number[] = [];
  const colors: number[] = [];
  const fogColor = new THREE.Color(SCENE_FOG);
  const dotColor = new THREE.Color(0xc8c4bc);
  const columns = 260;
  const rows = 168;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const u = column / (columns - 1);
      const v = row / (rows - 1);
      const x = (u - 0.5) * 50;
      const z = 11 - v * 40;
      const y = groundYAt(x, z);
      positions.push(x, y, z);
      const dist = Math.hypot(x * 0.9, z + 4);
      const fade = Math.max(0, Math.min(1, 1 - (dist - 14) / 16));
      const mixed = dotColor.clone().lerp(fogColor, 1 - fade);
      colors.push(mixed.r, mixed.g, mixed.b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const dotTexture = makeDotTexture();
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      map: dotTexture,
      alphaMap: dotTexture,
      transparent: true,
      opacity: 0.38,
      size: 0.14,
      depthWrite: false,
      sizeAttenuation: true,
      vertexColors: true,
    }),
  );
  group.add(points);
  return group;
}

function makeAmbientMotes(accentHex: string) {
  const group = new THREE.Group();
  const accent = new THREE.Color(accentHex);
  const clusters = [
    { x: -14, z: 2, spread: 5.2 },
    { x: -7, z: -10, spread: 4.6 },
    { x: 8, z: 1, spread: 5 },
    { x: 15, z: -12, spread: 5.4 },
    { x: 1, z: -20, spread: 6 },
    { x: 18, z: 7, spread: 4.2 },
  ];
  for (let index = 0; index < 88; index += 1) {
    const size = 0.03 + hashUnit(`mote:${index}:s`) * 0.08;
    const geometry = new THREE.SphereGeometry(size, 20, 20);
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#fafaf8"),
      emissive: accent,
      emissiveIntensity: 0.1 + hashUnit(`mote:${index}:e`) * 0.14,
      transparent: true,
      opacity: 0.18 + hashUnit(`mote:${index}:o`) * 0.22,
      roughness: 0.04,
      transmission: 0.52,
      thickness: 0.35,
    });
    const mote = new THREE.Mesh(geometry, material);
    const cluster = clusters[index % clusters.length]!;
    const angle = hashUnit(`mote:${index}:a`) * Math.PI * 2;
    const distance = Math.sqrt(hashUnit(`mote:${index}:d`)) * cluster.spread;
    const x = cluster.x + Math.cos(angle) * distance;
    const z = cluster.z + Math.sin(angle) * distance;
    mote.position.set(
      x,
      groundYAt(x, z) + 0.2 + hashUnit(`mote:${index}:y`) * 1.4,
      z,
    );
    group.add(mote);
  }
  return group;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.LineLoop ||
      child instanceof THREE.LineSegments ||
      child instanceof THREE.Points
    ) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      for (const material of materials) {
        material.dispose();
        if ("map" in material) material.map?.dispose();
        if ("alphaMap" in material) material.alphaMap?.dispose();
      }
    }
    if (child instanceof THREE.Sprite) {
      child.material.map?.dispose();
      child.material.dispose();
    }
  });
}

function formatEncounterWindow(encounter: Encounter) {
  const format = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const start = new Date(encounter.startedAt);
  const end = new Date(encounter.endedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Time unknown";
  }
  return `${format.format(start)} – ${format.format(end)}`;
}

export function SonicPresenceLandscape({
  device,
  encounters,
  title,
  soundControl,
  onSelectEncounter,
  onSelectSelf,
  playingEncounterId = null,
  playingSelf = false,
  variant = "full",
  presencePlaybackMode = "default",
  embedded = false,
}: SonicPresenceLandscapeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const playingEncounterIdRef = useRef(playingEncounterId);
  const playingSelfRef = useRef(playingSelf);
  const presencePlaybackModeRef = useRef(presencePlaybackMode);
  const cameraStateRef = useRef({ yaw: 0, pitch: 0, zoom: 1 });
  playingEncounterIdRef.current = playingEncounterId;
  playingSelfRef.current = playingSelf;
  presencePlaybackModeRef.current = presencePlaybackMode;

  useEffect(() => {
    let cancelled = false;
    void ensureDisplayFontsLoaded()
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setFontReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !fontReady) return;
    const echoOnly = variant === "echoOnly";

    const scene = new THREE.Scene();
    if (!echoOnly) {
      scene.fog = new THREE.FogExp2(SCENE_FOG, 0.028);
    }

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
    const echoOnlyFocus = new THREE.Vector3(0, 0.64, 0.1);
    camera.position.set(0, echoOnly ? 2.35 : 5.4, echoOnly ? 6.7 : 15.5);
    camera.lookAt(echoOnly ? echoOnlyFocus : SCENE_FOCUS);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.width = "100%";
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambient);
    const key = new THREE.PointLight(0xffffff, 2.6, 42);
    key.position.set(0, 6, 8);
    scene.add(key);
    const horizon = new THREE.PointLight(0xfff0e8, 1.6, 36);
    horizon.position.set(-8, -2, -10);
    scene.add(horizon);

    const world = new THREE.Group();
    world.position.y = echoOnly ? 0 : SCENE_LAYOUT_Y;
    world.rotation.x = echoOnly ? -0.04 : -0.12;
    scene.add(world);

    const ground = echoOnly ? null : makeAbstractGround();
    if (ground) world.add(ground);
    const echoAccent = device?.echoColor ?? DEFAULT_ECHO_ACCENT;
    const motes = echoOnly ? null : makeAmbientMotes(echoAccent);
    if (motes) world.add(motes);
    const centerGroup = new THREE.Group();
    const centerShell = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeOrbitRingTexture(),
        color: new THREE.Color("#ffffff"),
        transparent: true,
        opacity: 1,
        blending: THREE.NormalBlending,
        depthWrite: false,
      }),
    );
    centerShell.scale.set(2.65, 2.65, 1);
    const centerCore = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(echoAccent),
        color: new THREE.Color(echoAccent),
        transparent: true,
        opacity: 0.001,
        depthWrite: false,
      }),
    );
    centerCore.scale.set(2.3, 2.3, 1);
    const centerHaloTexture = makeGlowTexture(echoAccent);
    const centerHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: centerHaloTexture,
        color: new THREE.Color(echoAccent),
        transparent: true,
        opacity: 0.46,
        blending: THREE.NormalBlending,
        depthWrite: false,
      }),
    );
    centerHalo.scale.set(4.15, 4.15, 1);
    const centerShellRadius = 1.32;
    centerGroup.add(centerHalo);
    centerGroup.add(centerShell);
    centerGroup.add(centerCore);
    const centerShellMaterial = centerShell.material as THREE.SpriteMaterial;
    const centerLabel = echoOnly
      ? null
      : makeTextSprite(device?.echoName ?? "my Echo", LABEL_TEXT_COLOR, {
          compact: true,
        });
    if (centerLabel) {
      centerLabel.position.y = labelYAboveSphere(
        centerShellRadius,
        centerLabel.scale.y,
      );
      centerGroup.add(centerLabel);
    }
    centerGroup.position.set(0, echoOnly ? 0.64 : 0.25, echoOnly ? 0.1 : 0.2);
    if (echoOnly) centerGroup.scale.setScalar(1.56);
    world.add(centerGroup);

    const densityScale = echoOnly
      ? 1
      : Math.max(
          0.46,
          Math.min(1, 1 - Math.max(0, encounters.length - 10) * 0.035),
        );

    const showOrbitPlaybackChrome = presencePlaybackMode !== "overview";

    const bodies: PresenceBody[] = encounters.map((encounter, index) => {
      const palette = encounterDisplayPalette(encounter);
      const [start, mid, end] = palette;
      const durationWeight = getPresenceWeight(
        encounter.durationSec,
        encounter.meetingCount ?? 1,
      );
      const angle =
        index * 2.399963229728653 + hashUnit(`${encounter.id}:angle`) * 0.8;
      const radius =
        2.6 +
        (1 - durationWeight) * 14 +
        hashUnit(`${encounter.id}:r`) * (1.2 + (1 - durationWeight) * 2.2);
      const vertical =
        1.2 + durationWeight * 1.2 + hashUnit(`${encounter.id}:y`) * 2.8;
      const depth =
        -9.5 +
        durationWeight * 9.8 +
        (hashUnit(`${encounter.id}:z`) - 0.5) * 2.2;
      const size = (0.14 + durationWeight * 1.08) * densityScale;
      const anchor = new THREE.Group();
      const base = new THREE.Vector3(
        Math.cos(angle) * radius,
        vertical,
        Math.sin(angle) * radius * 0.82 + depth,
      );
      anchor.position.copy(base);

      const accent = mid ?? start ?? DEFAULT_ECHO_ACCENT;
      const ringBaseOpacity = 0.94 + durationWeight * 0.06;
      const shell = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeOrbitRingTexture(),
          color: new THREE.Color("#ffffff"),
          transparent: true,
          opacity: ringBaseOpacity,
          blending: THREE.NormalBlending,
          depthWrite: false,
        }),
      );
      shell.scale.set(size * 2.45, size * 2.45, 1);
      anchor.add(shell);

      const core = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeGlowTexture(accent),
          color: new THREE.Color(accent),
          transparent: true,
          opacity: 0.001,
          depthWrite: false,
        }),
      );
      core.scale.set(size * 2.2, size * 2.2, 1);
      anchor.add(core);

      const playCenter = showOrbitPlaybackChrome
        ? new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: makePlayCenterTexture(accent),
              transparent: true,
              opacity: 0,
              depthWrite: false,
            }),
          )
        : null;
      if (playCenter) {
        playCenter.scale.set(size * 0.82, size * 0.82, 1);
        playCenter.visible = false;
        anchor.add(playCenter);
      }

      const haloTexture = makeGlowTexture(start);
      const haloRestColor = new THREE.Color(end);
      const haloBaseOpacity =
        (0.42 + durationWeight * 0.18) * (0.82 + densityScale * 0.18);
      const haloBaseScale = size * (3.25 + densityScale * 1.75);
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: haloTexture,
          color: haloRestColor.clone(),
          transparent: true,
          opacity: haloBaseOpacity,
          blending: THREE.NormalBlending,
          depthWrite: false,
        }),
      );
      halo.scale.set(haloBaseScale, haloBaseScale, 1);
      anchor.add(halo);

      // `otherEchoName` is attached by the today API via otherEchoModelName -> EchoDevice.firmwareModelName.
      const label = makeTextSprite(
        encounterDisplayName(encounter),
        LABEL_TEXT_COLOR,
        { compact: true },
      );
      const timeLabel = makeTextSprite(
        formatEncounterWindow(encounter),
        LABEL_TIME_COLOR,
        { variant: "time" },
      );
      const playIcon =
        showOrbitPlaybackChrome && label ? makePlayingIconSprite() : null;
      if (label) {
        const nameY = labelYAboveSphere(size, label.scale.y);
        label.position.y = nameY;
        anchor.add(label);
        if (playIcon) {
          playIcon.position.y = nameY + 0.34;
          anchor.add(playIcon);
        }
        if (timeLabel) {
          timeLabel.position.y = timeLabelYBelowName(
            nameY,
            label.scale.y,
            timeLabel.scale.y,
          );
          timeLabel.visible = false;
          anchor.add(timeLabel);
        }
      }

      world.add(anchor);
      return {
        encounter,
        anchor,
        shell,
        core,
        halo,
        playCenter,
        playIcon: label ? playIcon : null,
        label,
        timeLabel: label ? timeLabel : null,
        haloRestColor,
        haloBaseOpacity,
        haloBaseScale,
        ringBaseOpacity,
        base,
        baseScale: size,
        phase: hashUnit(`${encounter.id}:phase`) * Math.PI * 2,
        driftRadius:
          (0.35 +
            (1 - durationWeight) * 2.45 +
            hashUnit(`${encounter.id}:drift`) *
              (0.35 + (1 - durationWeight) * 1.25)) *
          (0.72 + densityScale * 0.28),
        driftSpeed:
          0.028 +
          (1 - durationWeight) * 0.08 +
          hashUnit(`${encounter.id}:speed`) * 0.055,
        driftTilt: 0.22 + (1 - durationWeight) * 0.65,
        bob:
          0.22 +
          (1 - durationWeight) * 0.44 +
          hashUnit(`${encounter.id}:bob`) * 0.36,
        spin: 0.2 + hashUnit(`${encounter.id}:spin`) * 0.5,
      };
    });

    const starMaterial = echoOnly
      ? null
      : new THREE.PointsMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.42,
          size: 0.035,
          depthWrite: false,
        });
    const starPositions: number[] = [];
    for (let i = 0; i < 180; i += 1) {
      starPositions.push(
        (hashUnit(`star:${i}:x`) - 0.5) * 30,
        hashUnit(`star:${i}:y`) * 12 - 1,
        -10 - hashUnit(`star:${i}:z`) * 28,
      );
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions, 3),
    );
    const stars = starMaterial ? new THREE.Points(starGeometry, starMaterial) : null;
    if (stars) scene.add(stars);

    const focus = echoOnly ? echoOnlyFocus.clone() : SCENE_FOCUS.clone();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let lastPointerDown = { x: 0, y: 0 };
    const viewport = { width: 1, height: 1, isMobile: false };
    let hoverX = 0;
    let hoverY = 0;
    let yaw = cameraStateRef.current.yaw;
    let pitch = cameraStateRef.current.pitch;
    let zoom = cameraStateRef.current.zoom;
    let isDragging = false;
    let lastTouchDistance: number | null = null;
    const setHoveredBody = (body: PresenceBody | null) => {
      for (const item of bodies) {
        if (item.timeLabel) item.timeLabel.visible = item === body;
      }
    };
    const pickHover = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(
        [centerShell, ...bodies.map((body) => body.shell)],
        false,
      )[0];
      if (!hit) {
        container.style.cursor = isDragging ? "grabbing" : "grab";
        setHoveredBody(null);
        return;
      }
      if (hit.object === centerShell) {
        container.style.cursor = onSelectSelf ? "pointer" : "grab";
        setHoveredBody(null);
        return;
      }
      const body = bodies.find((item) => item.shell === hit.object) ?? null;
      container.style.cursor = "pointer";
      setHoveredBody(body);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!viewport.isMobile) {
        hoverX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        hoverY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      }
      if (!isDragging) pickHover(event);
      if (isDragging) {
        yaw += event.movementX * (viewport.isMobile ? 0.014 : 0.008);
        pitch = Math.max(
          -0.62,
          Math.min(
            0.62,
            pitch + event.movementY * (viewport.isMobile ? 0.011 : 0.006),
          ),
        );
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      isDragging = true;
      setHoveredBody(null);
      lastPointerDown = { x: event.clientX, y: event.clientY };
      container.setPointerCapture(event.pointerId);
    };
    const onPointerUp = (event: PointerEvent) => {
      const moved = Math.hypot(
        event.clientX - lastPointerDown.x,
        event.clientY - lastPointerDown.y,
      );
      if (moved < 8) {
        const rect = container.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        raycaster.setFromCamera(pointer, camera);
        const selfHit = raycaster.intersectObject(centerShell, false)[0];
        if (selfHit) {
          onSelectSelf?.();
          isDragging = false;
          if (container.hasPointerCapture(event.pointerId)) {
            container.releasePointerCapture(event.pointerId);
          }
          return;
        }
        const hit = raycaster.intersectObjects(
          bodies.map((body) => body.core),
          false,
        )[0];
        const selected = hit
          ? bodies.find((body) => body.core === hit.object)
          : null;
        if (selected) onSelectEncounter?.(selected.encounter);
      }
      isDragging = false;
      if (container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
    };
    const onPointerLeave = () => setHoveredBody(null);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    container.addEventListener("pointerleave", onPointerLeave);

    const touchDistance = (touches: TouchList) => {
      if (touches.length < 2) return null;
      const first = touches.item(0);
      const second = touches.item(1);
      if (!first || !second) return null;
      return Math.hypot(
        first.clientX - second.clientX,
        first.clientY - second.clientY,
      );
    };
    const onTouchStart = (event: TouchEvent) => {
      lastTouchDistance = touchDistance(event.touches);
    };
    const onTouchMove = (event: TouchEvent) => {
      const nextDistance = touchDistance(event.touches);
      if (nextDistance !== null && lastTouchDistance !== null) {
        zoom = Math.max(
          0.68,
          Math.min(1.42, zoom - (nextDistance - lastTouchDistance) * 0.003),
        );
        lastTouchDistance = nextDistance;
        event.preventDefault();
      }
    };
    const onTouchEnd = () => {
      lastTouchDistance = null;
    };
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", onTouchEnd);

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      viewport.width = width;
      viewport.height = height;
      viewport.isMobile = width < 768 || width / height < 0.78;
      camera.fov = viewport.isMobile ? 62 : 48;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let frame = 0;
    const startedAt = performance.now();
    const centerAccentColor = new THREE.Color(echoAccent);
    const dimCenterHaloTint = new THREE.Color("#d8d4cc");
    const inactiveDimTint = new THREE.Color("#ccc8c0");
    const animate = (now: number) => {
      const t = (now - startedAt) / 1000;
      const cameraYaw = yaw + (viewport.isMobile ? 0 : hoverX * 0.16);
      const cameraPitch = pitch + (viewport.isMobile ? 0 : hoverY * 0.08);
      const radius = echoOnly
        ? (viewport.isMobile ? 7.6 : 6.7) * zoom
        : (viewport.isMobile ? 21 : 17) * zoom;
      const baseHeight = echoOnly ? 2.35 : viewport.isMobile ? 7.4 : 5.2;
      const heightRange = echoOnly ? 1.2 : viewport.isMobile ? 7.2 : 5.2;
      camera.position.set(
        Math.sin(cameraYaw) * radius,
        baseHeight + Math.sin(cameraPitch) * heightRange,
        focus.z + Math.cos(cameraYaw) * radius,
      );
      camera.lookAt(focus);
      world.rotation.y = Math.sin(t * 0.13) * 0.08;
      world.rotation.x = -0.03;
      if (ground) {
        ground.position.z = Math.sin(t * 0.12) * 0.24;
        ground.rotation.y = Math.sin(t * 0.06) * 0.025;
      }
      if (motes) {
        motes.rotation.y = Math.sin(t * 0.06) * 0.03;
      }
      const centerPlaying = playingSelfRef.current;
      const overviewPlayback =
        presencePlaybackModeRef.current === "overview";
      const activeEncounterId = playingEncounterIdRef.current;
      const anyPeerPlayback = activeEncounterId != null;
      const dimCenterEcho = overviewPlayback && anyPeerPlayback;
      const centerPulse =
        centerPlaying && !overviewPlayback ? Math.sin(t * 5.5) * 0.12 : 0;
      const centerBreathe = 1 + Math.sin(t * 1.1) * 0.06 + centerPulse;
      const centerRingSize = 2.65 * centerBreathe;
      centerShell.scale.set(centerRingSize, centerRingSize, 1);
      const centerHitSize = 2.3 * centerBreathe;
      centerCore.scale.set(centerHitSize, centerHitSize, 1);
      const centerWave = 0.5 + 0.5 * Math.sin(t * 5.5);
      const centerHaloMat = centerHalo.material as THREE.SpriteMaterial;
      if (dimCenterEcho) {
        centerGroup.position.y = 0.25;
        centerShellMaterial.opacity = 0.48;
        centerHaloMat.opacity = 0.16;
        centerHaloMat.color.copy(centerAccentColor).lerp(dimCenterHaloTint, 0.42);
        centerHalo.scale.set(3.85, 3.85, 1);
      } else if (centerPlaying && !overviewPlayback) {
        centerGroup.position.y = 0.25 + Math.sin(t * 5.5) * 0.08;
        centerShellMaterial.opacity = 0.96;
        centerHaloMat.opacity = 0.5 + centerWave * 0.1;
        centerHaloMat.color.copy(centerAccentColor);
        const centerHaloSize = 4.42 + centerWave * 0.42;
        centerHalo.scale.set(centerHaloSize, centerHaloSize, 1);
      } else {
        centerGroup.position.y = 0.25;
        centerShellMaterial.opacity = 1;
        centerHaloMat.color.copy(centerAccentColor);
        centerHaloMat.opacity = 0.42 + Math.sin(t * 1.2) * 0.04;
        const centerHaloSize = 4.08 + Math.sin(t * 1.1) * 0.16;
        centerHalo.scale.set(centerHaloSize, centerHaloSize, 1);
      }
      if (stars) stars.rotation.y = t * 0.018;

      const anyPlayback = anyPeerPlayback || centerPlaying;

      for (const body of bodies) {
        const isPlaying = activeEncounterId === body.encounter.id;
        const shouldDim =
          overviewPlayback && anyPlayback && !isPlaying;
        const playingT = t * 2.2 + body.phase;
        const playPulse =
          isPlaying && showOrbitPlaybackChrome
            ? Math.sin(playingT) * 0.035
            : 0;
        const drift = t * body.driftSpeed + body.phase;
        body.anchor.position.x =
          body.base.x + Math.cos(drift) * body.driftRadius;
        body.anchor.position.y =
          body.base.y +
          Math.sin(t * body.bob + body.phase) * 0.42 +
          (isPlaying && showOrbitPlaybackChrome
            ? Math.sin(playingT) * 0.035
            : 0);
        body.anchor.position.z =
          body.base.z +
          Math.sin(drift * body.driftTilt) * body.driftRadius * 0.75;
        body.anchor.rotation.y += 0.004 * body.spin;
        const playWave = 0.5 + 0.5 * Math.sin(playingT);
        const peerBreathe =
          1 + Math.sin(t * 1.2 + body.phase) * 0.05 + playPulse;
        const ringSize = body.baseScale * 2.45 * peerBreathe;
        body.shell.scale.set(ringSize, ringSize, 1);
        const hitSize = body.baseScale * 2.2 * peerBreathe;
        body.core.scale.set(hitSize, hitSize, 1);
        const ringMat = body.shell.material as THREE.SpriteMaterial;
        const haloMat = body.halo.material as THREE.SpriteMaterial;

        if (shouldDim) {
          haloMat.color.copy(body.haloRestColor).lerp(inactiveDimTint, 0.52);
          haloMat.opacity = body.haloBaseOpacity * 0.3;
          body.halo.scale.set(
            body.haloBaseScale * 0.94,
            body.haloBaseScale * 0.94,
            1,
          );
          ringMat.opacity = body.ringBaseOpacity * 0.38;
          if (body.playCenter) {
            body.playCenter.visible = false;
            (body.playCenter.material as THREE.SpriteMaterial).opacity = 0;
          }
          if (body.playIcon) {
            body.playIcon.visible = false;
            body.playIcon.material.opacity = 0;
          }
          if (body.label) body.label.material.opacity = 0.38;
        } else if (isPlaying && showOrbitPlaybackChrome) {
          const playCenterMat = body.playCenter!.material as THREE.SpriteMaterial;
          haloMat.color.copy(body.haloRestColor);
          haloMat.opacity = Math.min(0.84, body.haloBaseOpacity + 0.1);
          body.halo.scale.set(body.haloBaseScale, body.haloBaseScale, 1);
          ringMat.opacity = 1;
          body.playCenter!.visible = true;
          playCenterMat.opacity = 0.72 + playWave * 0.2;
          const centerSize = body.baseScale * (0.76 + playWave * 0.1);
          body.playCenter!.scale.set(centerSize, centerSize, 1);
          if (body.playIcon) {
            body.playIcon.visible = true;
            body.playIcon.material.opacity = 0.88 + playWave * 0.12;
          }
          if (body.label) body.label.material.opacity = 1;
        } else {
          haloMat.color.copy(body.haloRestColor);
          haloMat.opacity = body.haloBaseOpacity;
          body.halo.scale.set(body.haloBaseScale, body.haloBaseScale, 1);
          ringMat.opacity = body.ringBaseOpacity;
          if (body.playCenter) {
            body.playCenter.visible = false;
            (body.playCenter.material as THREE.SpriteMaterial).opacity = 0;
          }
          if (body.playIcon) {
            body.playIcon.visible = false;
            body.playIcon.material.opacity = 0;
          }
          if (body.label) body.label.material.opacity = 0.82;
        }
        body.shell.material.rotation += 0.0012 * body.spin;
        body.halo.material.rotation += 0.002 * body.spin;
      }

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cameraStateRef.current = { yaw, pitch, zoom };
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      container.removeEventListener("pointerleave", onPointerLeave);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
      container.removeChild(renderer.domElement);
      centerHaloTexture?.dispose();
      disposeObject(world);
      starGeometry.dispose();
      starMaterial?.dispose();
      renderer.dispose();
    };
  }, [
    device?.echoColor,
    device?.echoName,
    encounters,
    fontReady,
    onSelectEncounter,
    onSelectSelf,
    presencePlaybackMode,
    variant,
  ]);

  const shellClass = embedded
    ? "relative isolate h-full min-h-0 w-full overflow-hidden"
    : "relative isolate h-[100dvh] w-[100vw] overflow-hidden";
  const canvasClass = embedded
    ? "absolute inset-0 z-0 touch-none"
    : "absolute inset-0 z-0 cursor-grab touch-none active:cursor-grabbing";

  return (
    <section className={shellClass}>
      <div
        ref={containerRef}
        className={canvasClass}
        aria-label={
          variant === "echoOnly"
            ? "Echo presence glow"
            : "A three-dimensional sonic landscape of today's co-presence"
        }
      />

      {title ? (
        <div className="pointer-events-none absolute inset-x-0 top-[max(4.25rem,calc(env(safe-area-inset-top)+3.75rem))] z-20 flex justify-center px-6 text-center sm:top-[max(4.75rem,calc(env(safe-area-inset-top)+4.25rem))] sm:px-24 lg:top-[max(4rem,calc(env(safe-area-inset-top)+3.5rem))]">
          <h1 className="max-w-[min(86vw,56rem)] font-display text-[clamp(2.35rem,7vw,5.2rem)] leading-[0.9] tracking-[-0.055em]">
            {title}
          </h1>
        </div>
      ) : null}

      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center justify-center px-4">
        <div className="flex flex-col items-center gap-2">
          {soundControl ? (
            <div className="rounded-full px-4 py-2">{soundControl}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
