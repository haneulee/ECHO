-- CreateEnum
CREATE TYPE "EvolutionMutationType" AS ENUM ('melody_fragment_exchange', 'envelope_shift', 'brightness_shift');

-- CreateTable
CREATE TABLE "EchoEvolution" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "dailyMemoryId" TEXT NOT NULL,
    "mutationType" "EvolutionMutationType" NOT NULL,
    "sourceEchoHash" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "beforeState" JSONB NOT NULL,
    "afterState" JSONB NOT NULL,
    "borrowedFragment" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EchoEvolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoundProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "engineType" TEXT NOT NULL,
    "scale" TEXT NOT NULL,
    "tempoBpm" INTEGER NOT NULL,
    "globalParams" JSONB NOT NULL,
    "voices" JSONB NOT NULL,

    CONSTRAINT "SoundProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EchoEvolution_deviceId_createdAt_idx" ON "EchoEvolution"("deviceId", "createdAt");

-- AddForeignKey
ALTER TABLE "EchoEvolution" ADD CONSTRAINT "EchoEvolution_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "EchoDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
