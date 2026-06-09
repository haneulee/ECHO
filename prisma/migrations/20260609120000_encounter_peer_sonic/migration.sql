-- Peer sonic snapshot captured at BLE session end (Pi encounter_sonic_ingest)
ALTER TABLE "Encounter" ADD COLUMN "otherEchoProfileSnapshot" JSONB;
ALTER TABLE "Encounter" ADD COLUMN "otherEchoSonicSource" TEXT;
