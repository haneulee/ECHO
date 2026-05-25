"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  registerEchoNativeAnalyser,
  registerEchoNoteSchedule,
} from "@/lib/echoAudioAnalyser";
import {
  buildFirmwareEchoNoteEvents,
  getFirmwareEchoLoopSeconds,
  renderFirmwareEchoBuffer,
} from "@/lib/firmwareEchoSound";
import type { EchoDevice } from "@/lib/types";
import { RotaryKnob } from "@/components/RotaryKnob";

type ProfileFirmwareSoundPlayerProps = {
  device: EchoDevice;
  title: string;
};

export function ProfileFirmwareSoundPlayer({
  device,
  title,
}: ProfileFirmwareSoundPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumePercent, setVolumePercent] = useState(62);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const deviceKey = useMemo(
    () =>
      [
        device.id,
        device.echoType,
        device.currentState.melody.join(","),
        device.currentState.brightness,
        device.currentState.calmness,
        device.currentState.densityBias,
      ].join("|"),
    [device],
  );

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
  }, [deviceKey]);

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
    analyserRef.current?.disconnect();
    registerEchoNativeAnalyser(null);
    registerEchoNoteSchedule(null, null, 0, 1);
    analyserRef.current = null;
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
    const analyser = context.createAnalyser();
    source.buffer = renderFirmwareEchoBuffer(context, device);
    source.loop = true;
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.91;
    gain.gain.value = volumePercent / 100;
    source.connect(gain);
    gain.connect(analyser);
    analyser.connect(context.destination);
    sourceRef.current = source;
    gainRef.current = gain;
    analyserRef.current = analyser;
    registerEchoNativeAnalyser(analyser);
    const startedAt = context.currentTime;
    registerEchoNoteSchedule(
      buildFirmwareEchoNoteEvents(device),
      context,
      startedAt,
      getFirmwareEchoLoopSeconds(),
    );
    source.start(startedAt);
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
        className="pointer-events-auto grid h-14 w-14 shrink-0 place-items-center rounded-full bg-nav-active text-lg text-white transition hover:scale-[1.03] lg:h-16 lg:w-16"
        onClick={toggle}
        type="button"
      >
        {isPlaying ? "■" : "▶"}
      </button>
      <div className="pointer-events-auto grid h-14 w-14 shrink-0 place-items-center rounded-full bg-nav-active/10 lg:h-16 lg:w-16">
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
