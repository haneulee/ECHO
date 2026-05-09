"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { registerEchoToneAnalyser } from "@/lib/echoAudioAnalyser";
import { RotaryKnob } from "./RotaryKnob";

/** Maps UI volume 0–100 linearly to Tone `Volume` decibels (0 ≈ silent, 100 = loudest). */
function volumePercentToDb(percent: number): number {
  const p = Math.min(100, Math.max(0, percent));
  if (p <= 0) return -80;
  const minDb = -48;
  const maxDb = -6;
  return minDb + (p / 100) * (maxDb - minDb);
}

type SoundMemoryPlayerProps = {
  title: string;
  subtitle?: string;
  melody: string[];
  tempoBpm?: number;
  compact?: boolean;
  variant?: "inline" | "visualOverlay" | "controlRow";
};

export function SoundMemoryPlayer({
  title,
  subtitle,
  melody,
  tempoBpm = 52,
  compact = false,
  variant = "inline",
}: SoundMemoryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  /** Output level 0–100 (matches knob `aria-valuenow`). */
  const [volumePercent, setVolumePercent] = useState(62);
  const synthRef = useRef<unknown>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);

  useEffect(() => {
    return () => {
      stop();
      analyserRef.current?.dispose();
      analyserRef.current = null;
      registerEchoToneAnalyser(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureSynth() {
    if (synthRef.current) return synthRef.current;

    const analyser = new Tone.Analyser("fft", 256);
    analyser.smoothing = 0.72;
    analyserRef.current = analyser;
    registerEchoToneAnalyser(analyser);

    const reverb = new Tone.Reverb({
      decay: 8,
      preDelay: 0.06,
      wet: 0.64,
    });
    await reverb.ready;

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: {
        attack: 0.7,
        decay: 0.2,
        sustain: 0.5,
        release: 3.8,
      },
      volume: volumePercentToDb(volumePercent),
    });

    synth.connect(reverb);
    reverb.connect(analyser);
    analyser.toDestination();

    synthRef.current = synth;
    return synth;
  }

  async function play() {
    await Tone.start();
    const synth = await ensureSynth();
    (
      synth as {
        volume?: { value: number };
      }
    ).volume!.value = volumePercentToDb(volumePercent);
    const stepMs = Math.round((60000 / tempoBpm) * 1.75);

    if (intervalRef.current) clearInterval(intervalRef.current);

    const trigger = () => {
      const note = melody[stepRef.current % melody.length];
      (
        synth as {
          triggerAttackRelease: (
            note: string,
            duration: string,
            time?: number,
            velocity?: number,
          ) => void;
        }
      ).triggerAttackRelease(note, "1n", undefined, 0.42);
      stepRef.current += 1;
    };

    trigger();
    intervalRef.current = setInterval(trigger, stepMs);
    setIsPlaying(true);
  }

  function stop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    (
      synthRef.current as
        | {
            releaseAll?: () => void;
          }
        | null
    )?.releaseAll?.();
    setIsPlaying(false);
  }

  function toggle() {
    if (isPlaying) {
      stop();
    } else {
      void play();
    }
  }

  function updateVolume(normalizedKnob: number) {
    const next = Math.round(Math.min(1, Math.max(0, normalizedKnob)) * 100);
    setVolumePercent(next);
    const synth = synthRef.current as
      | {
          volume?: { value: number };
        }
      | null;
    if (synth?.volume) synth.volume.value = volumePercentToDb(next);
  }

  if (variant === "visualOverlay") {
    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        <button
          aria-label={isPlaying ? `Stop ${title}` : `Play ${title}`}
          className="pointer-events-auto absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/46 text-2xl text-[#26231F] shadow-[0_18px_60px_rgba(38,35,31,0.16)] backdrop-blur-md transition hover:scale-[1.03] hover:bg-white/62"
          onClick={toggle}
          type="button"
        >
          {isPlaying ? "■" : "▶"}
        </button>

        <div className="pointer-events-auto absolute -bottom-8 right-0 grid h-16 w-16 place-items-center rounded-full bg-white/58 shadow-[0_14px_44px_rgba(38,35,31,0.1)] backdrop-blur-md sm:-right-8">
          <RotaryKnob
            label={`${title} volume`}
            onChange={updateVolume}
            size={36}
            value={volumePercent / 100}
          />
        </div>
      </div>
    );
  }

  if (variant === "controlRow") {
    return (
      <div className="flex w-full items-center justify-center gap-2">
        <button
          aria-label={isPlaying ? `Stop ${title}` : `Play ${title}`}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#26231F] text-lg text-white transition hover:scale-[1.03] lg:h-16 lg:w-16"
          onClick={toggle}
          type="button"
        >
          {isPlaying ? "■" : "▶"}
        </button>
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#26231F]/[0.06] lg:h-16 lg:w-16">
          <RotaryKnob
            label={`${title} volume`}
            onChange={updateVolume}
            size={34}
            value={volumePercent / 100}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "w-full text-[#26231F]",
        compact ? "max-w-sm" : "max-w-xl",
      ].join(" ")}
    >
      <div className="mb-3 flex items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="truncate font-display text-[30px] leading-8 tracking-[-0.04em]">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-1 truncate font-body text-sm leading-5 text-text-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 font-body text-xs text-text-muted">
          {melody.length} notes
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-start gap-3">
        <button
          aria-label={isPlaying ? "Stop sound memory" : "Play sound memory"}
          className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-white/42 text-2xl text-[#26231F] shadow-[0_12px_40px_rgba(38,35,31,0.08)] transition hover:bg-white/62"
          onClick={toggle}
          type="button"
        >
          {isPlaying ? "■" : "▶"}
        </button>
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-white/32 p-3 shadow-[0_12px_40px_rgba(38,35,31,0.06)]">
          <RotaryKnob
            label="Volume"
            onChange={updateVolume}
            size={56}
            value={volumePercent / 100}
          />
        </div>
      </div>
    </div>
  );
}
