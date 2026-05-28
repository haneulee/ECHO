import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { clearSessionCookie } from "@/lib/auth/sessionCookie";
import { isDatabaseConnectFailure } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";
import { prisma } from "@/lib/prisma";
import type { EchoType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (isLocalMockMode()) {
    logDatabaseUnavailable("/api/auth/me local mock mode");
    return NextResponse.json({
      user: session
        ? { id: session.userId, name: "Local Mock" }
        : { id: "local_mock", name: "Local Mock" },
      hasEchoDevice: true,
      echoColor: "#FF9F6E",
      echoType: "bounce" satisfies EchoType,
      mock: true,
    });
  }
  if (!session) {
    return NextResponse.json({ user: null });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true },
    });
    if (!user) {
      const res = NextResponse.json({ user: null });
      clearSessionCookie(res);
      return res;
    }
    const echoDevice = await prisma.echoDevice.findFirst({
      where: { userId: user.id },
      orderBy: { id: "asc" },
      select: { echoColor: true, echoType: true },
    });
    return NextResponse.json({
      user,
      hasEchoDevice: Boolean(echoDevice),
      echoColor: echoDevice?.echoColor ?? null,
      echoType: echoDevice?.echoType ?? null,
    });
  } catch (e) {
    if (isDatabaseConnectFailure(e)) {
      logDatabaseUnavailable("/api/auth/me", e);
      return NextResponse.json({
        user: { id: session.userId, name: "Echo" },
        hasEchoDevice: true,
        echoColor: "#FF9F6E",
        echoType: "bounce" satisfies EchoType,
        dbUnavailable: true,
      });
    }
    throw e;
  }
}
