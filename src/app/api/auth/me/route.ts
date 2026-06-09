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
}
