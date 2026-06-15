import type { PrismaClient } from "@prisma/client";

/** Maps ingest `deviceId` (unit code or serial) to canonical `EchoDevice.id`. */
export async function buildIngestDeviceCanonicalMap(
  prisma: PrismaClient,
  requested: string[],
): Promise<{ toCanonicalId: Map<string, string>; missing: string[] }> {
  const trimmed = requested.map((r) => r.trim()).filter(Boolean);
  const unique = [...new Set(trimmed)];
  if (unique.length === 0) {
    return { toCanonicalId: new Map(), missing: [] };
  }

  const devices = await prisma.echoDevice.findMany({
    where: {
      OR: [
        { id: { in: unique } },
        { serialNumber: { in: unique } },
        { firmwareModelName: { in: unique } },
      ],
    },
    select: { id: true, serialNumber: true, firmwareModelName: true },
  });

  const toCanonicalId = new Map<string, string>();
  for (const d of devices) {
    toCanonicalId.set(d.id, d.id);
    toCanonicalId.set(d.serialNumber, d.id);
    if (d.firmwareModelName) {
      toCanonicalId.set(d.firmwareModelName, d.id);
    }
  }

  const missing = unique.filter((k) => !toCanonicalId.has(k));
  return { toCanonicalId, missing };
}
