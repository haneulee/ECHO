import { NextResponse } from "next/server";
import type { EchoDevice as PrismaEchoDevice } from "@prisma/client";

import {
  dailyMemoryRowToDto,
  echoDeviceRowToDto,
  encounterRowToDto,
} from "@/lib/dbSerializers";
import { getSession } from "@/lib/auth/session";
import { isDatabaseConnectFailure } from "@/lib/auth/resolveSessionUser";
import { mockTodayPayload } from "@/lib/mockTodayPayload";
import { prisma } from "@/lib/prisma";
import type { TodayApiResponse } from "@/lib/todayApiTypes";
import { isValidIanaTimeZone, zonedDayRangeUtc } from "@/lib/zonedDayRange";

export const dynamic = "force-dynamic";

function allowMockFallbackFor(request: Request): boolean {
  const host = request.headers.get("host") ?? "";
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ECHO_MOCK_TODAY === "1" ||
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1")
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const allowMockFallback = allowMockFallbackFor(request);
  const dateStr = searchParams.get("date");
  const deviceId = searchParams.get("deviceId");
  const timeZone =
    searchParams.get("timeZone") ??
    searchParams.get("timezone") ??
    "UTC";
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

  const session = await getSession();
  if (!session) {
    if (allowMockFallback) {
      return NextResponse.json(mockTodayPayload(dateStr));
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.userId;

  let deviceRows: PrismaEchoDevice[] = [];
  try {
    if (deviceId) {
      const owned = await prisma.echoDevice.findFirst({
        where: { id: deviceId, userId },
      });
      deviceRows = owned ? [owned] : [];
    } else {
      deviceRows = await prisma.echoDevice.findMany({
        where: { userId },
        orderBy: { id: "asc" },
      });
    }
    const deviceIds = deviceRows.map((d) => d.id);
    const primaryDevice = deviceRows[0] ?? null;

    if (deviceIds.length === 0) {
      const payload: TodayApiResponse = {
        encounters: [],
        dailyMemory: null,
        device: null,
      };
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
      device: primaryDevice ? echoDeviceRowToDto(primaryDevice) : null,
    };

    return NextResponse.json(payload);
  } catch (e) {
    if (allowMockFallback && isDatabaseConnectFailure(e)) {
      return NextResponse.json(mockTodayPayload(dateStr));
    }
    throw e;
  }
}
