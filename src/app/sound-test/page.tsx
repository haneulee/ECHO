import { AppShell } from "@/components/AppShell";
import { SoundTestVoice } from "@/components/SoundTestVoice";
import { mockSoundProfile, mockSoundVoices } from "@/lib/mockData";

export default function SoundTestPage() {
  return (
    <AppShell
      eyebrow="Sound test"
      intro="Slow string-like tones expand harmonically as closeness rises. Use headphones at a low volume."
      title="Hear distance thicken."
    >
      <section className="mb-10 lg:max-w-3xl">
        <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
          {mockSoundProfile.scale}
        </p>
        <p className="mt-3 font-display text-[32px] leading-[38px] lg:text-[44px] lg:leading-[52px]">
          {mockSoundProfile.name}
        </p>
        <p className="mt-3 font-body text-base leading-6 text-text-muted">
          {mockSoundProfile.tempoBpm} BPM, long release, no percussion. The
          melody remains present while fifths, octaves, and shimmer notes arrive
          near the body.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {mockSoundVoices.map((voice) => (
          <SoundTestVoice key={voice.id} voice={voice} />
        ))}
      </div>
    </AppShell>
  );
}
