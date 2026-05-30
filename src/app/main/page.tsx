import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { MainHomeView } from "@/app/main/MainHomeView";
import { getSession } from "@/lib/auth/session";
import { isLocalMockMode } from "@/lib/localMockMode";
import { getProfileDeviceContext } from "@/lib/profileDeviceService";
import type { DailyMemory, EchoDevice, Encounter } from "@/lib/types";
import { profileHero, profileNoDevice } from "@/lib/uiPoetics";

export const dynamic = "force-dynamic";

function ownEchoComposition(device: EchoDevice): DailyMemory["composition"] {
  return {
    style: "single_echo_gradient",
    tempoBpm: 52,
    scale: "pentatonic",
    voices: [
      {
        echoType: device.echoType,
        presence: 1,
        melody: device.currentState.melody,
        averageCloseness: 0.7,
      },
    ],
  };
}

function ownEchoVisualization(
  device: EchoDevice,
): DailyMemory["visualization"] {
  const seed = Array.from(device.id).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  return {
    seed,
    density: Math.max(0.34, device.currentState.densityBias),
    brightness: Math.max(0.6, device.currentState.brightness),
    movement: 0.28,
  };
}

function ownEchoEncounter(device: EchoDevice): Encounter {
  return {
    id: `profile-own-${device.id}`,
    deviceId: device.id,
    otherEchoHash: device.echoName,
    otherEchoModelName: device.firmwareModelName,
    otherEchoName: device.echoName,
    otherEchoColor: device.echoColor,
    otherEchoType: device.echoType,
    startedAt: device.lastSyncedAt,
    endedAt: device.lastSyncedAt,
    durationSec: 420,
    rssiAvg: -58,
    rssiMin: -64,
    rssiMax: -50,
    proximityZone: "close",
    closenessAvg: 0.7,
    soundProfileId: device.currentSoundProfileId,
  };
}

export default async function MainPage() {
  const session = await getSession();
  if (!session && !isLocalMockMode()) {
    redirect("/login");
  }
  const userId = session?.userId ?? "local_mock";
  const ctx = await getProfileDeviceContext(userId);

  if (!ctx) {
    return (
      <AppShell
        intro={profileHero.intro}
        pageTitle={profileNoDevice.title}
      >
        <p className="max-w-lg font-body text-sm leading-6 text-text/80">
          {profileNoDevice.body}
        </p>
        <Link
          className="glass-btn-primary mt-8 inline-flex rounded-full px-6 py-3 font-body text-sm"
          href={profileNoDevice.ctaHref}
        >
          {profileNoDevice.ctaLabel}
        </Link>
      </AppShell>
    );
  }

  const { device: echoDevice, todayEncounters, todayMemory } = ctx;
  const hasTodayEncounters = todayEncounters.length > 0;
  const visualComposition =
    hasTodayEncounters && todayMemory
      ? todayMemory.composition
      : ownEchoComposition(echoDevice);
  const visualEncounters = hasTodayEncounters
    ? todayEncounters
    : [ownEchoEncounter(echoDevice)];
  const visualSettings =
    hasTodayEncounters && todayMemory
      ? { ...todayMemory.visualization, movement: 0.32 }
      : ownEchoVisualization(echoDevice);

  return (
    <MainHomeView
      echoDevice={echoDevice}
      hasTodayEncounters={hasTodayEncounters}
      visualComposition={visualComposition}
      visualEncounters={visualEncounters}
      visualSettings={visualSettings}
    />
  );
}
