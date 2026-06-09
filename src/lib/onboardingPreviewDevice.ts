import { defaultStateForType } from "@/lib/echoDeviceDefaults";
import { normalizeEchoColor } from "@/lib/echoColor";
import {
  echoTypeFromFirmwareModelName,
  isValidFirmwareModelName,
  normalizeFirmwareModelName,
} from "@/lib/echoFirmwareModelName";
import type { EchoDevice, EchoType } from "@/lib/types";

const ONBOARDING_PREVIEW_DEVICE_ID = "onboarding-preview";

export function buildOnboardingPreviewDevice(input: {
  echoName: string;
  echoColor: string;
  firmwareModelName: string;
}): EchoDevice {
  const firmware = normalizeFirmwareModelName(input.firmwareModelName);
  const echoType: EchoType = isValidFirmwareModelName(firmware)
    ? echoTypeFromFirmwareModelName(firmware)
    : "bounce";

  return {
    id: ONBOARDING_PREVIEW_DEVICE_ID,
    userId: "onboarding",
    serialNumber: "preview",
    echoName: input.echoName.trim() || "my Echo",
    echoColor: normalizeEchoColor(input.echoColor),
    firmwareModelName: firmware || null,
    echoType,
    currentSoundProfileId: "preview",
    currentState: defaultStateForType(echoType),
    lastSyncedAt: new Date().toISOString(),
  };
}
