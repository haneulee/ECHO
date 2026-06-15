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

const peerMelodySemiSchema = z
  .array(z.coerce.number())
  .min(1)
  .max(8)
  .optional();

export const peerProfileSnapshotIngestSchema = z
  .object({
    melodySemi: peerMelodySemiSchema,
    brightness: z.coerce.number().min(0).max(1).optional(),
    calmness: z.coerce.number().min(0).max(1).optional(),
    densityBias: z.coerce.number().min(0).max(1).optional(),
  })
  .optional();

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
  otherEchoProfileSnapshot: peerProfileSnapshotIngestSchema.nullish(),
  otherEchoSonicSource: z.enum(["ble_adv", "factory_default"]).nullish(),
});

export const ingestEncountersBodySchema = z.array(ingestEncounterItemSchema);

export const ingestEvolutionItemSchema = z
  .object({
    v: z.coerce.number().optional(),
    id: z.string().trim().min(1),
    deviceId: z.string().trim().min(1),
    mutationType: z
      .string()
      .trim()
      .min(1)
      .optional()
      .transform((v) => v ?? "melody_fragment_exchange"),
    sourceEchoHash: z.string().trim().min(1).optional(),
    sourceTarget: z.string().trim().min(1).optional(),
    trigger: jsonObject,
    beforeState: jsonObject,
    afterState: jsonObject,
    createdAt: coerce.date().optional(),
    createdAtMs: z.coerce.number().optional(),
    borrowedFragment: jsonObject.nullish(),
    dailyMemoryId: z.string().trim().min(1).nullish(),
    sourceEchoType: echoType.nullish(),
  })
  .transform((item) => ({
    id: item.id,
    deviceId: item.deviceId,
    mutationType: item.mutationType,
    sourceEchoHash: item.sourceEchoHash ?? item.sourceTarget ?? "",
    trigger: item.trigger,
    beforeState: item.beforeState,
    afterState: item.afterState,
    createdAt:
      item.createdAt ??
      (item.createdAtMs != null ? new Date(item.createdAtMs) : new Date()),
    borrowedFragment: item.borrowedFragment,
    dailyMemoryId: item.dailyMemoryId,
    sourceEchoType: item.sourceEchoType,
  }))
  .refine((item) => item.sourceEchoHash.length > 0, {
    message: "sourceEchoHash or sourceTarget is required",
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
