/**
 * Export daily encounter gradient visuals as PNG (and SVG) for print/book use.
 * Renders in headless Chromium with the same Memories desktop motion frame.
 *
 * Default output: 140mm × 140mm @ 300dpi with safe margins (transparent background).
 *
 * Usage:
 *   yarn export:gradients
 *   yarn export:gradients -- --user=user_haneul --bookMm=140 --marginMm=12
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type Browser } from "playwright";
import { createElement } from "react";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

import { AbstractMemoryVisual } from "../src/components/AbstractMemoryVisual";
import { listArchiveForUser } from "../src/lib/archiveService";
import { prisma } from "../src/lib/prisma";
import { SEED_TIME_ZONE, SEED_USERS } from "../prisma/seed/generateSeedData";

/** Matches Memories desktop `stageConfig.visualSize`. */
const RENDER_SIZE = 480;
const CAPTURE_SCALE = 2;
/** Extra room so SVG blur / drift is not clipped before margins are applied. */
const CAPTURE_BLEED_RATIO = 1.28;
const DEFAULT_BOOK_MM = 140;
const DEFAULT_MARGIN_MM = 12;
const DEFAULT_DPI = 300;
const DEFAULT_OUT = path.join("export", "gradients");

const MEMORY_ANIMATION_CSS = `
@keyframes memory-breathe-lite {
  0%, 100% { transform: scale(0.985); }
  50% { transform: scale(1.015); }
}
@keyframes memory-active-drift {
  0% { transform: translate3d(-42px, 32px, 0) rotate(-4.5deg) scale(0.9); }
  50% { transform: translate3d(36px, -40px, 0) rotate(2.5deg) scale(1.12); }
  100% { transform: translate3d(44px, 26px, 0) rotate(4deg) scale(0.92); }
}
.memory-stage-orbit .memory-stage-card--active .memory-breathe {
  animation: memory-breathe-lite 26s ease-in-out infinite;
  animation-play-state: paused;
  animation-delay: -13s;
  transform-origin: center center;
}
.memory-stage-orbit .memory-stage-card--active .memory-active-drift {
  animation: memory-active-drift 48s ease-in-out infinite alternate;
  animation-play-state: paused;
  animation-delay: -24s;
  transform-origin: center center;
}
`;

type BookLayout = {
  bookMm: number;
  marginMm: number;
  dpi: number;
  pagePx: number;
  marginPx: number;
  contentPx: number;
};

function mmToPx(mm: number, dpi: number) {
  return Math.round((mm / 25.4) * dpi);
}

function bookLayout(bookMm: number, marginMm: number, dpi: number): BookLayout {
  const pagePx = mmToPx(bookMm, dpi);
  const marginPx = mmToPx(marginMm, dpi);
  const contentPx = Math.max(1, pagePx - marginPx * 2);
  return { bookMm, marginMm, dpi, pagePx, marginPx, contentPx };
}

function parseArgs(argv: string[]) {
  let user: string | null = null;
  let date: string | null = null;
  let bookMm = DEFAULT_BOOK_MM;
  let marginMm = DEFAULT_MARGIN_MM;
  let dpi = DEFAULT_DPI;
  let outDir = DEFAULT_OUT;
  let timeZone = SEED_TIME_ZONE;

  for (const arg of argv) {
    if (arg.startsWith("--user=")) user = arg.slice("--user=".length);
    else if (arg.startsWith("--date=")) date = arg.slice("--date=".length);
    else if (arg.startsWith("--bookMm=")) bookMm = Number(arg.slice("--bookMm=".length));
    else if (arg.startsWith("--marginMm=")) marginMm = Number(arg.slice("--marginMm=".length));
    else if (arg.startsWith("--dpi=")) dpi = Number(arg.slice("--dpi=".length));
    else if (arg.startsWith("--size=")) {
      const px = Number(arg.slice("--size=".length));
      bookMm = (px / dpi) * 25.4;
    }
    else if (arg.startsWith("--out=")) outDir = arg.slice("--out=".length);
    else if (arg.startsWith("--timeZone=")) timeZone = arg.slice("--timeZone=".length);
  }

  return { user, date, bookMm, marginMm, dpi, outDir, timeZone };
}

/** Same props as MemoriesListView active card, frozen at mid-drift frame. */
function renderGradientSvg(
  seed: number,
  density: number,
  brightness: number,
  movement: number,
  encounters: Parameters<typeof AbstractMemoryVisual>[0]["encounters"],
  composition: Parameters<typeof AbstractMemoryVisual>[0]["composition"],
  visualId: string,
): string {
  return renderToStaticMarkup(
    createElement(AbstractMemoryVisual, {
      bleed: true,
      brightness,
      composition,
      density,
      encounters,
      gradientMotion: true,
      gradientOnly: true,
      lowGpuCost: true,
      movement,
      seed,
      size: RENDER_SIZE,
      visualId,
    }),
  );
}

function wrapSvgForBook(innerSvg: string, layout: BookLayout): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.pagePx}" height="${layout.pagePx}" viewBox="0 0 ${layout.pagePx} ${layout.pagePx}">
  <g transform="translate(${layout.marginPx} ${layout.marginPx})">
    <svg width="${layout.contentPx}" height="${layout.contentPx}" viewBox="0 0 ${RENDER_SIZE} ${RENDER_SIZE}" overflow="visible">
      ${innerSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}
    </svg>
  </g>
