const DISPLAY_FONT_SIZES = [22, 30, 38] as const;

/** Matches `layout.tsx` / `font-display` — next/font injects `--font-averia`. */
export function resolveDisplayFontFamily(): string {
  if (typeof document === "undefined") return "serif";
  const fromVar = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-averia")
    .trim();
  if (fromVar) return fromVar;
  const bodyFamily = getComputedStyle(document.body).fontFamily.trim();
  return bodyFamily || "serif";
}

export async function ensureDisplayFontsLoaded(
  sizes: readonly number[] = DISPLAY_FONT_SIZES,
): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const family = resolveDisplayFontFamily();
  await Promise.all(
    sizes.map((size) => document.fonts.load(`400 ${size}px ${family}`)),
  );
}
