import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { EchoPersonalitySliders } from "@/components/EchoPersonalitySliders";
import { EvolutionCard } from "@/components/EvolutionCard";
import { SoundMemoryPlayer } from "@/components/SoundMemoryPlayer";
import {
  echoTypeLabels,
  mockDailyMemory,
  mockEchoDevice,
  mockEncounters,
  mockEvolutions,
} from "@/lib/mockData";

export default function ProfilePage() {
  return (
    <AppShell
      eyebrow="My Echo"
      intro="Namu's current sound, held as a visual memory."
      title={mockEchoDevice.echoName}
    >
      <section className="relative isolate overflow-visible sm:min-h-[540px] lg:min-h-[660px]">
        <div className="relative z-10 grid max-w-xl grid-cols-1 gap-8 font-body text-sm leading-5 text-text-muted sm:grid-cols-3 sm:gap-x-10 sm:gap-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em]">Name</p>
            <p className="mt-2 text-text">{mockEchoDevice.echoName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em]">Model</p>
            <p className="mt-2 text-text">
              {echoTypeLabels[mockEchoDevice.echoType]}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em]">Synced</p>
            <p className="mt-2 text-text">
              {new Date(mockEchoDevice.lastSyncedAt).toLocaleTimeString("en", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="relative z-0 mx-auto mt-10 w-full max-w-[720px] sm:absolute sm:left-1/2 sm:top-12 sm:mt-0 sm:-translate-x-1/2 lg:top-0">
          <div className="relative">
            <AbstractMemoryVisual
              composition={mockDailyMemory.composition}
              encounters={mockEncounters}
              showMutation
              size={720}
              {...mockDailyMemory.visualization}
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
