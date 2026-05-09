import { AppShell } from "@/components/AppShell";
import { EchoPersonalitySliders } from "@/components/EchoPersonalitySliders";
import { EvolutionCard } from "@/components/EvolutionCard";
import { EchoPointCloudHero } from "@/components/profile/EchoPointCloudHero";
import { SoundMemoryPlayer } from "@/components/SoundMemoryPlayer";
import { echoTypeToPointCloudVisual } from "@/lib/echoPointCloudMapping";
import { echoTypeLabels, mockEchoDevice, mockEvolutions } from "@/lib/mockData";

export default function ProfilePage() {
  return (
    <AppShell
      eyebrow="My Echo"
      intro="Namu's current sound, held as a visual memory."
      title={mockEchoDevice.echoName}
    >
      <section className="relative isolate overflow-visible sm:min-h-[540px] lg:min-h-[660px]">
        <div className="relative z-10 flex max-w-xl flex-row justify-between gap-3 font-body text-sm leading-5 text-text-muted sm:grid sm:grid-cols-3 sm:justify-start sm:gap-x-10 sm:gap-y-0">
          <div className="min-w-0 flex-1 sm:block sm:flex-none">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              Name
            </p>
            <p className="mt-1 truncate text-text sm:mt-2">
              {mockEchoDevice.echoName}
            </p>
          </div>
          <div className="min-w-0 flex-1 text-center sm:block sm:flex-none sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              Model
            </p>
            <p className="mt-1 truncate text-text sm:mt-2">
              {echoTypeLabels[mockEchoDevice.echoType]}
            </p>
          </div>
          <div className="min-w-0 flex-1 text-right sm:block sm:flex-none sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:text-xs">
              Synced
            </p>
            <p className="mt-1 whitespace-nowrap text-text sm:mt-2">
              {new Date(mockEchoDevice.lastSyncedAt).toLocaleTimeString("en", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="relative z-0 mt-10 -mx-6 w-[calc(100%+3rem)] max-w-none sm:absolute sm:left-1/2 sm:top-12 sm:mt-0 sm:mx-0 sm:w-screen sm:max-w-[100vw] sm:-translate-x-1/2 lg:top-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-[2px]">
            <EchoPointCloudHero
              personality={
                echoTypeToPointCloudVisual[mockEchoDevice.echoType]
              }
            />
          </div>
        </div>

      </section>

      <div className="relative z-20 -mt-1 w-full sm:-mt-6 lg:-mt-10">
        <SoundMemoryPlayer
          melody={mockEchoDevice.currentState.melody}
          title={`${mockEchoDevice.echoName}'s melody`}
          variant="controlRow"
        />
      </div>

      <EchoPersonalitySliders device={mockEchoDevice} />

      <section className="mt-24 border-t border-text/10 pt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(260px,0.38fr)_1fr]">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
              Sonic evolution
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
