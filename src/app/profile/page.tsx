import Link from "next/link";
import { redirect } from "next/navigation";

import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth/session";
import { echoTypeLabels } from "@/lib/echoTypeMeta";
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
    movement: 0.2,
  };
}

function ownEchoEncounter(device: EchoDevice): Encounter {
  return {
    id: `profile-own-${device.id}`,
    deviceId: device.id,
    otherEchoHash: device.echoName,
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

export default async function ProfilePage() {
  const session = await getSession();
  if (!session && !isLocalMockMode()) {
    redirect("/login");
  }
  const userId = session?.userId ?? "local_mock";
  const ctx = await getProfileDeviceContext(userId);

  if (!ctx) {
    return (
      <AppShell
        eyebrow={profileHero.eyebrow}
        intro={profileHero.intro}
        title={profileNoDevice.title}
      >
        <p className="max-w-lg font-body text-sm leading-6 text-text/80">
          {profileNoDevice.body}
        </p>
        <Link
          className="mt-8 inline-flex rounded-full bg-nav-active px-6 py-3 font-body text-sm text-white transition hover:opacity-90"
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
      ? todayMemory.visualization
      : ownEchoVisualization(echoDevice);

  return (
    <AppShell echoTheme={echoDevice.echoType} hideChrome viewportLocked>
      <section className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col items-center justify-between pt-16 text-center sm:pt-14 lg:pt-8">
        <h1 className="shrink-0 font-display text-[clamp(1rem,7vw,3rem)] leading-[0.9] tracking-[-0.055em]">
          Your daily encounters
        </h1>
        <div className="grid min-h-0 flex-1 place-items-center py-2 sm:py-3 lg:py-1">
          <AbstractMemoryVisual
            composition={visualComposition}
            encounters={visualEncounters}
            gradientOnly
            size={320}
            visualId={`profile-home-${echoDevice.id}`}
            {...visualSettings}
          />
        </div>
        <div className="shrink-0 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pb-[max(3rem,env(safe-area-inset-bottom))] lg:pb-[max(3.75rem,env(safe-area-inset-bottom))]">
          <div>
            <p className="font-display text-[clamp(0.8rem,5vw,2rem)] leading-none tracking-[-0.045em]">
              {echoDevice.echoName}
            </p>
            <p className="mt-2 font-body text-xs uppercase tracking-[0.24em] text-text-muted">
              {echoTypeLabels[echoDevice.echoType]}
            </p>
          </div>
          {!hasTodayEncounters ? (
            <p className="mt-3 max-w-sm font-body text-sm leading-6 text-text-muted">
              No one has crossed its field yet, so today holds only your
              Echo&apos;s own color.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              className="rounded-full bg-nav-active px-6 py-3 font-body text-sm text-white transition hover:opacity-90"
              href="/today"
            >
              open a map
            </Link>
            <Link
              className="rounded-full border border-border bg-surface/65 px-6 py-3 font-body text-sm text-text transition hover:bg-surface"
              href="/archive"
            >
              memories
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
