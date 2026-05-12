-- CreateEnum
CREATE TYPE "EchoType" AS ENUM ('shy', 'messy', 'bounce');

-- CreateEnum
CREATE TYPE "ProximityZone" AS ENUM ('far', 'near', 'close', 'very_close');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EchoDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "echoName" TEXT NOT NULL,
    "echoType" "EchoType" NOT NULL,
    "currentSoundProfileId" TEXT,
    "currentState" JSONB NOT NULL DEFAULT '{}',
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "EchoDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Encounter" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "otherEchoHash" TEXT NOT NULL,
    "otherEchoType" "EchoType" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "rssiAvg" DOUBLE PRECISION NOT NULL,
    "rssiMin" INTEGER NOT NULL,
    "rssiMax" INTEGER NOT NULL,
    "proximityZone" "ProximityZone" NOT NULL,
    "closenessAvg" DOUBLE PRECISION NOT NULL,
    "soundProfileId" TEXT NOT NULL,

    CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "soundProfileId" TEXT NOT NULL,
    "profileSnapshot" JSONB NOT NULL DEFAULT '{}',
    "totalEncounters" INTEGER NOT NULL,
    "totalDurationSec" INTEGER NOT NULL,
    "dominantZone" "ProximityZone" NOT NULL,
    "dominantEchoType" "EchoType" NOT NULL,
    "composition" JSONB NOT NULL DEFAULT '{}',
    "visualization" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EchoDevice_userId_idx" ON "EchoDevice"("userId");

-- CreateIndex
CREATE INDEX "Encounter_deviceId_startedAt_idx" ON "Encounter"("deviceId", "startedAt");

-- CreateIndex
CREATE INDEX "DailyMemory_userId_date_idx" ON "DailyMemory"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMemory_userId_deviceId_date_key" ON "DailyMemory"("userId", "deviceId", "date");

-- AddForeignKey
ALTER TABLE "EchoDevice" ADD CONSTRAINT "EchoDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "EchoDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMemory" ADD CONSTRAINT "DailyMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMemory" ADD CONSTRAINT "DailyMemory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "EchoDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
