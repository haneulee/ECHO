import { AppShell } from "@/components/AppShell";
import { EchoPersonalitySliders } from "@/components/EchoPersonalitySliders";
import { EvolutionCard } from "@/components/EvolutionCard";
import { ProfileHeroLab } from "@/components/profile/ProfileHeroLab";
import { SoundMemoryPlayer } from "@/components/SoundMemoryPlayer";
import { echoTypeToPointCloudVisual } from "@/lib/echoPointCloudMapping";
import {
  echoTemperamentEcology,
  vaguePresenceFromIso,
} from "@/lib/profilePoetics";
import { mockEchoDevice, mockEvolutions } from "@/lib/mockData";

export default function ProfilePage() {
  const ecologyPersonality =
    echoTypeToPointCloudVisual[mockEchoDevice.echoType];

  return (
    <AppShell
      eyebrow="A shell carrying quiet signals"
      intro="Listen slowly—the surface is also a memory."
      title={mockEchoDevice.echoName}
    >
      <section className="relative isolate overflow-visible sm:min-h-[540px] lg:min-h-[660px]">
        <div className="relative z-10 flex max-w-xl flex-row justify-between gap-3 font-body text-sm leading-5 text-text-muted sm:grid sm:grid-cols-3 sm:justify-start sm:gap-x-10 sm:gap-y-0">
          <div className="min-w-0 flex-1 sm:block sm:flex-none">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              Held name
            </p>
            <p className="mt-1 truncate text-text sm:mt-2">
              {mockEchoDevice.echoName}
            </p>
          </div>
          <div className="min-w-0 flex-1 text-center sm:block sm:flex-none sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              Temperament
            </p>
            <p className="mt-1 truncate text-text sm:mt-2">
              {echoTemperamentEcology[mockEchoDevice.echoType]}
            </p>
          </div>
          <div className="min-w-0 flex-1 text-right sm:block sm:flex-none sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              Presence
            </p>
            <p className="mt-1 text-text sm:mt-2">
              {vaguePresenceFromIso(mockEchoDevice.lastSyncedAt)}
            </p>
          </div>
        </div>

        <div className="relative z-0 mt-10 -mx-6 w-[calc(100%+3rem)] max-w-none sm:absolute sm:left-1/2 sm:top-12 sm:mt-0 sm:mx-0 sm:w-screen sm:max-w-[100vw] sm:-translate-x-1/2 lg:top-0">
            <ProfileHeroLab ecologyPersonality={ecologyPersonality} />
        </div>

      </section>

      <div className="relative z-20 -mt-1 w-full sm:-mt-6 lg:-mt-10">
        <SoundMemoryPlayer
          melody={mockEchoDevice.currentState.melody}
          title="Collected resonances"
          variant="controlRow"
        />
      </div>

      <EchoPersonalitySliders device={mockEchoDevice} />

      <section className="mt-24 border-t border-text/10 pt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(260px,0.38fr)_1fr]">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
              Traces that remained
            </p>
            <h2 className="mt-3 font-display text-[40px] leading-[44px] tracking-[-0.03em]">
              Kept from closeness.
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
