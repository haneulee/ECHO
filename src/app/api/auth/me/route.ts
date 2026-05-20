import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { clearSessionCookie } from "@/lib/auth/sessionCookie";
import { isDatabaseConnectFailure } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";
import { prisma } from "@/lib/prisma";

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
    const deviceCount = await prisma.echoDevice.count({
      where: { userId: user.id },
    });
    return NextResponse.json({
      user,
      hasEchoDevice: deviceCount > 0,
    });
  } catch (e) {
    if (isDatabaseConnectFailure(e)) {
      logDatabaseUnavailable("/api/auth/me", e);
      return NextResponse.json({
        user: { id: session.userId, name: "Echo" },
        hasEchoDevice: true,
        dbUnavailable: true,
      });
    }
    throw e;
  }
}
