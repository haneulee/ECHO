import { NextResponse } from "next/server";

import { createSessionToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/sessionCookie";
import { normalizeUserId } from "@/lib/auth/userIdRules";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
  const userId = normalizeUserId(
    typeof o.userId === "string" ? o.userId : "",
  );
  const password = typeof o.password === "string" ? o.password : "";

  if (!userId || !password) {
    return NextResponse.json(
      { error: "userId and password are required." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid user id or password." },
      { status: 401 },
    );
  }

  let token: string;
  try {
    token = await createSessionToken(userId);
  } catch {
    return NextResponse.json(
      { error: "Server misconfiguration: AUTH_SECRET missing or too short." },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true, userId });
  setSessionCookie(res, token);
  return res;
}
