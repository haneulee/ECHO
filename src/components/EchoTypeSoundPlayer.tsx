"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildTypePreviewPlan,
  renderPiDailySoundBuffer,
} from "@/lib/piDailySound";
import type { EchoType } from "@/lib/types";
import { RotaryKnob } from "@/components/RotaryKnob";

type EchoTypeSoundPlayerProps = {
  echoType: EchoType;
  title: string;
  variant?: "controlRow" | "inline";
};

export function EchoTypeSoundPlayer({
  echoType,
  title,
  variant = "controlRow",
}: EchoTypeSoundPlayerProps) {
  const plan = useMemo(() => buildTypePreviewPlan(echoType), [echoType]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumePercent, setVolumePercent] = useState(62);
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

  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echoType]);

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
    source.buffer = renderPiDailySoundBuffer(context, plan);
    source.loop = true;
    gain.gain.value = volumePercent / 100;
    source.connect(gain);
    gain.connect(context.destination);
    sourceRef.current = source;
    gainRef.current = gain;
    source.start();
    setIsPlaying(true);
  }

  function toggle() {
    if (isPlaying) stop();
    else void play();
  }

  function updateVolume(normalizedKnob: number) {
    const next = Math.round(Math.min(1, Math.max(0, normalizedKnob)) * 100);
    setVolumePercent(next);
    if (gainRef.current) gainRef.current.gain.value = next / 100;
  }

  if (variant === "controlRow") {
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
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        aria-label={isPlaying ? `Stop ${title}` : `Play ${title}`}
        className="grid h-14 w-14 place-items-center rounded-full bg-white/42 text-lg"
        onClick={toggle}
        type="button"
      >
        {isPlaying ? "■" : "▶"}
      </button>
    </div>
  );
}