</svg>`;
}

function exportHtml(svg: string, captureSize: number): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        width: ${captureSize}px;
        height: ${captureSize}px;
        overflow: visible;
        background: transparent;
        display: grid;
        place-items: center;
      }
      ${MEMORY_ANIMATION_CSS}
      .memory-stage-visual {
        position: relative;
        isolation: isolate;
        width: ${RENDER_SIZE}px;
        height: ${RENDER_SIZE}px;
        display: grid;
        place-items: center;
      }
      .memory-stage-visual > svg {
        position: relative;
        z-index: 1;
        display: block;
        width: ${RENDER_SIZE}px;
        height: ${RENDER_SIZE}px;
        overflow: visible;
      }
    </style>
  </head>
  <body>
    <div class="memory-stage memory-stage-orbit">
      <article class="memory-stage-card memory-stage-card--active memory-stage-card--orbit">
        <div class="memory-stage-visual">${svg}</div>
      </article>
    </div>
  </body>
</html>`;
}

async function captureGradientPng(
  browser: Browser,
  svg: string,
  layout: BookLayout,
  outPath: string,
) {
  const captureSize = Math.round(RENDER_SIZE * CAPTURE_BLEED_RATIO);
  const page = await browser.newPage({
    viewport: { width: captureSize, height: captureSize },
    deviceScaleFactor: CAPTURE_SCALE,
  });
  await page.setContent(exportHtml(svg, captureSize), { waitUntil: "load" });
  const capture = await page.screenshot({
    type: "png",
    omitBackground: true,
    clip: {
      x: 0,
      y: 0,
      width: captureSize * CAPTURE_SCALE,
      height: captureSize * CAPTURE_SCALE,
    },
  });
  await page.close();

  const fitted = await sharp(capture)
    .resize(layout.contentPx, layout.contentPx, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: layout.pagePx,
      height: layout.pagePx,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fitted, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function writeGradientFiles(
  browser: Browser,
  outDir: string,
  date: string,
  svg: string,
  layout: BookLayout,
) {
  await mkdir(outDir, { recursive: true });
  const base = path.join(outDir, date);
  await writeFile(`${base}.svg`, wrapSvgForBook(svg, layout), "utf8");
  await captureGradientPng(browser, svg, layout, `${base}.png`);
}

async function exportForUser(
  browser: Browser,
  userId: string,
  echoName: string,
  outRoot: string,
  layout: BookLayout,
  timeZone: string,
  onlyDate: string | null,
) {
  const items = await listArchiveForUser(userId, timeZone);
  const filtered = onlyDate
    ? items.filter((item) => item.memory.date === onlyDate)
    : items;
  if (filtered.length === 0) {
    console.log(`${userId}: no daily memories${onlyDate ? ` for ${onlyDate}` : ""}`);
    return 0;
  }

  const outDir = path.join(outRoot, userId);
  let count = 0;

  for (const item of filtered) {
    const { memory, encounters } = item;
    const svg = renderGradientSvg(
      memory.visualization.seed,
      memory.visualization.density,
      memory.visualization.brightness,
      memory.visualization.movement,
      encounters,
      memory.composition,
      `book-${memory.id}`,
    );
    await writeGradientFiles(browser, outDir, memory.date, svg, layout);
    count += 1;
    console.log(
      `${userId} ${memory.date}: ${encounters.length} encounters → ${path.join(outDir, `${memory.date}.png`)}`,
    );
  }

  const manifest = {
    userId,
    echoName,
    timeZone,
    renderSize: RENDER_SIZE,
    captureScale: CAPTURE_SCALE,
    captureBleedRatio: CAPTURE_BLEED_RATIO,
    renderer: "playwright-chromium-memories-frame",
    transparentBackground: true,
    book: {
      widthMm: layout.bookMm,
      heightMm: layout.bookMm,
      marginMm: layout.marginMm,
      contentMm: layout.bookMm - layout.marginMm * 2,
      dpi: layout.dpi,
      pagePx: layout.pagePx,
      marginPx: layout.marginPx,
      contentPx: layout.contentPx,
    },
    dates: filtered.map((item) => ({
      date: item.memory.date,
      encounters: item.encounters.length,
      png: `${item.memory.date}.png`,
    })),
  };
  await writeFile(
    path.join(outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  return count;
}

async function main() {
  const { user, date, bookMm, marginMm, dpi, outDir, timeZone } = parseArgs(
    process.argv.slice(2),
  );
  const layout = bookLayout(bookMm, marginMm, dpi);
  const users = user
    ? SEED_USERS.filter((entry) => entry.id === user)
    : SEED_USERS;

  if (users.length === 0) {
    throw new Error(`Unknown user: ${user}`);
  }

  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let total = 0;

  try {
    for (const entry of users) {
      total += await exportForUser(
        browser,
        entry.id,
        entry.device.echoName,
        outDir,
        layout,
        timeZone,
        date,
      );
    }
  } finally {
    await browser.close();
  }

  console.log(
    [
      `\nExported ${total} day(s) to ${path.resolve(outDir)}`,
      `${layout.bookMm}mm × ${layout.bookMm}mm @ ${layout.dpi}dpi (${layout.pagePx}px)`,
      `margins ${layout.marginMm}mm (${layout.marginPx}px), content ${layout.bookMm - layout.marginMm * 2}mm (${layout.contentPx}px)`,
      timeZone,
    ].join("\n"),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
