import { NextResponse } from "next/server";

import type { ArchiveApiResponse } from "@/lib/archiveApiTypes";
import { listArchiveForUser } from "@/lib/archiveService";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { isValidIanaTimeZone } from "@/lib/zonedDayRange";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
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

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const payload: ArchiveApiResponse = { items: [] };
    return NextResponse.json(payload);
  }

  const items = await listArchiveForUser(userId, timeZone);
  const payload: ArchiveApiResponse = { items };
  return NextResponse.json(payload);
}
