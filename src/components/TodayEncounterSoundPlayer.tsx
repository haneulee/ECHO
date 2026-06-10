"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildEncounterSoundPlan,
  renderEncounterSoundBuffer,
} from "@/lib/dailyEncounterSound";
import type { SessionHarmony } from "@/lib/piDailySound";
import type { DailyMemory, EchoDevice, Encounter } from "@/lib/types";
import { RotaryKnob } from "@/components/RotaryKnob";

type TodayEncounterSoundPlayerProps = {
  date: string;
  device: EchoDevice | null;
  memory?: DailyMemory | null;
  encounters: Encounter[];
  title: string;
  autoPlayKey?: string | null;
  controlsVisible?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  playbackLimitSec?: number;
  showVolume?: boolean;
  stopKey?: string | null;
  /** Overview play-all — trim silence between encounter clips. */
  compactRhythm?: boolean;
  /** Play-all sequence harmony context. */
  sessionHarmony?: SessionHarmony | null;
  /** Warmer overview voice — legato, glue, softer rhythm. */
  cohesiveVoice?: boolean;
};

export function TodayEncounterSoundPlayer({
  date,
  device,
  memory = null,
  encounters,
  title,
  autoPlayKey = null,
  controlsVisible = true,
  onPlayStart,
  onPlayEnd,
  playbackLimitSec,
  showVolume = true,
  stopKey = null,
  compactRhythm = false,
  sessionHarmony = null,
  cohesiveVoice = true,
}: TodayEncounterSoundPlayerProps) {
  const plan = useMemo(
    () =>
      buildEncounterSoundPlan(date, encounters, device, memory, {
        compactRhythm,
        cohesiveVoice,
        sessionHarmony,
      }),
    [compactRhythm, cohesiveVoice, date, device, encounters, memory, sessionHarmony],
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumePercent, setVolumePercent] = useState(64);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const melodyOwner = device?.echoName ?? "the current Echo";

  useEffect(() => {
    return () => {
      stop();
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoPlayKey) return;
    void play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayKey]);

  useEffect(() => {
    if (!stopKey) return;
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopKey]);

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
        onPlayEnd?.();
      }
    };
    sourceRef.current = source;
    gainRef.current = gain;
    source.start();
    if (playbackLimitSec !== undefined) {
      source.stop(context.currentTime + Math.max(0.1, playbackLimitSec));
    }
    setIsPlaying(true);
    onPlayStart?.();
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
      {controlsVisible ? (
        <button
          aria-label={isPlaying ? `Stop ${title}` : `Play ${title}`}
          className="glass-btn-play pointer-events-auto grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg lg:h-16 lg:w-16"
          onClick={toggle}
          type="button"
        >
          {isPlaying ? "■" : "▶"}
        </button>
      ) : null}
      {controlsVisible && showVolume ? (
        <div className="glass-btn-play-muted pointer-events-auto grid h-14 w-14 shrink-0 place-items-center rounded-full lg:h-16 lg:w-16">
          <RotaryKnob
            label={`${title} volume`}
            onChange={updateVolume}
            size={34}
            value={volumePercent / 100}
          />
        </div>
      ) : null}
      <span className="sr-only">
        {plan.notes.length} deterministic notes from {encounters.length} encounters
        over {Math.round(plan.durationSec)} seconds using {melodyOwner}&apos;s
        melody.
      </span>
    </div>
  );
}
