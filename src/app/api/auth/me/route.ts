import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { clearSessionCookie } from "@/lib/auth/sessionCookie";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
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
}
