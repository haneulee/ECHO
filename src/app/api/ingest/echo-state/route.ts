import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { buildIngestDeviceCanonicalMap } from "@/lib/ingestDevices";
import { readBearerToken, verifyIngestSecret } from "@/lib/ingestAuth";
import { ingestEchoStateBodySchema } from "@/lib/ingestSchemas";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifyIngestSecret(readBearerToken(request.headers.get("authorization")))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be a single JSON object, not an array" },
      { status: 400 },
    );
  }

  const parsed = ingestEchoStateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }

  const item = parsed.data;
  const { toCanonicalId, missing } = await buildIngestDeviceCanonicalMap(prisma, [item.deviceId]);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error:
          "Unknown deviceId. Send EchoDevice.id, serialNumber, or firmwareModelName (registered unit code).",
        missing,
      },
      { status: 400 },
    );
  }

  const deviceId = toCanonicalId.get(item.deviceId.trim())!;

  await prisma.echoDevice.update({
    where: { id: deviceId },
    data: {
      currentSoundProfileId: item.soundProfileId,
      currentState: item.profileSnapshot as Prisma.InputJsonValue,
      lastSyncedAt: item.lastSyncedAt,
      ...(item.echoModelType !== undefined ? { echoModelType: item.echoModelType } : {}),
      ...(item.uniqueDeviceName !== undefined ? { uniqueDeviceName: item.uniqueDeviceName } : {}),
    },
  });

  return NextResponse.json({ ok: true, deviceId });
}
