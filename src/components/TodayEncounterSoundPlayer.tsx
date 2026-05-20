"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildEncounterSoundPlan,
  renderEncounterSoundBuffer,
} from "@/lib/dailyEncounterSound";
import type { DailyMemory, EchoDevice, Encounter } from "@/lib/types";
import { RotaryKnob } from "@/components/RotaryKnob";

type TodayEncounterSoundPlayerProps = {
  date: string;
  device: EchoDevice | null;
  memory?: DailyMemory | null;
  encounters: Encounter[];
  title: string;
};

export function TodayEncounterSoundPlayer({
  date,
  device,
  memory = null,
  encounters,
  title,
}: TodayEncounterSoundPlayerProps) {
  const plan = useMemo(
    () => buildEncounterSoundPlan(date, encounters, device, memory),
    [date, device, encounters, memory],
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumePercent, setVolumePercent] = useState(64);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    return () => {
      stop();
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ensureAudioContext() {
    if (audioContextRef.current) return audioContextRef.current;
    const Ctor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) throw new Error("Web Audio is not supported in this browser.");
    const context = new Ctor();
    audioContextRef.current = context;
    return context;
  }

  function stop() {
    sourceRef.current?.stop();
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    gainRef.current?.disconnect();
    gainRef.current = null;
    setIsPlaying(false);
  }

  async function play() {
    stop();
    const context = ensureAudioContext();
    if (context.state === "suspended") await context.resume();

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = renderEncounterSoundBuffer(context, plan);
    gain.gain.value = volumePercent / 100;
    source.connect(gain);
    gain.connect(context.destination);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      if (sourceRef.current === source) {
        sourceRef.current = null;
        gainRef.current = null;
        setIsPlaying(false);
      }
    };
    sourceRef.current = source;
    gainRef.current = gain;
    source.start();
    setIsPlaying(true);
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
    if (gainRef.current) gainRef.current.gain.value = next / 100;
  }

  return (
    <div className="pointer-events-none flex w-full items-center justify-center gap-2">
      <button
        aria-label={isPlaying ? `Stop ${title}` : `Play ${title}`}
        className="pointer-events-auto grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#26231F] text-lg text-white transition hover:scale-[1.03] lg:h-16 lg:w-16"
        onClick={toggle}
        type="button"
      >
        {isPlaying ? "■" : "▶"}
      </button>
      <div className="pointer-events-auto grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#26231F]/[0.06] lg:h-16 lg:w-16">
        <RotaryKnob
          label={`${title} volume`}
          onChange={updateVolume}
          size={34}
          value={volumePercent / 100}
        />
      </div>
      <span className="sr-only">
        {plan.notes.length} deterministic notes from {encounters.length} encounters
        over {Math.round(plan.durationSec)} seconds using the current Echo melody.
      </span>
    </div>
  );
}
