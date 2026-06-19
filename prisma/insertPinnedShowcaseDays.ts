/**
 * Upsert rich mock data for PINNED_SHOWCASE_DATES on the target database.
 * Safe to re-run — clears encounters + daily memories for each pinned day first.
 *
 * Usage: yarn db:insert-showcase
 * Prod:   dotenv -e .env.local -- tsx prisma/insertPinnedShowcaseDays.ts
 */
import { PrismaClient } from "@prisma/client";

import { zonedDayRangeUtc } from "../src/lib/zonedDayRange";
import {
  generateSeedData,
  PINNED_SHOWCASE_DATES,
  SEED_TIME_ZONE,
} from "./seed/generateSeedData";

const prisma = new PrismaClient();

async function insertShowcaseDay(date: string) {
  const range = zonedDayRangeUtc(date, SEED_TIME_ZONE);
  if (range) {
    await prisma.encounter.deleteMany({
      where: { startedAt: { gte: range.start, lt: range.end } },
    });
  }
  await prisma.dailyMemory.deleteMany({ where: { date } });

  const { encounters, dailyMemories } = generateSeedData(date, date);
  for (const memory of dailyMemories) {
    await prisma.dailyMemory.create({ data: memory });
  }
  for (const encounter of encounters) {
    await prisma.encounter.create({ data: encounter });
  }

  return { dailyMemories: dailyMemories.length, encounters: encounters.length };
}

async function main() {
  for (const date of PINNED_SHOWCASE_DATES) {
    const result = await insertShowcaseDay(date);
    console.log(
      `${date} (${SEED_TIME_ZONE}): dailyMemories=${result.dailyMemories} encounters=${result.encounters}`,
    );
  }
  console.log("Pinned showcase days inserted.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
