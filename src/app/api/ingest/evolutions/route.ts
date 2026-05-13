import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { buildIngestDeviceCanonicalMap } from "@/lib/ingestDevices";
import { readBearerToken, verifyIngestSecret } from "@/lib/ingestAuth";
import { ingestEvolutionsBodySchema } from "@/lib/ingestSchemas";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function asInputJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

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

  const parsed = ingestEvolutionsBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, count: 0 });
  }

  const byId = new Map<string, Prisma.EchoEvolutionUpsertArgs>();
  for (const item of rows) {
    const create: Prisma.EchoEvolutionUncheckedCreateInput = {
      id: item.id,
      deviceId: item.deviceId,
      dailyMemoryId: item.dailyMemoryId ?? null,
      mutationType: item.mutationType,
      sourceEchoHash: item.sourceEchoHash,
      sourceEchoType: item.sourceEchoType ?? null,
      trigger: asInputJson(item.trigger),
      beforeState: asInputJson(item.beforeState),
      afterState: asInputJson(item.afterState),
      createdAt: item.createdAt,
    };
    if (item.borrowedFragment !== undefined && item.borrowedFragment !== null) {
      create.borrowedFragment = asInputJson(item.borrowedFragment);
    }

    const update: Prisma.EchoEvolutionUncheckedUpdateInput = {
      deviceId: item.deviceId,
      mutationType: item.mutationType,
      sourceEchoHash: item.sourceEchoHash,
      trigger: asInputJson(item.trigger),
      beforeState: asInputJson(item.beforeState),
      afterState: asInputJson(item.afterState),
      createdAt: item.createdAt,
    };
    if (item.dailyMemoryId !== undefined) {
      update.dailyMemoryId = item.dailyMemoryId;
    }
    if (item.sourceEchoType !== undefined) {
      update.sourceEchoType = item.sourceEchoType;
    }
    if (item.borrowedFragment !== undefined) {
      update.borrowedFragment =
        item.borrowedFragment === null ? Prisma.JsonNull : asInputJson(item.borrowedFragment);
    }

    byId.set(create.id, {
      where: { id: create.id },
      create,
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
          "Unknown deviceId(s). Send EchoDevice.id (the registered unit code), or a serialNumber that matches exactly one device. Unregistered units are rejected.",
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

  await prisma.$transaction(upserts.map((args) => prisma.echoEvolution.upsert(args)));

  return NextResponse.json({ ok: true, count: upserts.length });
}
