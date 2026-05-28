const HEX_COLOR_RE = /^#[0-9A-F]{6}$/;

export function normalizeEchoColor(raw: string): string {
  const trimmed = raw.trim();
  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return prefixed.toUpperCase();
}

export function isValidEchoColor(value: string): boolean {
  return HEX_COLOR_RE.test(value);
}
