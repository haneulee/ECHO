import { z, coerce } from "zod";

import {
  isValidFirmwareModelName,
  normalizeFirmwareModelName,
} from "@/lib/echoFirmwareModelName";

const echoType = z.enum(["shy", "messy", "bounce"]);
const proximityZone = z.enum(["far", "near", "close", "very_close"]);

/** Pi/ESP JSON object payloads (arbitrary keys). */
const jsonObject = z.record(z.string(), z.unknown());

const finite = z.number().refine((n) => Number.isFinite(n), "expected finite number");

export const ingestEncounterItemSchema = z.object({
  id: z.string().trim().min(1),
  deviceId: z.string().trim().min(1),
  otherEchoHash: z.string().trim().min(1),
  otherEchoModelName: z
    .string()
    .transform(normalizeFirmwareModelName)
    .refine(isValidFirmwareModelName, "expected ECHO_[A-Z0-9_-]+")
    .optional(),
  otherEchoType: echoType,
  startedAt: coerce.date(),
  endedAt: coerce.date(),
  durationSec: z.coerce.number().pipe(z.number().int()),
  rssiAvg: finite,
  rssiMin: z.coerce
    .number()
    .transform((n) => Math.round(n))
    .pipe(z.number().int()),
  rssiMax: z.coerce
    .number()
    .transform((n) => Math.round(n))
    .pipe(z.number().int()),
  closenessAvg: finite,
  proximityZone,
  soundProfileId: z.string().trim().min(1),
});

export const ingestEncountersBodySchema = z.array(ingestEncounterItemSchema);

export const ingestEvolutionItemSchema = z.object({
  id: z.string().trim().min(1),
  deviceId: z.string().trim().min(1),
  mutationType: z
    .string()
    .trim()
    .min(1)
    .optional()
    .transform((v) => v ?? "melody_fragment_exchange"),
  sourceEchoHash: z.string().trim().min(1),
  trigger: jsonObject,
  beforeState: jsonObject,
  afterState: jsonObject,
  createdAt: coerce.date(),
  borrowedFragment: jsonObject.nullish(),
  dailyMemoryId: z.string().trim().min(1).nullish(),
  sourceEchoType: echoType.nullish(),
});

export const ingestEvolutionsBodySchema = z.array(ingestEvolutionItemSchema);

export const ingestEchoStateBodySchema = z.object({
  deviceId: z.string().trim().min(1),
  soundProfileId: z.string().trim().min(1),
  profileSnapshot: jsonObject,
  lastSyncedAt: coerce.date(),
  echoModelType: z.string().trim().min(1).optional(),
  uniqueDeviceName: z.string().trim().min(1).optional(),
});
