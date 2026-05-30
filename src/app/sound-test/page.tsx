import { AppShell } from "@/components/AppShell";
import { SoundTestVoice } from "@/components/SoundTestVoice";
import { getSoundLabPayload } from "@/lib/soundLabService";
import { soundTestHero, soundTestProfileIntro } from "@/lib/uiPoetics";

export const dynamic = "force-dynamic";

export default async function SoundTestPage() {
  const lab = await getSoundLabPayload();

  if (!lab) {
    return (
      <AppShell intro={soundTestHero.intro} pageTitle={soundTestHero.title}>
        <p className="max-w-lg font-body text-sm text-text/80">
          No sound profile in the database. Run{" "}
          <code className="rounded bg-surface-soft px-1 py-0.5 text-xs">
            yarn db:seed
          </code>{" "}
          to load the default lab profile.
        </p>
      </AppShell>
    );
  }

  const { profile, voices } = lab;

  return (
    <AppShell intro={soundTestHero.intro} pageTitle={soundTestHero.title}>
      <section className="mb-14 lg:max-w-3xl">
        <p className="font-body text-xs uppercase text-text-muted">
          {profile.scale}
        </p>
        <p className="mt-3 font-display text-[32px] leading-[38px] lg:text-[44px] lg:leading-[52px]">
          {profile.name}
        </p>
        <p className="mt-3 font-body text-base leading-6 text-text-muted">
          {soundTestProfileIntro}
        </p>
        <p className="mt-2 font-body text-sm tabular-nums text-text-muted/85">
          {profile.tempoBpm} BPM · long release
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {voices.map((voice) => (
          <SoundTestVoice key={voice.id} voice={voice} />
        ))}
      </div>
    </AppShell>
  );
}
