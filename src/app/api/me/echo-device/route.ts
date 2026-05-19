import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { clearSessionCookie } from "@/lib/auth/sessionCookie";
import { defaultStateForType } from "@/lib/echoDeviceDefaults";
import { isValidEchoUnitCode, normalizeEchoUnitCode } from "@/lib/echoUnitCode";
import { isLocalMockMode } from "@/lib/localMockMode";
import { prisma } from "@/lib/prisma";
import type { EchoType } from "@/lib/types";

export const dynamic = "force-dynamic";

const ECHO_TYPES: EchoType[] = ["shy", "messy", "bounce"];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session && !isLocalMockMode()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const echoName = typeof o.echoName === "string" ? o.echoName.trim() : "";
  const echoType = o.echoType;

  if (!echoName) {
    return NextResponse.json({ error: "echoName is required." }, { status: 400 });
  }
  if (typeof echoType !== "string" || !ECHO_TYPES.includes(echoType as EchoType)) {
    return NextResponse.json({ error: "Invalid echoType." }, { status: 400 });
  }

  if (isLocalMockMode()) {
    return NextResponse.json({
      ok: true,
      deviceId: "ECHO_BOUNCE_001",
      updated: true,
      mock: true,
    });
  }

  const userId = session!.userId;
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!userExists) {
    const res = NextResponse.json(
      {
        error:
          "Your session no longer matches this database (for example after `yarn db:reset`). Log in again.",
      },
      { status: 401 },
    );
    clearSessionCookie(res);
    return res;
  }

  const existing = await prisma.echoDevice.findFirst({
    where: { userId },
    orderBy: { id: "asc" },
  });

  if (existing) {
    const updated = await prisma.echoDevice.update({
      where: { id: existing.id },
      data: {
        echoName,
        echoType: echoType as EchoType,
        currentState: defaultStateForType(echoType as EchoType),
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, deviceId: updated.id, updated: true });
  }

  const unitRaw = typeof o.echoUnitCode === "string" ? o.echoUnitCode : "";
  const unit = normalizeEchoUnitCode(unitRaw);
  if (!isValidEchoUnitCode(unit)) {
    return NextResponse.json(
      {
        error:
          "echoUnitCode is required when no device exists yet. Use the same 3–64 character code as on your Echo (letters, digits, hyphen, underscore).",
      },
      { status: 400 },
    );
  }

  const byId = await prisma.echoDevice.findUnique({
    where: { id: unit },
    select: { id: true, userId: true },
  });
  if (byId && byId.userId !== userId) {
    return NextResponse.json(
      { error: "This Echo unit code is already registered to another account." },
      { status: 409 },
    );
  }
  if (byId && byId.userId === userId) {
    const updated = await prisma.echoDevice.update({
      where: { id: unit },
      data: {
        echoName,
        echoType: echoType as EchoType,
        currentState: defaultStateForType(echoType as EchoType),
        lastSyncedAt: new Date(),
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, deviceId: updated.id, updated: true });
  }

  const created = await prisma.echoDevice.create({
    data: {
      id: unit,
      userId,
      serialNumber: unit,
      echoName,
      echoType: echoType as EchoType,
      currentSoundProfileId: "ambient3_meditation_v1",
      currentState: defaultStateForType(echoType as EchoType),
      lastSyncedAt: new Date(),
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, deviceId: created.id, updated: false });
}
