import { NextResponse } from "next/server";
import type { EchoDevice as PrismaEchoDevice } from "@prisma/client";

import {
  dailyMemoryRowToDto,
  echoDeviceRowToDto,
  encounterRowToDto,
} from "@/lib/dbSerializers";
import { getSession } from "@/lib/auth/session";
import { attachEncounterEchoProfiles } from "@/lib/encounterProfileLookup";
import {
  encounterLocalIsoDates,
  periodAnchorsFromIsoDates,
  resolveOverviewPeriodNavigation,
} from "@/lib/encounterPeriodAvailability";
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

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.userId;

  let deviceRows: PrismaEchoDevice[] = [];
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
  const deviceIds = new Set(deviceRows.map((d) => d.id));
  const primaryDevice = deviceRows[0] ?? null;
  const encounterDeviceIds = deviceRows.map((d) => d.id);

  const memoryWhere = deviceId ? { userId, deviceId } : { userId };
  const memoryDeviceRows = await prisma.dailyMemory.findMany({
    where: memoryWhere,
    select: { deviceId: true },
    distinct: ["deviceId"],
  });
  for (const row of memoryDeviceRows) {
    deviceIds.add(row.deviceId);
  }
  const navigationDeviceIds = [...deviceIds];

  if (encounterDeviceIds.length === 0) {
    const payload: TodayApiResponse = {
      encounters: [],
      dailyMemory: null,
      device: null,
      hasPrevPeriod: false,
      hasNextPeriod: false,
      prevPeriodDate: null,
      nextPeriodDate: null,
    };
    return NextResponse.json(payload);
  }

  const [encounterRows, memoryRows, encounters] = await Promise.all([
    prisma.encounter.findMany({
      where: { deviceId: { in: navigationDeviceIds } },
      select: { startedAt: true },
    }),
    prisma.dailyMemory.findMany({
      where: memoryWhere,
      select: { date: true },
    }),
    prisma.encounter.findMany({
      where: {
        deviceId: { in: encounterDeviceIds },
        startedAt: { gte: range.start, lt: range.end },
      },
      orderBy: { startedAt: "asc" },
    }),
  ]);

  const isoDates = [
    ...encounterLocalIsoDates(
      encounterRows.map((row) => row.startedAt),
      timeZone,
    ),
    ...memoryRows.map((row) => row.date),
  ];
  const periodAnchors = periodAnchorsFromIsoDates(isoDates, span, timeZone);
  const navigation = resolveOverviewPeriodNavigation(
    periodAnchors,
    dateStr,
    span,
    timeZone,
  );

  let dailyMemoryRow = null;
  if (deviceId && encounterDeviceIds.length > 0) {
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
    hasPrevPeriod: navigation.hasPrev,
    hasNextPeriod: navigation.hasNext,
    prevPeriodDate: navigation.prevPeriodDate,
    nextPeriodDate: navigation.nextPeriodDate,
  };

  return NextResponse.json(payload);
}
