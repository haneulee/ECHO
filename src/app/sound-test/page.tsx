import { AppShell } from "@/components/AppShell";
import { SoundTestVoice } from "@/components/SoundTestVoice";
import { mockSoundProfile, mockSoundVoices } from "@/lib/mockData";
import { soundTestHero, soundTestProfileIntro } from "@/lib/uiPoetics";

export default function SoundTestPage() {
  return (
    <AppShell
      eyebrow={soundTestHero.eyebrow}
      intro={soundTestHero.intro}
      title={soundTestHero.title}
    >
      <section className="mb-14 lg:max-w-3xl">
        <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
          {mockSoundProfile.scale}
        </p>
        <p className="mt-3 font-display text-[32px] leading-[38px] lg:text-[44px] lg:leading-[52px]">
          {mockSoundProfile.name}
        </p>
        <p className="mt-3 font-body text-base leading-6 text-text-muted">
          {soundTestProfileIntro}
        </p>
        <p className="mt-2 font-body text-sm tabular-nums tracking-wide text-text-muted/85">
          {mockSoundProfile.tempoBpm} BPM · long release
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {mockSoundVoices.map((voice) => (
          <SoundTestVoice key={voice.id} voice={voice} />
        ))}
      </div>
    </AppShell>
  );
}
