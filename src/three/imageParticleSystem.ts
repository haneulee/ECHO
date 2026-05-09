import * as THREE from "three";

export type EchoPersonalityVisual = "drift" | "ripple" | "bloom";

export type ImageParticleBuildConfig = {
  maxParticles: number;
  strideMul: number;
  depthNoiseAmp: number;
  planeHalfHeight: number;
  luminanceFloor: number;
};

export const PERSONALITY_BUILD: Record<
  EchoPersonalityVisual,
  ImageParticleBuildConfig
> = {
  drift: {
    maxParticles: 6_200,
    strideMul: 1.52,
    depthNoiseAmp: 0.34,
    planeHalfHeight: 5.35,
    luminanceFloor: 0.004,
  },
  ripple: {
    maxParticles: 9_000,
    strideMul: 1.12,
    depthNoiseAmp: 0.24,
    planeHalfHeight: 5.42,
    luminanceFloor: 0.004,
  },
  bloom: {
    maxParticles: 14_500,
    strideMul: 0.98,
    depthNoiseAmp: 0.29,
    planeHalfHeight: 5.55,
    luminanceFloor: 0.004,
  },
};

export const ABS_MAX_PARTICLES = 28_000;

/** Ecology plates (RGB). */
export const PERSONALITY_IMAGE: Record<EchoPersonalityVisual, string> = {
  drift: "/assets/drift.jpg",
  ripple: "/assets/ripple.jpg",
  bloom: "/assets/bloom.jpg",
};

export const PERSONALITY_DEPTH_MAP: Record<
  EchoPersonalityVisual,
  string | null
> = {
  drift: null,
  ripple: null,
  bloom: null,
};

