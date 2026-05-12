import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";
import { EchoType, ProximityZone } from "@prisma/client";

import { readBearerToken, verifyIngestSecret } from "@/lib/ingestAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ECHO: EchoType[] = ["shy", "messy", "bounce"];
const ZONES: ProximityZone[] = ["far", "near", "close", "very_close"];

function isEchoType(v: unknown): v is EchoType {
  return typeof v === "string" && (ECHO as string[]).includes(v);
}

function isProximityZone(v: unknown): v is ProximityZone {
  return typeof v === "string" && (ZONES as string[]).includes(v);
}

function parseEncounter(
  raw: unknown,
  index: number,
): { ok: true; row: Prisma.EncounterUpsertArgs } | { ok: false; message: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, message: `Item ${index}: expected object` };
  }
  const o = raw as Record<string, unknown>;

  const id = o.id;
  const deviceId = o.deviceId;
  if (typeof id !== "string" || !id.trim()) {
    return { ok: false, message: `Item ${index}: invalid id` };
  }
  if (typeof deviceId !== "string" || !deviceId.trim()) {
    return { ok: false, message: `Item ${index}: invalid deviceId` };
  }

  const otherEchoHash = o.otherEchoHash;
  const otherEchoType = o.otherEchoType;
  const startedAt = o.startedAt;
  const endedAt = o.endedAt;
  const soundProfileId = o.soundProfileId;

  if (typeof otherEchoHash !== "string" || !otherEchoHash.trim()) {
    return { ok: false, message: `Item ${index}: invalid otherEchoHash` };
  }
  if (!isEchoType(otherEchoType)) {
    return { ok: false, message: `Item ${index}: invalid otherEchoType` };
  }
  if (typeof soundProfileId !== "string" || !soundProfileId.trim()) {
    return { ok: false, message: `Item ${index}: invalid soundProfileId` };
  }

  const s = typeof startedAt === "string" ? new Date(startedAt) : null;
  const e = typeof endedAt === "string" ? new Date(endedAt) : null;
  if (!s || Number.isNaN(s.getTime()) || !e || Number.isNaN(e.getTime())) {
    return { ok: false, message: `Item ${index}: invalid startedAt/endedAt` };
  }

  const durationSec = o.durationSec;
  const rssiAvg = o.rssiAvg;
  const rssiMin = o.rssiMin;
  const rssiMax = o.rssiMax;
  const closenessAvg = o.closenessAvg;
  const proximityZone = o.proximityZone;

  if (typeof durationSec !== "number" || !Number.isFinite(durationSec)) {
    return { ok: false, message: `Item ${index}: invalid durationSec` };
  }
  if (typeof rssiAvg !== "number" || !Number.isFinite(rssiAvg)) {
    return { ok: false, message: `Item ${index}: invalid rssiAvg` };
  }
  if (typeof rssiMin !== "number" || !Number.isFinite(rssiMin)) {
    return { ok: false, message: `Item ${index}: invalid rssiMin` };
  }
  if (typeof rssiMax !== "number" || !Number.isFinite(rssiMax)) {
    return { ok: false, message: `Item ${index}: invalid rssiMax` };
  }
  if (typeof closenessAvg !== "number" || !Number.isFinite(closenessAvg)) {
    return { ok: false, message: `Item ${index}: invalid closenessAvg` };
  }
  if (!isProximityZone(proximityZone)) {
    return { ok: false, message: `Item ${index}: invalid proximityZone` };
  }

  const data: Prisma.EncounterUncheckedCreateInput = {
    id: id.trim(),
    deviceId: deviceId.trim(),
    otherEchoHash: otherEchoHash.trim(),
    otherEchoType,
    startedAt: s,
    endedAt: e,
    durationSec: Math.round(durationSec),
    rssiAvg,
    rssiMin: Math.round(rssiMin),
    rssiMax: Math.round(rssiMax),
    proximityZone,
    closenessAvg,
    soundProfileId: soundProfileId.trim(),
  };

  return {
    ok: true,
    row: {
      where: { id: data.id },
      create: data,
      update: {
        deviceId: data.deviceId,
        otherEchoHash: data.otherEchoHash,
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
      },
    },
  };
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

  if (!Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON array of Encounter objects" },
      { status: 400 },
    );
  }

  const byId = new Map<string, Prisma.EncounterUpsertArgs>();
  for (let i = 0; i < body.length; i++) {
    const parsed = parseEncounter(body[i], i);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.message }, { status: 400 });
    }
    const id = parsed.row.where.id as string;
    byId.set(id, parsed.row);
  }

  const upserts = [...byId.values()];
  const requested = [...new Set(upserts.map((u) => u.create.deviceId as string))];

  const devices = await prisma.echoDevice.findMany({
    where: {
      OR: [{ id: { in: requested } }, { serialNumber: { in: requested } }],
    },
    select: { id: true, serialNumber: true },
  });

  const toCanonicalId = new Map<string, string>();
  for (const d of devices) {
    toCanonicalId.set(d.id, d.id);
    toCanonicalId.set(d.serialNumber, d.id);
  }

  const missing = requested.filter((k) => !toCanonicalId.has(k));
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

  await prisma.$transaction(
    upserts.map((args) => prisma.encounter.upsert(args)),
  );

  return NextResponse.json({ ok: true, count: upserts.length });
}
