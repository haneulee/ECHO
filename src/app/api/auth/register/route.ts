import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { createSessionToken } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/sessionCookie";
import { isValidUserId, normalizeUserId } from "@/lib/auth/userIdRules";
import { defaultStateForType } from "@/lib/echoDeviceDefaults";
import { isValidEchoUnitCode, normalizeEchoUnitCode } from "@/lib/echoUnitCode";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function dbFailureMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const migrateHint =
    /passwordHash|Unknown column|does not exist|P2022/i.test(msg)
      ? " Run `yarn db:migrate` (and `yarn db:seed` if needed), then retry."
      : "";
  if (process.env.NODE_ENV === "production") {
    return "Registration failed. Please try again later.";
  }
  return `${msg}${migrateHint}`;
}

export async function POST(request: Request) {
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
  const rawId = typeof o.userId === "string" ? o.userId : "";
  const password = typeof o.password === "string" ? o.password : "";
  const nameRaw = typeof o.name === "string" ? o.name.trim() : "";
  const rawUnit = typeof o.echoUnitCode === "string" ? o.echoUnitCode : "";

  const userId = normalizeUserId(rawId);
  if (!isValidUserId(userId)) {
    return NextResponse.json(
      {
        error:
          "User id must be 3–32 characters: lowercase letters, digits, underscore only.",
      },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const echoUnitCode = normalizeEchoUnitCode(rawUnit);
  if (!isValidEchoUnitCode(echoUnitCode)) {
    return NextResponse.json(
      {
        error:
          "Echo unit code must be 3–64 characters: letters, digits, hyphen, underscore (matches the code on your device).",
      },
      { status: 400 },
    );
  }

  const name = nameRaw.length > 0 ? nameRaw : userId;

  const occupied = await prisma.echoDevice.findUnique({
    where: { id: echoUnitCode },
    select: { id: true },
  });
  if (occupied) {
    return NextResponse.json(
      { error: "That Echo unit code is already registered to an account." },
      { status: 409 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          name,
          passwordHash: hashPassword(password),
        },
      });
      await tx.echoDevice.create({
        data: {
          id: echoUnitCode,
          userId,
          serialNumber: echoUnitCode,
          echoName: "Echo",
          echoType: "shy",
          currentSoundProfileId: "ambient3_meditation_v1",
          currentState: defaultStateForType("shy"),
          lastSyncedAt: new Date(),
        },
      });
    });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That user id or Echo unit code is already taken." },
        { status: 409 },
      );
    }
    console.error("[api/auth/register] create user + device:", e);
    return NextResponse.json(
      { error: dbFailureMessage(e) },
      { status: 500 },
    );
  }

  let token: string;
  try {
    token = await createSessionToken(userId);
  } catch (e) {
    console.error("[api/auth/register] session token:", e);
    return NextResponse.json(
      {
        error:
          "Server misconfiguration: AUTH_SECRET missing or too short (min 16 characters).",
      },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true, userId, deviceId: echoUnitCode });
  setSessionCookie(res, token);
  return res;
}
