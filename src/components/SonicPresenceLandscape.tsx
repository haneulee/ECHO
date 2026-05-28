"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

import {
  encounterDisplayName,
  encounterDisplayPalette,
} from "@/lib/encounterDisplay";
import { getEchoColorPalette } from "@/lib/visualRules";
import type { EchoDevice, Encounter } from "@/lib/types";

type SonicPresenceLandscapeProps = {
  backHref?: string;
  device: EchoDevice | null;
  encounters: Encounter[];
  title: ReactNode;
  soundControl?: ReactNode;
  onSelectEncounter?: (encounter: Encounter) => void;
  onSelectSelf?: () => void;
};

type PresenceBody = {
  encounter: Encounter;
  anchor: THREE.Group;
  core: THREE.Mesh;
  halo: THREE.Sprite;
  orbit: THREE.LineLoop;
  base: THREE.Vector3;
  phase: number;
  driftRadius: number;
  driftSpeed: number;
  driftTilt: number;
  bob: number;
  spin: number;
};

const LABEL_TEXT_COLOR = "#2A1D14";

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

function makeTextSprite(label: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.font = '38px "Averia Serif Libre", serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(label, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.05, 0.74, 1);
  return sprite;
}

function makeOrbit(radius: number, color: string) {
  const points = Array.from({ length: 96 }, (_, index) => {
    const angle = (index / 96) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  });
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.16,
  });
  return new THREE.LineLoop(geometry, material);
}

function makeAbstractGround() {
  const group = new THREE.Group();
  const positions: number[] = [];
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
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  const dotTexture = makeDotTexture();
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xff4f00,
      map: dotTexture,
      alphaMap: dotTexture,
      transparent: true,
      opacity: 0.82,
      size: 0.16,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  group.add(points);
  return group;
}

function makeRockField(colors: string[]) {
  const group = new THREE.Group();
  const clusters = [
    { x: -15, z: 3, spread: 4.2 },
    { x: -8, z: -11, spread: 3.8 },
    { x: 7, z: 2, spread: 4.4 },
    { x: 14, z: -13, spread: 4.8 },
    { x: 0, z: -22, spread: 5.4 },
    { x: 19, z: 8, spread: 3.6 },
  ];
  for (let index = 0; index < 96; index += 1) {
    const height = 0.55 + hashUnit(`tree:${index}:h`) * 1.75;
    const radius = 0.075 + hashUnit(`tree:${index}:r`) * 0.24;
    const geometry = new THREE.ConeGeometry(radius, height, 5, 1);
    const color = colors[index % colors.length] ?? colors[0] ?? "#ffffff";
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.28,
      flatShading: true,
      transparent: true,
      opacity: 0.76,
      roughness: 0.68,
    });
    const tree = new THREE.Mesh(geometry, material);
    const cluster = clusters[index % clusters.length]!;
    const angle = hashUnit(`tree:${index}:cluster-angle`) * Math.PI * 2;
    const distance = Math.sqrt(hashUnit(`tree:${index}:cluster-distance`)) * cluster.spread;
    const x = cluster.x + Math.cos(angle) * distance;
    const z = cluster.z + Math.sin(angle) * distance;
    const groundY = groundYAt(x, z);
    tree.position.set(
      x,
      groundY + height / 2 + 0.04,
      z,
    );
    tree.rotation.set(
      (hashUnit(`tree:${index}:rx`) - 0.5) * 0.18,
      hashUnit(`tree:${index}:turn`) * Math.PI,
      (hashUnit(`tree:${index}:rz`) - 0.5) * 0.18,
    );
    group.add(tree);
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
      const materials = Array.isArray(child.material) ? child.material : [child.material];
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

