const USER_ID_RE = /^[a-z0-9_]{3,32}$/;

export function normalizeUserId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUserId(normalized: string): boolean {
  return USER_ID_RE.test(normalized);
}
