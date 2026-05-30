"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { enrichMelodyNote, getProximityZone } from "@/lib/soundRules";
import type { SoundVoice } from "@/lib/types";
import { DistanceSlider } from "./DistanceSlider";
import { MelodyView } from "./MelodyView";

type SoundTestVoiceProps = {
  voice: SoundVoice;
};

export function SoundTestVoice({ voice }: SoundTestVoiceProps) {
  const [closeness, setCloseness] = useState(0.42);
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<unknown>(null);
  const eventIdRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const closenessRef = useRef(closeness);

  useEffect(() => {
    closenessRef.current = closeness;
  }, [closeness]);

  useEffect(() => {
    return () => {
      void stopVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureSynth() {
    if (synthRef.current) return synthRef.current;

    Tone.Transport.bpm.value = 52;

    const reverb = new Tone.Reverb({
      decay: 9,
      preDelay: 0.08,
      wet: 0.72,
    }).toDestination();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: voice.role === "bass" ? "sine" : "triangle",
      },
      envelope: {
        attack: 0.8,
        decay: 0.3,
        sustain: 0.56,
        release: voice.role === "bass" ? 5.6 : 4.4,
      },
      volume: voice.role === "bass" ? -16 : -20,
    }).connect(reverb);

    synthRef.current = synth;
    return synth;
  }

  async function playVoice() {
    await Tone.start();
    const synth = await ensureSynth();

    if (eventIdRef.current !== null) {
      Tone.Transport.clear(eventIdRef.current);
    }

    eventIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const melody = voice.melodyRules.melody;
      const note = melody[stepRef.current % melody.length];
      const notes = enrichMelodyNote(
        note,
        voice.melodyRules.harmony,
        closenessRef.current,
      );

      (
        synth as {
          triggerAttackRelease: (
            notes: string[],
            duration: string,
            time: number,
            velocity: number,
          ) => void;
        }
      ).triggerAttackRelease(notes, "1n", time, 0.42);
      stepRef.current += 1;
    }, "2n");

    Tone.Transport.start();
    setIsPlaying(true);
  }

  async function stopVoice() {
    if (eventIdRef.current !== null) {
      Tone.Transport.clear(eventIdRef.current);
      eventIdRef.current = null;
    }
    (
      synthRef.current as
        | {
            releaseAll?: () => void;
            dispose?: () => void;
          }
        | null
    )?.releaseAll?.();
    setIsPlaying(false);
  }

  const zone = getProximityZone(closeness);

  return (
    <section className="py-6">
      <div className="flex items-start justify-between gap-4 lg:min-h-28">
        <div>
          <p className="font-body text-xs uppercase text-text-muted">
            {zone.replace("_", " ")}
          </p>
          <h2 className="mt-2 font-display text-[28px] leading-8">
            {voice.voiceName}
          </h2>
        </div>
        <button
          aria-label={isPlaying ? "Stop" : "Play"}
          className="glass-btn-play grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg"
          onClick={() => {
            if (isPlaying) {
              void stopVoice();
            } else {
              void playVoice();
            }
          }}
          type="button"
        >
          {isPlaying ? "■" : "▶"}
        </button>
      </div>

      <div className="mt-6">
        <DistanceSlider onChange={setCloseness} value={closeness} />
      </div>

      <div className="mt-6">
        <MelodyView melody={voice.melodyRules.melody} />
      </div>
    </section>
  );
}
