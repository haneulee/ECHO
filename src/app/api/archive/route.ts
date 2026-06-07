import { NextResponse } from "next/server";

import type { ArchiveApiResponse } from "@/lib/archiveApiTypes";
import { listArchiveForUser } from "@/lib/archiveService";
import { getSession } from "@/lib/auth/session";
import { isDatabaseConnectFailure } from "@/lib/auth/resolveSessionUser";
import { echoDeviceRowToDto } from "@/lib/dbSerializers";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";
import { mockArchivePayload } from "@/lib/mockArchivePayload";
import { prisma } from "@/lib/prisma";
import { isValidIanaTimeZone } from "@/lib/zonedDayRange";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (isLocalMockMode()) {
    logDatabaseUnavailable("/api/archive local mock mode");
    return NextResponse.json(mockArchivePayload());
  }
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeZone =
    searchParams.get("timeZone") ??
    searchParams.get("timezone") ??
    "UTC";

  if (!isValidIanaTimeZone(timeZone)) {
    return NextResponse.json(
      { error: "Invalid IANA time zone (use e.g. Asia/Seoul)" },
      { status: 400 },
    );
  }

  const userId = session.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const payload: ArchiveApiResponse = { device: null, items: [] };
      return NextResponse.json(payload);
    }

    const device = await prisma.echoDevice.findFirst({
      where: { userId },
      orderBy: { lastSyncedAt: "desc" },
    });
    const items = await listArchiveForUser(userId, timeZone);
    const payload: ArchiveApiResponse = {
      device: device ? echoDeviceRowToDto(device) : null,
      items,
    };
    return NextResponse.json(payload);
  } catch (e) {
    if (isDatabaseConnectFailure(e)) {
      logDatabaseUnavailable("/api/archive", e);
      return NextResponse.json(mockArchivePayload());
    }
    throw e;
  }
}
