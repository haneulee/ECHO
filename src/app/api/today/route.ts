import { NextResponse } from "next/server";

import { dailyMemoryRowToDto, encounterRowToDto } from "@/lib/dbSerializers";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { TodayApiResponse } from "@/lib/todayApiTypes";
import { isValidIanaTimeZone, zonedDayRangeUtc } from "@/lib/zonedDayRange";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const deviceId = searchParams.get("deviceId");
  const timeZone =
    searchParams.get("timeZone") ??
    searchParams.get("timezone") ??
    "UTC";

  const userId = session.userId;

  if (!dateStr) {
    return NextResponse.json(
      { error: "Missing required query: date (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  if (!isValidIanaTimeZone(timeZone)) {
    return NextResponse.json(
      { error: "Invalid IANA time zone (use e.g. Asia/Seoul)" },
      { status: 400 },
    );
  }

  const range = zonedDayRangeUtc(dateStr, timeZone);
  if (!range) {
    return NextResponse.json(
      { error: "Invalid date; use YYYY-MM-DD" },
      { status: 400 },
    );
  }

  let deviceIds: string[] = [];
  if (deviceId) {
    const owned = await prisma.echoDevice.findFirst({
      where: { id: deviceId, userId },
      select: { id: true },
    });
    deviceIds = owned ? [owned.id] : [];
  } else {
    const devices = await prisma.echoDevice.findMany({
      where: { userId },
      select: { id: true },
    });
    deviceIds = devices.map((d) => d.id);
  }

  if (deviceIds.length === 0) {
    const payload: TodayApiResponse = { encounters: [], dailyMemory: null };
    return NextResponse.json(payload);
  }

  const encounters = await prisma.encounter.findMany({
    where: {
      deviceId: { in: deviceIds },
      startedAt: { gte: range.start, lt: range.end },
    },
    orderBy: { startedAt: "asc" },
  });

  let dailyMemoryRow = null;
  if (deviceId && deviceIds.length > 0) {
    dailyMemoryRow = await prisma.dailyMemory.findFirst({
      where: { deviceId, userId, date: dateStr },
      orderBy: { createdAt: "desc" },
    });
  } else {
    dailyMemoryRow = await prisma.dailyMemory.findFirst({
      where: { userId, date: dateStr },
      orderBy: { createdAt: "desc" },
    });
  }

  const payload: TodayApiResponse = {
    encounters: encounters.map(encounterRowToDto),
    dailyMemory: dailyMemoryRow ? dailyMemoryRowToDto(dailyMemoryRow) : null,
  };

  return NextResponse.json(payload);
}
