/**
 * Factory / sticker unit id for an Echo. Stored as EchoDevice.id (ingest `deviceId`)
 * and duplicated to serialNumber for new registrations.
 */
const UNIT_RE = /^[A-Z0-9][A-Z0-9_-]{2,63}$/;

export function normalizeEchoUnitCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidEchoUnitCode(unit: string): boolean {
  if (unit.length < 3 || unit.length > 64) return false;
  return UNIT_RE.test(unit);
}
