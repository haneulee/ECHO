import type { EchoType } from "@/lib/types";

const FIRMWARE_MODEL_NAME_RE = /^ECHO_[A-Z0-9_-]+$/;

export function normalizeFirmwareModelName(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidFirmwareModelName(value: string): boolean {
  return value.length <= 80 && FIRMWARE_MODEL_NAME_RE.test(value);
}

export function echoTypeFromFirmwareModelName(value: string): EchoType {
  const normalized = normalizeFirmwareModelName(value);
  if (normalized.startsWith("ECHO_SHY_")) return "shy";
  if (normalized.startsWith("ECHO_MESSY_")) return "messy";
  return "bounce";
}
