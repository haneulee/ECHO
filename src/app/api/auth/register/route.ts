import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { createSessionToken } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/sessionCookie";
import { isValidUserId, normalizeUserId } from "@/lib/auth/userIdRules";
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

  const name = nameRaw.length > 0 ? nameRaw : userId;

  try {
    await prisma.user.create({
      data: {
        id: userId,
        name,
        passwordHash: hashPassword(password),
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That user id is already taken." },
        { status: 409 },
      );
    }
    console.error("[api/auth/register] create user:", e);
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

  const res = NextResponse.json({ ok: true, userId });
  setSessionCookie(res, token);
  return res;
}
