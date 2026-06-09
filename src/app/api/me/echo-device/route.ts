import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { clearSessionCookie } from "@/lib/auth/sessionCookie";
import { defaultStateForType } from "@/lib/echoDeviceDefaults";
import { isValidEchoColor, normalizeEchoColor } from "@/lib/echoColor";
import {
  echoTypeFromFirmwareModelName,
  isValidFirmwareModelName,
  normalizeFirmwareModelName,
} from "@/lib/echoFirmwareModelName";
import { isValidEchoUnitCode, normalizeEchoUnitCode } from "@/lib/echoUnitCode";
import { prisma } from "@/lib/prisma";
import type { EchoType } from "@/lib/types";

export const dynamic = "force-dynamic";

const ECHO_TYPES: EchoType[] = ["shy", "messy", "bounce"];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
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
  const echoColor =
    typeof o.echoColor === "string" ? normalizeEchoColor(o.echoColor) : "";
  const firmwareModelName =
    typeof o.firmwareModelName === "string"
      ? normalizeFirmwareModelName(o.firmwareModelName)
      : typeof o.echoUnitCode === "string"
        ? normalizeEchoUnitCode(o.echoUnitCode)
        : "";
  const echoType =
    typeof o.echoType === "string"
      ? o.echoType
      : echoTypeFromFirmwareModelName(firmwareModelName);

  if (!echoName) {
    return NextResponse.json({ error: "echoName is required." }, { status: 400 });
  }
  if (!isValidEchoColor(echoColor)) {
    return NextResponse.json(
      { error: "echoColor must be a hex color like #FF9F6E." },
      { status: 400 },
    );
  }
  if (!isValidFirmwareModelName(firmwareModelName)) {
    return NextResponse.json(
      {
        error:
          "firmwareModelName must match the firmware Config.h ECHO_UNIQUE_MODEL_NAME, e.g. ECHO_BOUNCE_001.",
      },
      { status: 400 },
    );
  }
  if (typeof echoType !== "string" || !ECHO_TYPES.includes(echoType as EchoType)) {
    return NextResponse.json({ error: "Invalid echoType." }, { status: 400 });
  }

  const userId = session.userId;
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

  const existingByModel = await prisma.echoDevice.findUnique({
    where: { firmwareModelName },
    select: { id: true, userId: true },
  });
  if (existingByModel && existingByModel.userId !== userId) {
    return NextResponse.json(
      { error: "This firmware model name is already registered to another account." },
      { status: 409 },
    );
  }
  if (existingByModel && existingByModel.userId === userId) {
    const updated = await prisma.echoDevice.update({
      where: { id: existingByModel.id },
      data: {
        echoName,
        echoColor,
        firmwareModelName,
        echoType: echoType as EchoType,
        currentState: defaultStateForType(echoType as EchoType),
        lastSyncedAt: new Date(),
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, deviceId: updated.id, updated: true });
  }

  const unit = firmwareModelName;
  if (!isValidEchoUnitCode(unit)) {
    return NextResponse.json(
      {
        error:
          "firmwareModelName must also be a valid Echo unit code (3–64 characters, letters, digits, hyphen, underscore).",
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
        echoColor,
        firmwareModelName,
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
      echoColor,
      firmwareModelName,
      echoType: echoType as EchoType,
      currentSoundProfileId: "ambient3_meditation_v1",
      currentState: defaultStateForType(echoType as EchoType),
      lastSyncedAt: new Date(),
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, deviceId: created.id, updated: false });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
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
  const deviceId = typeof o.deviceId === "string" ? o.deviceId.trim() : "";
  const echoName =
    typeof o.echoName === "string" ? o.echoName.trim() : undefined;
  const echoColor =
    typeof o.echoColor === "string"
      ? normalizeEchoColor(o.echoColor)
      : undefined;

  if (echoName !== undefined && !echoName) {
    return NextResponse.json({ error: "echoName is required." }, { status: 400 });
  }
  if (echoColor !== undefined && !isValidEchoColor(echoColor)) {
    return NextResponse.json(
      { error: "echoColor must be a hex color like #FF9F6E." },
      { status: 400 },
    );
  }
  if (echoName === undefined && echoColor === undefined) {
    return NextResponse.json(
      { error: "Provide echoName and/or echoColor to update." },
      { status: 400 },
    );
  }

  const userId = session.userId;
  const device = deviceId
    ? await prisma.echoDevice.findFirst({
        where: { id: deviceId, userId },
      })
    : await prisma.echoDevice.findFirst({
        where: { userId },
        orderBy: { id: "asc" },
      });

  if (!device) {
    return NextResponse.json({ error: "Echo device not found." }, { status: 404 });
  }

  const updated = await prisma.echoDevice.update({
    where: { id: device.id },
    data: {
      ...(echoName !== undefined ? { echoName } : {}),
      ...(echoColor !== undefined ? { echoColor } : {}),
      lastSyncedAt: new Date(),
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, deviceId: updated.id, updated: true });
}
