type Rgb = { r: number; g: number; b: number };

const THEME_PROPS = [
  "--color-bg",
  "--color-surface",
  "--color-surface-soft",
  "--color-border",
  "--color-text",
  "--color-text-muted",
  "--color-nav-active",
  "--color-nav-inactive",
  "--bg",
  "--surface",
  "--surface-soft",
  "--border",
  "--text",
  "--text-muted",
  "--nav-active",
  "--nav-inactive",
  "--pearl-pink",
  "--pearl-blue",
  "--pearl-violet",
] as const;

const NEUTRAL = {
  bg: { r: 252, g: 250, b: 246 },
  surface: { r: 255, g: 255, b: 255 },
  surfaceSoft: { r: 241, g: 239, b: 234 },
  border: { r: 220, g: 216, b: 208 },
  text: { r: 26, g: 26, b: 26 },
  muted: { r: 92, g: 92, b: 92 },
  inactive: { r: 140, g: 140, b: 140 },
} satisfies Record<string, Rgb>;

function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const value = m[1];
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbTriplet(rgb: Rgb): string {
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
}

function rgbCss(rgb: Rgb): string {
  return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
}

function applyBaseTheme(target: HTMLElement, accent: Rgb | null) {
  target.style.setProperty("--color-bg", rgbTriplet(NEUTRAL.bg));
  target.style.setProperty("--color-surface", rgbTriplet(NEUTRAL.surface));
  target.style.setProperty("--color-surface-soft", rgbTriplet(NEUTRAL.surfaceSoft));
  target.style.setProperty("--color-border", rgbTriplet(NEUTRAL.border));
  target.style.setProperty("--color-text", rgbTriplet(NEUTRAL.text));
  target.style.setProperty("--color-text-muted", rgbTriplet(NEUTRAL.muted));
  target.style.setProperty("--color-nav-active", rgbTriplet(NEUTRAL.text));
  target.style.setProperty("--color-nav-inactive", rgbTriplet(NEUTRAL.inactive));
  target.style.setProperty("--bg", rgbCss(NEUTRAL.bg));
  target.style.setProperty("--surface", "rgba(255, 255, 255, 0.72)");
  target.style.setProperty("--surface-soft", rgbCss(NEUTRAL.surfaceSoft));
  target.style.setProperty("--border", rgbCss(NEUTRAL.border));
  target.style.setProperty("--text", rgbCss(NEUTRAL.text));
  target.style.setProperty("--text-muted", rgbCss(NEUTRAL.muted));
  target.style.setProperty("--nav-active", rgbCss(NEUTRAL.text));
  target.style.setProperty("--nav-inactive", rgbCss(NEUTRAL.inactive));
  if (accent) {
    target.style.setProperty(
      "--pearl-pink",
      `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.14)`,
    );
    target.style.setProperty(
      "--pearl-blue",
      `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.08)`,
    );
    target.style.setProperty(
      "--pearl-violet",
      `rgba(${NEUTRAL.bg.r}, ${NEUTRAL.bg.g}, ${NEUTRAL.bg.b}, 0.5)`,
    );
  } else {
    target.style.setProperty("--pearl-pink", "rgba(0, 0, 0, 0)");
    target.style.setProperty("--pearl-blue", "rgba(0, 0, 0, 0)");
    target.style.setProperty("--pearl-violet", "rgba(255, 255, 255, 0.4)");
  }
}

export function clearEchoColorTheme(target: HTMLElement): void {
  for (const prop of THEME_PROPS) target.style.removeProperty(prop);
}

export function applyNeutralEchoTheme(target: HTMLElement): void {
  applyBaseTheme(target, null);
}

export function applyEchoColorTheme(target: HTMLElement, hex: string | null): void {
  if (!hex) {
    applyNeutralEchoTheme(target);
    return;
  }
  const accent = hexToRgb(hex);
  if (!accent) {
    applyNeutralEchoTheme(target);
    return;
  }
  applyBaseTheme(target, accent);
}