function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function computeStride(
  cw: number,
  ch: number,
  maxParticles: number,
  strideMul: number,
): number {
  const maxN = Math.min(maxParticles, ABS_MAX_PARTICLES);
  const area = cw * ch;
  let stride = Math.max(1, Math.floor(Math.sqrt(area / maxN) * strideMul));
  for (let i = 0; i < 480; i++) {
    const est = Math.ceil(cw / stride) * Math.ceil(ch / stride);
    if (est <= maxN * 1.09) break;
    stride += 1;
  }
  return stride;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (typeof window !== "undefined") {
      try {
        const resolved = new URL(url, window.location.origin);
        if (resolved.origin !== window.location.origin) {
          img.crossOrigin = "anonymous";
        }
      } catch {
        /* ignore */
      }
    }
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Failed to load ecology image: ${url}`));
    img.src = url;
  });
}

async function tryLoadImage(url: string): Promise<HTMLImageElement | null> {
  try {
    return await loadImage(url);
  } catch {
    return null;
  }
}

export type BuiltParticleGeometry = {
  geometry: THREE.BufferGeometry;
  particleCount: number;
  planeHalfWidth: number;
  planeHalfHeight: number;
  usedDepthPlate: boolean;
};

export async function buildParticlesFromImage(
  personality: EchoPersonalityVisual,
): Promise<BuiltParticleGeometry> {
  const cfg = PERSONALITY_BUILD[personality];
  const colorUrl = PERSONALITY_IMAGE[personality];
  const depthUrl = PERSONALITY_DEPTH_MAP[personality];

  const img = await loadImage(colorUrl);
  const depthImg =
    depthUrl != null ? await tryLoadImage(depthUrl) : null;

  const maxDim = 680;
  const scale = maxDim / Math.max(img.width, img.height);
  const cw = Math.max(1, Math.floor(img.width * scale));
  const ch = Math.max(1, Math.floor(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unsupported");

  ctx.drawImage(img, 0, 0, cw, ch);
  const colorData = ctx.getImageData(0, 0, cw, ch).data;

  let depthData: Uint8ClampedArray | null = null;
  let usedDepthPlate = false;
  if (depthImg) {
    ctx.drawImage(depthImg, 0, 0, cw, ch);
    depthData = ctx.getImageData(0, 0, cw, ch).data;
    usedDepthPlate = true;
  }

  const stride = computeStride(cw, ch, cfg.maxParticles, cfg.strideMul);

  const positions: number[] = [];
  const originals: number[] = [];
  const colors: number[] = [];
  const randoms: number[] = [];
  const depths: number[] = [];
  const sizes: number[] = [];
  const edgeFades: number[] = [];

  const planeHalfHeight = cfg.planeHalfHeight;
  const planeHalfWidth = planeHalfHeight * (cw / ch);

  const zExtent = 3.35;

  for (let y = 0; y < ch; y += stride) {
    for (let x = 0; x < cw; x += stride) {
      const xi = Math.min(Math.floor(x), cw - 1);
      const yi = Math.min(Math.floor(y), ch - 1);
      const i = (yi * cw + xi) * 4;

      const r = colorData[i];
      const g = colorData[i + 1];
      const b = colorData[i + 2];
      const a = colorData[i + 3];
      if (a < 8) continue;

      const lum = luminance(r, g, b);
      if (lum < cfg.luminanceFloor) continue;

      const rnd = Math.random();

      if (personality === "drift" && rnd > 0.72 && lum < 0.22) continue;

      let depth01 = lum;
      if (depthData) {
        const dl = luminance(depthData[i], depthData[i + 1], depthData[i + 2]);
        depth01 = dl * 0.82 + lum * 0.18;
      }

      depth01 = THREE.MathUtils.clamp(
        depth01 + (Math.random() - 0.5) * cfg.depthNoiseAmp * 0.38,
        0.008,
        1,
      );

      const nx = (xi / cw - 0.5) * 2;
      const ny = -(yi / ch - 0.5) * 2;

      const px = nx * planeHalfWidth;
      const py = ny * planeHalfHeight;

      const zBase = (depth01 - 0.5) * zExtent * 2.45;
      const zJitter =
        (Math.random() - 0.5) * cfg.depthNoiseAmp * zExtent * 0.42;
      const pz = zBase + zJitter;

      const nxOriginal = (xi / cw - 0.5) * 2;
      const nyOriginal = -(yi / ch - 0.5) * 2;
      const pxOriginal = nxOriginal * planeHalfWidth;
      const pyOriginal = nyOriginal * planeHalfHeight;

      const cwSafe = Math.max(cw - 1, 1);
      const chSafe = Math.max(ch - 1, 1);
      const uNorm = xi / cwSafe;
      const vNorm = yi / chSafe;
      const distToEdge = Math.min(uNorm, vNorm, 1 - uNorm, 1 - vNorm);
      const EDGE_SOFT = 0.22;
      const edgeFade = THREE.MathUtils.smootherstep(0, EDGE_SOFT, distToEdge);

      positions.push(px, py, pz);
      originals.push(pxOriginal, pyOriginal, pz * 0.94);
      colors.push(r / 255, g / 255, b / 255);
      randoms.push(rnd);
      depths.push(depth01);

      const sizeMul =
        personality === "bloom"
          ? 1.12 + rnd * 1.35
          : personality === "ripple"
            ? 0.84 + rnd * 1.08
            : 0.58 + rnd * 0.82;

      sizes.push(sizeMul);
      edgeFades.push(edgeFade);
    }
  }

  const geometry = new THREE.BufferGeometry();
  let particleCount = positions.length / 3;

  if (particleCount === 0) {
    const n = 1200;
    const ph = cfg.planeHalfHeight;
    const pw = ph * (cw / ch);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1;
      const v = Math.random() * 2 - 1;
      const px = u * pw * 0.92;
      const py = v * ph * 0.92;
      const pz = (Math.random() - 0.5) * 2.8;
      positions.push(px, py, pz);
      originals.push(px, py, pz * 0.94);
      colors.push(0.42, 0.38, 0.36);
      randoms.push(Math.random());
      depths.push(0.5);
      sizes.push(0.65 + Math.random() * 0.9);
      edgeFades.push(1);
    }
    particleCount = positions.length / 3;
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "aOriginal",
    new THREE.Float32BufferAttribute(originals, 3),
  );
  geometry.setAttribute(
    "aColor",
    new THREE.Float32BufferAttribute(colors, 3),
  );
  geometry.setAttribute(
    "aRandom",
    new THREE.Float32BufferAttribute(randoms, 1),
  );
  geometry.setAttribute(
    "aDepth",
    new THREE.Float32BufferAttribute(depths, 1),
  );
  geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute(
    "aEdgeFade",
    new THREE.Float32BufferAttribute(edgeFades, 1),
  );

  return {
    geometry,
    particleCount,
    planeHalfWidth,
    planeHalfHeight,
    usedDepthPlate,
  };
}
