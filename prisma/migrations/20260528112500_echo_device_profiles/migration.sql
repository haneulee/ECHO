-- EchoDevice: user-editable profile fields keyed by firmware model name.
ALTER TABLE "EchoDevice" ADD COLUMN "echoColor" TEXT NOT NULL DEFAULT '#FF9F6E';
ALTER TABLE "EchoDevice" ADD COLUMN "firmwareModelName" TEXT;

CREATE UNIQUE INDEX "EchoDevice_firmwareModelName_key" ON "EchoDevice"("firmwareModelName");

-- Encounter: station-supplied model name for profile lookup.
ALTER TABLE "Encounter" ADD COLUMN "otherEchoModelName" TEXT;

CREATE INDEX "Encounter_otherEchoModelName_idx" ON "Encounter"("otherEchoModelName");
