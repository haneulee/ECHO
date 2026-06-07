"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

import {
  encounterDisplayName,
  encounterDisplayPalette,
} from "@/lib/encounterDisplay";
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
};

type PresenceBody = {
  encounter: Encounter;
  anchor: THREE.Group;
  shell: THREE.Mesh;
  core: THREE.Mesh;
  halo: THREE.Sprite;
  label: THREE.Sprite | null;
  timeLabel: THREE.Sprite | null;
  haloRestColor: THREE.Color;
  haloPlayColor: THREE.Color;
  haloBaseOpacity: number;
  haloBaseScale: number;
  shellBaseEmissive: number;
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

function makeGlassMaterial(
  accentHex: string,
  options?: {
    emissiveIntensity?: number;
    opacity?: number;
    transmission?: number;
  },
) {
  const accent = new THREE.Color(accentHex);
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ffffff"),
    emissive: accent,
    emissiveIntensity: options?.emissiveIntensity ?? 0.48,
    transparent: true,
    opacity: options?.opacity ?? 0.9,
    roughness: 0.06,
    metalness: 0,
    transmission: options?.transmission ?? 0.68,
    thickness: 0.65,
    ior: 1.45,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
}

function playGlowColor(hex: string) {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  return new THREE.Color().setHSL(
    hsl.h,
    Math.min(1, hsl.s * 1.62 + 0.14),
    Math.min(0.58, hsl.l * 1.1 + 0.04),
  );
}

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
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.34, `${color}cc`);
  gradient.addColorStop(0.68, `${color}55`);
  gradient.addColorStop(1, `${color}00`);
  ctx.fillStyle = gradient;
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

