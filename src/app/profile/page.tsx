import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { EvolutionResonancePreview } from "@/components/EvolutionResonancePreview";
import { ProfileFirmwareSoundPlayer } from "@/components/ProfileFirmwareSoundPlayer";
import { ProfileHeroLab } from "@/components/profile/ProfileHeroLab";
import { echoTypeToPointCloudVisual } from "@/lib/echoPointCloudMapping";
import { getSession } from "@/lib/auth/session";
import { echoTypeLabels } from "@/lib/echoTypeMeta";
import { isLocalMockMode } from "@/lib/localMockMode";
import { getProfileDeviceContext } from "@/lib/profileDeviceService";
import { vaguePresenceFromIso } from "@/lib/profilePoetics";
import {
  profileHero,
  profileLabels,
  profileNoDevice,
  profileSections,
} from "@/lib/uiPoetics";

export const dynamic = "force-dynamic";

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

  const { device: echoDevice, evolutions } = ctx;
  const ecologyPersonality = echoTypeToPointCloudVisual[echoDevice.echoType];
  const melodyNotes = echoDevice.currentState.melody.join(" · ");
  const latestEvolution = evolutions[0] ?? null;

  return (
    <AppShell eyebrow={profileHero.eyebrow} title={echoDevice.echoName}>
      <section className="relative isolate flex flex-col overflow-x-clip">
        <div className="relative z-10 shrink-0 flex max-w-xl flex-row justify-between gap-3 font-body text-sm leading-5 text-text-muted sm:grid sm:grid-cols-3 sm:justify-start sm:gap-x-10 sm:gap-y-0">
          <div className="min-w-0 flex-1 sm:block sm:flex-none">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              {profileLabels.type}
            </p>
            <p className="mt-1 truncate text-text sm:mt-2">
              {echoTypeLabels[echoDevice.echoType]}
            </p>
          </div>
          <div className="min-w-0 flex-1 text-center sm:block sm:flex-none sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              {profileLabels.melodyNotes}
            </p>
            <p className="mt-1 break-words text-text sm:mt-2">
              {melodyNotes}
            </p>
          </div>
          <div className="min-w-0 flex-1 text-right sm:block sm:flex-none sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              {profileLabels.presence}
            </p>
            <p className="mt-1 text-text sm:mt-2">
              {vaguePresenceFromIso(echoDevice.lastSyncedAt)}
            </p>
          </div>
        </div>

        <div className="relative z-0 mt-2 flex w-full flex-col items-center gap-3 pt-1 sm:mt-3 sm:gap-4 sm:pt-2 lg:mt-4 lg:gap-5">
          <div className="mx-auto flex w-full max-w-[min(100%,520px)] justify-center">
            <ProfileHeroLab ecologyPersonality={ecologyPersonality} />
          </div>
          <div className="relative z-20 flex w-full max-w-xl justify-center px-4">
            <div className="rounded-full border border-[#26231F]/[0.08] bg-white/95 px-4 py-2.5 shadow-[0_12px_48px_rgba(38,35,31,0.12)] backdrop-blur-md">
              <ProfileFirmwareSoundPlayer
                device={echoDevice}
                title={profileSections.soundPlayerTitle}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mt-14 scroll-mt-28 border-t border-text/10 pt-12 sm:mt-20 sm:pt-16 lg:mt-24 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(260px,0.38fr)_1fr]">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
              {profileSections.evolutionEyebrow}
            </p>
            <h2 className="mt-3 font-display text-[40px] leading-[44px] tracking-[-0.03em]">
              {profileSections.evolutionTitle}
            </h2>
          </div>
          <div className="grid gap-10">
            {!latestEvolution ? (
              <p className="font-body text-sm text-text/75">
                No evolutions recorded yet.
              </p>
            ) : (
              <EvolutionResonancePreview evolution={latestEvolution} />
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
