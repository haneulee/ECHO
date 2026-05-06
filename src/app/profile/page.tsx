import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { EchoCard } from "@/components/EchoCard";
import {
  echoTypeLabels,
  mockDailyMemory,
  mockEchoDevice,
  mockEncounters,
  mockSoundProfile,
} from "@/lib/mockData";

export default function ProfilePage() {
  return (
    <AppShell
      eyebrow="Profile"
      intro="A living sound identity that changes through nearby Echoes."
      title={mockEchoDevice.echoName}
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,1fr)] lg:items-start">
        <div>
          <EchoCard device={mockEchoDevice} />

          <section className="mt-12">
            <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
              Sonic identity
            </p>
            <h2 className="mt-3 font-display text-[32px] leading-[38px] lg:text-[40px] lg:leading-[46px]">
              {mockSoundProfile.name}
            </h2>
            <p className="mt-3 font-body text-base leading-6 text-text-muted">
              {mockSoundProfile.description}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-8 font-body text-sm leading-5 text-text-muted">
              <div>
                <p className="text-xs uppercase tracking-[0.22em]">Type</p>
                <p className="mt-2 text-text">
                  {echoTypeLabels[mockEchoDevice.echoType]}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em]">Synced</p>
                <p className="mt-2 text-text">
                  {new Date(mockEchoDevice.lastSyncedAt).toLocaleTimeString(
                    "en",
                    {
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="grid place-items-center">
          <section className="relative grid min-h-[560px] place-items-center">
            <AbstractMemoryVisual
              composition={mockDailyMemory.composition}
              encounters={mockEncounters}
              showMutation
              size={560}
              {...mockDailyMemory.visualization}
            />
            <p className="absolute bottom-8 max-w-xs text-center font-body text-sm leading-5 text-text-muted">
              A small chromatography trace of Namu&apos;s current sonic mixture.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