function makeEchoTexture(colors: string[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const [start, mid, end] = colors;
  const gradient = ctx.createRadialGradient(142, 122, 8, 268, 270, 312);
  gradient.addColorStop(0, start ?? "#ffffff");
  gradient.addColorStop(0.34, mid ?? start ?? "#ffffff");
  gradient.addColorStop(0.72, end ?? mid ?? "#ffffff");
  gradient.addColorStop(1, start ?? end ?? "#ffffff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const highlight = ctx.createRadialGradient(154, 126, 0, 154, 126, 144);
  highlight.addColorStop(0, "rgba(255,255,255,0.78)");
  highlight.addColorStop(0.42, "rgba(255,255,255,0.18)");
  highlight.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = highlight;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
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
  ctx.font = `${fontSize}px "Averia Serif Libre", serif`;
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
}: SonicPresenceLandscapeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const playingEncounterIdRef = useRef(playingEncounterId);
  const playingSelfRef = useRef(playingSelf);
  const cameraStateRef = useRef({ yaw: 0, pitch: 0, zoom: 1 });
  playingEncounterIdRef.current = playingEncounterId;
  playingSelfRef.current = playingSelf;

  useEffect(() => {
    let cancelled = false;
    if (typeof document === "undefined" || !("fonts" in document)) {
      setFontReady(true);
      return;
    }
    void document.fonts
      .load('38px "Averia Serif Libre"')
      .then(() => document.fonts.load('30px "Averia Serif Libre"'))
      .then(() => document.fonts.load('22px "Averia Serif Libre"'))
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
    const centerTexture = makeEchoTexture([echoAccent, "#ffffff", echoAccent]);
    const centerGroup = new THREE.Group();
    const centerShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.92, 48, 48),
      makeGlassMaterial(echoAccent, {
        emissiveIntensity: 0.22,
        opacity: 0.55,
        transmission: 0.78,
      }),
    );
    const centerCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 48, 48),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#ffffff"),
        emissive: new THREE.Color(echoAccent),
        emissiveIntensity: 0.52,
        map: centerTexture,
        roughness: 0.12,
        metalness: 0,
        transparent: true,
        opacity: 0.94,
      }),
    );
    const centerHaloTexture = makeGlowTexture(echoAccent);
    const centerHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: centerHaloTexture,
        color: new THREE.Color(echoAccent),
        transparent: true,
        opacity: 0.46,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    centerHalo.scale.set(4.1, 4.1, 1);
    const centerShellRadius = 0.92;
    centerGroup.add(centerHalo);
    centerGroup.add(centerShell);
    centerGroup.add(centerCore);
    const centerCoreMaterial =
      centerCore.material as THREE.MeshStandardMaterial;
    const centerShellMaterial =
      centerShell.material as THREE.MeshPhysicalMaterial;
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

    const bodies: PresenceBody[] = encounters.map((encounter, index) => {
      const palette = encounterDisplayPalette(encounter);
      const [start, mid, end] = palette;
      const durationWeight = Math.min(1, Math.log1p(encounter.durationSec) / 8);
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
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(size, 28, 28),
        makeGlassMaterial(accent, {
          emissiveIntensity: 0.28 + durationWeight * 0.22,
          opacity: 0.42 + durationWeight * 0.28,
          transmission: 0.72,
        }),
      );
      anchor.add(shell);
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(size * 0.58, 28, 28),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color("#ffffff"),
          emissive: new THREE.Color(start),
          emissiveIntensity: 0.5 + durationWeight * 0.38,
          transparent: true,
          opacity: 0.88,
          roughness: 0.1,
        }),
      );
      anchor.add(core);

      const haloTexture = makeGlowTexture(start);
      const haloRestColor = new THREE.Color(end);
      const haloPlayColor = playGlowColor(mid ?? start);
      const haloBaseOpacity =
        (0.38 + durationWeight * 0.28) * (0.82 + densityScale * 0.18);
      const haloBaseScale = size * (2.8 + densityScale * 1.6);
      const shellBaseEmissive = 0.28 + durationWeight * 0.22;
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: haloTexture,
          color: haloRestColor.clone(),
          transparent: true,
          opacity: haloBaseOpacity,
          blending: THREE.AdditiveBlending,
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
      if (label) {
        const nameY = labelYAboveSphere(size, label.scale.y);
        label.position.y = nameY;
        anchor.add(label);
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
        label,
        timeLabel: label ? timeLabel : null,
        haloRestColor,
        haloPlayColor,
        haloBaseOpacity,
        haloBaseScale,
        shellBaseEmissive,
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
      const centerPulse = centerPlaying ? Math.sin(t * 5.5) * 0.12 : 0;
      const centerBreathe = 1 + Math.sin(t * 1.1) * 0.06 + centerPulse;
      centerShell.scale.setScalar(centerBreathe);
      centerCore.scale.setScalar(0.46 * centerBreathe);
      centerShell.rotation.y = t * 0.05;
      centerCore.rotation.y = -t * 0.07;
      const centerWave = 0.5 + 0.5 * Math.sin(t * 5.5);
      centerCoreMaterial.emissiveIntensity = centerPlaying
        ? 0.72 + centerWave * 0.38
        : 0.38 + Math.sin(t * 1.35) * 0.16;
      centerShellMaterial.emissiveIntensity = centerPlaying
        ? 0.34 + centerWave * 0.42
        : 0.22;
      if (centerPlaying) {
        centerGroup.position.y = 0.25 + Math.sin(t * 5.5) * 0.08;
        centerHalo.material.opacity = 0.58 + centerWave * 0.18;
        const centerHaloSize = 4.35 + centerWave * 0.42;
        centerHalo.scale.set(centerHaloSize, centerHaloSize, 1);
      } else {
        centerGroup.position.y = 0.25;
        centerHalo.material.opacity = 0.42 + Math.sin(t * 1.2) * 0.05;
        const centerHaloSize = 4.05 + Math.sin(t * 1.1) * 0.12;
        centerHalo.scale.set(centerHaloSize, centerHaloSize, 1);
      }
      if (stars) stars.rotation.y = t * 0.018;

      for (const body of bodies) {
        const isPlaying = playingEncounterIdRef.current === body.encounter.id;
        const playingT = t * 2.2 + body.phase;
        const playPulse = isPlaying ? Math.sin(playingT) * 0.045 : 0;
        const drift = t * body.driftSpeed + body.phase;
        body.anchor.position.x =
          body.base.x + Math.cos(drift) * body.driftRadius;
        body.anchor.position.y =
          body.base.y +
          Math.sin(t * body.bob + body.phase) * 0.42 +
          (isPlaying ? Math.sin(playingT) * 0.055 : 0);
        body.anchor.position.z =
          body.base.z +
          Math.sin(drift * body.driftTilt) * body.driftRadius * 0.75;
        body.anchor.rotation.y += 0.004 * body.spin;
        const playWave = 0.5 + 0.5 * Math.sin(playingT);
        const peerBreathe =
          1 + Math.sin(t * 1.2 + body.phase) * 0.05 + playPulse;
        body.shell.scale.setScalar(body.baseScale * peerBreathe);
        body.core.scale.setScalar(body.baseScale * 0.58 * peerBreathe);
        const shellMat = body.shell.material as THREE.MeshPhysicalMaterial;
        const coreMat = body.core.material as THREE.MeshStandardMaterial;
        const haloMat = body.halo.material as THREE.SpriteMaterial;
        if (isPlaying) {
          haloMat.color.copy(body.haloPlayColor);
          haloMat.opacity = body.haloBaseOpacity + 0.34 + playWave * 0.14;
          const haloSize = body.haloBaseScale * (1.14 + playWave * 0.1);
          body.halo.scale.set(haloSize, haloSize, 1);
          shellMat.emissiveIntensity =
            body.shellBaseEmissive + 0.42 + playWave * 0.14;
          coreMat.emissiveIntensity = 0.82 + playWave * 0.16;
        } else {
          haloMat.color.copy(body.haloRestColor);
          haloMat.opacity = body.haloBaseOpacity;
          body.halo.scale.set(body.haloBaseScale, body.haloBaseScale, 1);
          shellMat.emissiveIntensity = body.shellBaseEmissive;
          coreMat.emissiveIntensity = 0.5;
        }
        body.shell.rotation.y += 0.004 * body.spin;
        body.core.rotation.y += 0.006 * body.spin;
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
      centerTexture?.dispose();
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
    variant,
  ]);

  return (
    <section className="relative isolate h-[100dvh] w-[100vw] overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0 z-0 cursor-grab touch-none active:cursor-grabbing"
        aria-label="A three-dimensional sonic landscape of today's co-presence"
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
