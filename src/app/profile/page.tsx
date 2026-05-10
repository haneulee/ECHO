import { AppShell } from "@/components/AppShell";
import { EvolutionCard } from "@/components/EvolutionCard";
import { ProfileHeroLab } from "@/components/profile/ProfileHeroLab";
import { SoundMemoryPlayer } from "@/components/SoundMemoryPlayer";
import { echoTypeToPointCloudVisual } from "@/lib/echoPointCloudMapping";
import {
  echoTemperamentEcology,
  vaguePresenceFromIso,
} from "@/lib/profilePoetics";
import { profileHero, profileLabels, profileSections } from "@/lib/uiPoetics";
import { mockEchoDevice, mockEvolutions } from "@/lib/mockData";

export default function ProfilePage() {
  const ecologyPersonality =
    echoTypeToPointCloudVisual[mockEchoDevice.echoType];

  return (
    <AppShell eyebrow={profileHero.eyebrow} title={mockEchoDevice.echoName}>
      <section className="relative isolate flex flex-col overflow-x-clip">
        <div className="relative z-10 shrink-0 flex max-w-xl flex-row justify-between gap-3 font-body text-sm leading-5 text-text-muted sm:grid sm:grid-cols-3 sm:justify-start sm:gap-x-10 sm:gap-y-0">
          <div className="min-w-0 flex-1 sm:block sm:flex-none">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              {profileLabels.name}
            </p>
            <p className="mt-1 truncate text-text sm:mt-2">
              {mockEchoDevice.echoName}
            </p>
          </div>
          <div className="min-w-0 flex-1 text-center sm:block sm:flex-none sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              {profileLabels.temperament}
            </p>
            <p className="mt-1 truncate text-text sm:mt-2">
              {echoTemperamentEcology[mockEchoDevice.echoType]}
            </p>
          </div>
          <div className="min-w-0 flex-1 text-right sm:block sm:flex-none sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              {profileLabels.presence}
            </p>
            <p className="mt-1 text-text sm:mt-2">
              {vaguePresenceFromIso(mockEchoDevice.lastSyncedAt)}
            </p>
          </div>
        </div>

        {/* Stack from the top—no flex-1 vertical centering so visual + audio sit higher on all breakpoints */}
        <div className="relative z-0 mt-2 flex w-full flex-col items-center gap-3 pt-1 sm:mt-3 sm:gap-4 sm:pt-2 lg:mt-4 lg:gap-5">
          <div className="mx-auto flex w-full max-w-[min(100%,520px)] justify-center">
            <ProfileHeroLab ecologyPersonality={ecologyPersonality} />
          </div>
          <div className="relative z-20 flex w-full max-w-xl justify-center px-4">
            <div className="rounded-full border border-[#26231F]/[0.08] bg-white/95 px-4 py-2.5 shadow-[0_12px_48px_rgba(38,35,31,0.12)] backdrop-blur-md">
              <SoundMemoryPlayer
                melody={mockEchoDevice.currentState.melody}
                title={profileSections.soundPlayerTitle}
                variant="controlRow"
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
            {mockEvolutions.map((evolution) => (
              <EvolutionCard evolution={evolution} key={evolution.id} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
