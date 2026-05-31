import { NextResponse } from "next/server";
import type { EchoDevice as PrismaEchoDevice } from "@prisma/client";

import {
  dailyMemoryRowToDto,
  echoDeviceRowToDto,
  encounterRowToDto,
} from "@/lib/dbSerializers";
import { getSession } from "@/lib/auth/session";
import { isDatabaseConnectFailure } from "@/lib/auth/resolveSessionUser";
import { attachEncounterEchoProfiles } from "@/lib/encounterProfileLookup";
import { adjacentPeriodAvailability } from "@/lib/encounterPeriodAvailability";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";
import { mockTodayPayload } from "@/lib/mockTodayPayload";
import { prisma } from "@/lib/prisma";
import type { TodayApiResponse } from "@/lib/todayApiTypes";
import {
  isValidIanaTimeZone,
  zonedDayRangeUtc,
  zonedSpanRangeUtc,
  type OverviewSpan,
} from "@/lib/zonedDayRange";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
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

  const spanParam = searchParams.get("span");
  const span: OverviewSpan =
    spanParam === "weekly" || spanParam === "monthly" ? spanParam : "daily";
  const range =
    span === "daily"
      ? zonedDayRangeUtc(dateStr, timeZone)
      : zonedSpanRangeUtc(dateStr, timeZone, span);
  if (!range) {
    return NextResponse.json(
      { error: "Invalid date; use YYYY-MM-DD" },
      { status: 400 },
    );
  }

  if (isLocalMockMode()) {
    logDatabaseUnavailable("/api/today local mock mode");
    return NextResponse.json(mockTodayPayload(dateStr, span, timeZone));
  }

  const session = await getSession();
  if (!session) {
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
        hasPrevPeriod: false,
        hasNextPeriod: false,
      };
      return NextResponse.json(payload);
    }

    const countEncounters = async (range: { start: Date; end: Date }) =>
      prisma.encounter.count({
        where: {
          deviceId: { in: deviceIds },
          startedAt: { gte: range.start, lt: range.end },
        },
      });

    const [{ hasPrev, hasNext }, encounters] = await Promise.all([
      adjacentPeriodAvailability(
        countEncounters,
        dateStr,
        span,
        timeZone,
      ),
      prisma.encounter.findMany({
        where: {
          deviceId: { in: deviceIds },
          startedAt: { gte: range.start, lt: range.end },
        },
        orderBy: { startedAt: "asc" },
      }),
    ]);

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
      encounters: await attachEncounterEchoProfiles(
        prisma,
        encounters.map(encounterRowToDto),
      ),
      dailyMemory: dailyMemoryRow ? dailyMemoryRowToDto(dailyMemoryRow) : null,
      device: primaryDevice ? echoDeviceRowToDto(primaryDevice) : null,
      hasPrevPeriod: hasPrev,
      hasNextPeriod: hasNext,
    };

    return NextResponse.json(payload);
  } catch (e) {
    if (isDatabaseConnectFailure(e)) {
      logDatabaseUnavailable("/api/today", e);
      return NextResponse.json(mockTodayPayload(dateStr, span, timeZone));
    }
    throw e;
  }
}
