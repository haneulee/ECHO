-- EchoDevice: optional BLE / station metadata from ingest
ALTER TABLE "EchoDevice" ADD COLUMN "echoModelType" TEXT;
ALTER TABLE "EchoDevice" ADD COLUMN "uniqueDeviceName" TEXT;

-- EchoEvolution: align with Pi ingest (optional fields, free-form mutationType)
ALTER TABLE "EchoEvolution" ALTER COLUMN "mutationType" TYPE TEXT USING ("mutationType"::text);
ALTER TABLE "EchoEvolution" ALTER COLUMN "dailyMemoryId" DROP NOT NULL;
ALTER TABLE "EchoEvolution" ALTER COLUMN "borrowedFragment" DROP NOT NULL;
ALTER TABLE "EchoEvolution" ADD COLUMN "sourceEchoType" "EchoType";

DROP TYPE "EvolutionMutationType";
