import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { buildIngestDeviceCanonicalMap } from "@/lib/ingestDevices";
import { readBearerToken, verifyIngestSecret } from "@/lib/ingestAuth";
import { ingestEncountersBodySchema } from "@/lib/ingestSchemas";
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

  const parsed = ingestEncountersBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, count: 0 });
  }

  const byId = new Map<string, Prisma.EncounterUpsertArgs>();
  for (const item of rows) {
    const data: Prisma.EncounterUncheckedCreateInput = {
      id: item.id,
      deviceId: item.deviceId,
      otherEchoHash: item.otherEchoHash,
      otherEchoModelName: item.otherEchoModelName,
      otherEchoType: item.otherEchoType,
      startedAt: item.startedAt,
      endedAt: item.endedAt,
      durationSec: item.durationSec,
      rssiAvg: item.rssiAvg,
      rssiMin: item.rssiMin,
      rssiMax: item.rssiMax,
      proximityZone: item.proximityZone,
      closenessAvg: item.closenessAvg,
      soundProfileId: item.soundProfileId,
      ...(item.otherEchoProfileSnapshot !== undefined
        ? {
            otherEchoProfileSnapshot:
              item.otherEchoProfileSnapshot === null
                ? Prisma.DbNull
                : (item.otherEchoProfileSnapshot as Prisma.InputJsonValue),
          }
        : {}),
      ...(item.otherEchoSonicSource !== undefined
        ? { otherEchoSonicSource: item.otherEchoSonicSource }
        : {}),
    };
    const update: Prisma.EncounterUncheckedUpdateInput = {
      deviceId: data.deviceId,
      otherEchoHash: data.otherEchoHash,
      otherEchoModelName: data.otherEchoModelName,
      otherEchoType: data.otherEchoType,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      durationSec: data.durationSec,
      rssiAvg: data.rssiAvg,
      rssiMin: data.rssiMin,
      rssiMax: data.rssiMax,
      proximityZone: data.proximityZone,
      closenessAvg: data.closenessAvg,
      soundProfileId: data.soundProfileId,
    };
    if (item.otherEchoProfileSnapshot !== undefined) {
      update.otherEchoProfileSnapshot =
        item.otherEchoProfileSnapshot === null
          ? Prisma.DbNull
          : (item.otherEchoProfileSnapshot as Prisma.InputJsonValue);
    }
    if (item.otherEchoSonicSource !== undefined) {
      update.otherEchoSonicSource = item.otherEchoSonicSource;
    }
    byId.set(data.id, {
      where: { id: data.id },
      create: data,
      update,
    });
  }

  const upserts = [...byId.values()];
  const requested = [...new Set(upserts.map((u) => u.create.deviceId as string))];

  const { toCanonicalId, missing } = await buildIngestDeviceCanonicalMap(prisma, requested);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error:
          "Unknown deviceId(s). Send EchoDevice.id, serialNumber, or firmwareModelName (registered unit code). Unregistered units are rejected.",
        missing,
      },
      { status: 400 },
    );
  }

  for (const args of upserts) {
    const raw = args.create.deviceId as string;
    const canon = toCanonicalId.get(raw)!;
    (args.create as { deviceId: string }).deviceId = canon;
    (args.update as { deviceId: string }).deviceId = canon;
  }

  await prisma.$transaction(upserts.map((args) => prisma.encounter.upsert(args)));

  return NextResponse.json({ ok: true, count: upserts.length });
}