export function SonicPresenceLandscape({
  backHref = "/main",
  device,
  encounters,
  title,
  soundControl,
  onSelectEncounter,
  onSelectSelf,
}: SonicPresenceLandscapeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (typeof document === "undefined" || !("fonts" in document)) {
      setFontReady(true);
      return;
    }
    void document.fonts
      .load('38px "Averia Serif Libre"')
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

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xffee8c, 0.022);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
    camera.position.set(0, 5.4, 15.5);
    camera.lookAt(0, -0.85, -3.2);

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
    const horizon = new THREE.PointLight(0xffc5d3, 2.4, 36);
    horizon.position.set(-8, -2, -10);
    scene.add(horizon);

    const world = new THREE.Group();
    world.rotation.x = -0.12;
    scene.add(world);

    const ground = makeAbstractGround();
    world.add(ground);
    const echoType = device?.echoType ?? "bounce";
    const echoPalette = device?.echoColor
      ? [device.echoColor, device.echoColor, device.echoColor]
      : getEchoColorPalette(echoType);
    const echoAccent = device?.echoColor ?? echoPalette[1] ?? "#FF6900";
    const rocks = makeRockField(echoPalette);
    world.add(rocks);
    const centerTexture = makeEchoTexture([
      echoPalette[0] ?? echoAccent,
      echoPalette[1] ?? echoAccent,
      echoAccent,
    ]);
    const centerGroup = new THREE.Group();
    const centerGeometry = new THREE.SphereGeometry(0.72, 64, 64);
    const centerMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#ffffff"),
      emissive: new THREE.Color(echoAccent),
      emissiveIntensity: 0.22,
      map: centerTexture,
      roughness: 0.34,
      metalness: 0.02,
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    centerGroup.add(center);
    const centerLabel = makeTextSprite(
      device?.echoName ?? "my Echo",
      LABEL_TEXT_COLOR,
    );
    if (centerLabel) {
      centerLabel.position.y = 0;
      centerLabel.scale.set(3.05, 0.74, 1);
      centerGroup.add(centerLabel);
    }
    centerGroup.position.set(0, 0.25, 0.2);
    world.add(centerGroup);

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
      const vertical = 1.2 + durationWeight * 1.2 + hashUnit(`${encounter.id}:y`) * 2.8;
      const depth =
        -9.5 + durationWeight * 9.8 + (hashUnit(`${encounter.id}:z`) - 0.5) * 2.2;
      const size = 0.14 + durationWeight * 1.08;
      const anchor = new THREE.Group();
      const base = new THREE.Vector3(
        Math.cos(angle) * radius,
        vertical,
        Math.sin(angle) * radius * 0.82 + depth,
      );
      anchor.position.copy(base);

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(size, 32, 32),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(mid),
          emissive: new THREE.Color(start),
          emissiveIntensity: 0.42 + durationWeight * 0.46,
          transparent: true,
          opacity: 0.46 + durationWeight * 0.36,
          roughness: 0.62,
        }),
      );
      anchor.add(core);

      const haloTexture = makeGlowTexture(start);
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: haloTexture,
          color: new THREE.Color(end),
          transparent: true,
          opacity: 0.38 + durationWeight * 0.28,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      halo.scale.set(size * 4.4, size * 4.4, 1);
      anchor.add(halo);

      const orbitRadius = 0.46 + durationWeight * 2.8;
      const orbit = makeOrbit(orbitRadius, mid);
      orbit.rotation.x = (hashUnit(`${encounter.id}:tilt`) - 0.5) * 0.36;
      orbit.rotation.y = hashUnit(`${encounter.id}:turn`) * Math.PI;
      anchor.add(orbit);

      // `otherEchoName` is attached by the today API via otherEchoModelName -> EchoDevice.firmwareModelName.
      const label = makeTextSprite(encounterDisplayName(encounter), LABEL_TEXT_COLOR);
      if (label) {
        label.position.y = 0;
        label.scale.set(3.05, 0.74, 1);
        anchor.add(label);
      }

      world.add(anchor);
      return {
        encounter,
        anchor,
        core,
        halo,
        orbit,
        base,
        phase: hashUnit(`${encounter.id}:phase`) * Math.PI * 2,
        driftRadius:
          0.35 +
          (1 - durationWeight) * 2.45 +
          hashUnit(`${encounter.id}:drift`) * (0.35 + (1 - durationWeight) * 1.25),
        driftSpeed:
          0.028 +
          (1 - durationWeight) * 0.08 +
          hashUnit(`${encounter.id}:speed`) * 0.055,
        driftTilt: 0.22 + (1 - durationWeight) * 0.65,
        bob: 0.22 + (1 - durationWeight) * 0.44 + hashUnit(`${encounter.id}:bob`) * 0.36,
        spin: 0.2 + hashUnit(`${encounter.id}:spin`) * 0.5,
      };
    });

    const starMaterial = new THREE.PointsMaterial({
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
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const focus = new THREE.Vector3(0, -0.65, -3.2);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let lastPointerDown = { x: 0, y: 0 };
    const viewport = { width: 1, height: 1, isMobile: false };
    let hoverX = 0;
    let hoverY = 0;
    let yaw = 0;
    let pitch = 0;
    let zoom = 1;
    let isDragging = false;
    let lastTouchDistance: number | null = null;
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!viewport.isMobile) {
        hoverX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        hoverY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      }
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
        const selfHit = raycaster.intersectObject(center, false)[0];
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
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);

    const touchDistance = (touches: TouchList) => {
      if (touches.length < 2) return null;
      const first = touches.item(0);
      const second = touches.item(1);
      if (!first || !second) return null;
      return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
    };
    const onTouchStart = (event: TouchEvent) => {
      lastTouchDistance = touchDistance(event.touches);
    };
    const onTouchMove = (event: TouchEvent) => {
      const nextDistance = touchDistance(event.touches);
      if (nextDistance !== null && lastTouchDistance !== null) {
        zoom = Math.max(0.68, Math.min(1.42, zoom - (nextDistance - lastTouchDistance) * 0.003));
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
      const radius = (viewport.isMobile ? 21 : 17) * zoom;
      const baseHeight = viewport.isMobile ? 7.4 : 5.2;
      const heightRange = viewport.isMobile ? 7.2 : 5.2;
      camera.position.set(
        Math.sin(cameraYaw) * radius,
        baseHeight + Math.sin(cameraPitch) * heightRange,
        focus.z + Math.cos(cameraYaw) * radius,
      );
      camera.lookAt(focus);
      world.rotation.y = Math.sin(t * 0.13) * 0.08;
      world.rotation.x = -0.03;
      ground.position.z = Math.sin(t * 0.12) * 0.24;
      ground.rotation.y = Math.sin(t * 0.06) * 0.025;
      rocks.rotation.y = Math.sin(t * 0.08) * 0.04;
      center.rotation.y = t * 0.06;
      stars.rotation.y = t * 0.018;

      for (const body of bodies) {
        const drift = t * body.driftSpeed + body.phase;
        body.anchor.position.x =
          body.base.x + Math.cos(drift) * body.driftRadius;
        body.anchor.position.y =
          body.base.y + Math.sin(t * body.bob + body.phase) * 0.42;
        body.anchor.position.z =
          body.base.z + Math.sin(drift * body.driftTilt) * body.driftRadius * 0.75;
        body.anchor.rotation.y += 0.004 * body.spin;
        body.core.rotation.y += 0.006 * body.spin;
        body.halo.material.rotation += 0.002 * body.spin;
        body.orbit.rotation.z += 0.003 * body.spin;
      }

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
      container.removeChild(renderer.domElement);
      centerTexture?.dispose();
      disposeObject(world);
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
    };
  }, [
    device?.echoColor,
    device?.echoName,
    device?.echoType,
    encounters,
    fontReady,
    onSelectEncounter,
    onSelectSelf,
  ]);

  return (
    <section className="relative isolate h-[100dvh] w-[100vw] overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0 z-0 cursor-grab touch-none active:cursor-grabbing"
        aria-label="A three-dimensional sonic landscape of today's co-presence"
      />

      <Link
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-40 rounded-full border border-text/10 bg-surface/65 px-4 py-2 font-body text-sm text-text backdrop-blur-md transition hover:bg-surface sm:right-6 lg:right-8"
        href={backHref}
      >
        back
      </Link>

      <div className="pointer-events-none absolute inset-x-0 top-[max(4.25rem,calc(env(safe-area-inset-top)+3.75rem))] z-20 flex justify-center px-6 text-center sm:top-[max(4.75rem,calc(env(safe-area-inset-top)+4.25rem))] sm:px-24 lg:top-[max(4rem,calc(env(safe-area-inset-top)+3.5rem))]">
        <h1 className="max-w-[min(86vw,56rem)] font-display text-[clamp(2.35rem,7vw,5.2rem)] leading-[0.9] tracking-[-0.055em]">
          {title}
        </h1>
      </div>

      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center justify-center px-4">
        <div className="flex flex-col items-center gap-2">
          {soundControl ? <div className="rounded-full px-4 py-2">{soundControl}</div> : null}
        </div>
      </div>
    </section>
  );
}
