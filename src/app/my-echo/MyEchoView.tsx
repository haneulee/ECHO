"use client";

import { useState } from "react";

import { EchoSettingsDialog } from "@/components/EchoSettingsDialog";
import { SonicPresenceLandscape } from "@/components/SonicPresenceLandscape";
import type { EchoDevice } from "@/lib/types";

type MyEchoViewProps = {
  device: EchoDevice;
};

function formatLastSynced(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unknown";

  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${day} at ${time}`;
}

export function MyEchoView({ device: initialDevice }: MyEchoViewProps) {
  const [device, setDevice] = useState(initialDevice);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="relative h-[100dvh] w-[100vw] overflow-hidden">
        <div className="absolute inset-0 -translate-y-[12vh]">
          <SonicPresenceLandscape
            device={device}
            encounters={[]}
            variant="echoOnly"
          />
        </div>
        <section className="pointer-events-none absolute inset-x-0 bottom-[max(2.75rem,calc(env(safe-area-inset-bottom)+1.75rem))] z-40 flex justify-center px-6 sm:bottom-[max(3rem,calc(env(safe-area-inset-bottom)+2rem))]">
          <div className="glass-panel my-echo-info-panel pointer-events-auto w-full max-w-[min(92vw,34rem)] rounded-[2rem] px-5 py-4 text-center sm:px-6 sm:py-5">
            <div className="flex items-center justify-center gap-2">
              <h1 className="whitespace-nowrap font-display text-[clamp(1.8rem,7vw,3rem)] leading-none tracking-[-0.045em] text-text">
                {device.echoName}
              </h1>
              <button
                aria-label={`Edit ${device.echoName}`}
                className="glass-interactive grid h-9 w-9 place-items-center rounded-full text-text-muted hover:text-text"
                onClick={() => setSettingsOpen(true)}
                type="button"
              >
                <svg
                  aria-hidden
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4 20h4.4L19.1 9.3a2.1 2.1 0 0 0 0-3L17.7 4.9a2.1 2.1 0 0 0-3 0L4 15.6V20Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                  />
                  <path
                    d="m13.6 6 4.4 4.4"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.6"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-4 grid gap-3 font-body text-[clamp(0.72rem,2.8vw,0.875rem)] sm:grid-cols-3">
              <div>
                <p className="whitespace-nowrap text-xs text-text-muted">Temperament</p>
                <p className="mt-1 whitespace-nowrap capitalize text-text">
                  {device.echoType}
                </p>
              </div>
              <div>
                <p className="whitespace-nowrap text-xs text-text-muted">
                  Sonic thread
                </p>
                <p className="mt-1 whitespace-nowrap text-text">
                  {device.currentState.melody.slice(0, 4).join(" · ")}
                </p>
              </div>
              <div>
                <p className="whitespace-nowrap text-xs text-text-muted">Last near</p>
                <p className="mt-1 whitespace-nowrap text-text">
                  {formatLastSynced(device.lastSyncedAt)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <EchoSettingsDialog
        device={device}
        onClose={() => setSettingsOpen(false)}
        onSaved={setDevice}
        open={settingsOpen}
      />
    </>
  );
}
