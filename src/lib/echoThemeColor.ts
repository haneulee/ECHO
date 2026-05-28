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

function mix(a: Rgb, b: Rgb, amount: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * amount),
    g: Math.round(a.g + (b.g - a.g) * amount),
    b: Math.round(a.b + (b.b - a.b) * amount),
  };
}

function rgbTriplet(rgb: Rgb): string {
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
}

function rgbCss(rgb: Rgb): string {
  return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
}

export function clearEchoColorTheme(target: HTMLElement): void {
  for (const prop of THEME_PROPS) target.style.removeProperty(prop);
}

export function applyNeutralEchoTheme(target: HTMLElement): void {
  target.style.setProperty("--color-bg", "255 255 255");
  target.style.setProperty("--color-surface", "255 255 255");
  target.style.setProperty("--color-surface-soft", "245 245 245");
  target.style.setProperty("--color-border", "210 210 210");
  target.style.setProperty("--color-text", "0 0 0");
  target.style.setProperty("--color-text-muted", "82 82 82");
  target.style.setProperty("--color-nav-active", "0 0 0");
  target.style.setProperty("--color-nav-inactive", "82 82 82");
  target.style.setProperty("--bg", "rgb(255 255 255)");
  target.style.setProperty("--surface", "rgb(255 255 255)");
  target.style.setProperty("--surface-soft", "rgb(245 245 245)");
  target.style.setProperty("--border", "rgb(210 210 210)");
  target.style.setProperty("--text", "rgb(0 0 0)");
  target.style.setProperty("--text-muted", "rgb(82 82 82)");
  target.style.setProperty("--nav-active", "rgb(0 0 0)");
  target.style.setProperty("--nav-inactive", "rgb(82 82 82)");
  target.style.setProperty("--pearl-pink", "rgba(0, 0, 0, 0)");
  target.style.setProperty("--pearl-blue", "rgba(0, 0, 0, 0)");
  target.style.setProperty("--pearl-violet", "rgba(0, 0, 0, 0)");
}

export function applyEchoColorTheme(target: HTMLElement, hex: string | null): void {
  if (!hex) {
    clearEchoColorTheme(target);
    return;
  }
  const accent = hexToRgb(hex);
  if (!accent) {
    clearEchoColorTheme(target);
    return;
  }

  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 42, g: 29, b: 20 };
  const bg = mix(accent, white, 0.72);
  const surface = mix(accent, white, 0.82);
  const surfaceSoft = mix(accent, white, 0.55);
  const border = mix(accent, black, 0.28);
  const text = mix(accent, black, 0.42);
  const muted = mix(accent, black, 0.28);
  const inactive = mix(accent, black, 0.18);

  target.style.setProperty("--color-bg", rgbTriplet(bg));
  target.style.setProperty("--color-surface", rgbTriplet(surface));
  target.style.setProperty("--color-surface-soft", rgbTriplet(surfaceSoft));
  target.style.setProperty("--color-border", rgbTriplet(border));
  target.style.setProperty("--color-text", rgbTriplet(text));
  target.style.setProperty("--color-text-muted", rgbTriplet(muted));
  target.style.setProperty("--color-nav-active", rgbTriplet(accent));
  target.style.setProperty("--color-nav-inactive", rgbTriplet(inactive));
  target.style.setProperty("--bg", rgbCss(bg));
  target.style.setProperty("--surface", rgbCss(surface));
  target.style.setProperty("--surface-soft", rgbCss(surfaceSoft));
  target.style.setProperty("--border", rgbCss(border));
  target.style.setProperty("--text", rgbCss(text));
  target.style.setProperty("--text-muted", rgbCss(muted));
  target.style.setProperty("--nav-active", rgbCss(accent));
  target.style.setProperty("--nav-inactive", rgbCss(inactive));
  target.style.setProperty("--pearl-pink", `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.22)`);
  target.style.setProperty("--pearl-blue", `rgba(${surfaceSoft.r}, ${surfaceSoft.g}, ${surfaceSoft.b}, 0.26)`);
  target.style.setProperty("--pearl-violet", `rgba(${bg.r}, ${bg.g}, ${bg.b}, 0.34)`);
}
