"use client";

import { useEffect, useState } from "react";

import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { EchoSettingsDialog } from "@/components/EchoSettingsDialog";
import { NavigateWithLoader } from "@/components/NavigateWithLoader";
import {
  memoriesPath,
  overviewPath,
  readPersistedTimespan,
} from "@/lib/timespanNavigation";
import type { DailyMemory, EchoDevice, Encounter } from "@/lib/types";
import { mainHome } from "@/lib/uiPoetics";

type MainHomeViewProps = {
  echoDevice: EchoDevice;
  hasTodayEncounters: boolean;
  visualComposition: DailyMemory["composition"];
  visualEncounters: Encounter[];
  visualSettings: DailyMemory["visualization"];
};

export function MainHomeView({
  echoDevice: initialDevice,
  hasTodayEncounters,
  visualComposition,
  visualEncounters,
  visualSettings,
}: MainHomeViewProps) {
  const [echoDevice, setEchoDevice] = useState(initialDevice);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timespan] = useState(readPersistedTimespan);

  useEffect(() => {
    setEchoDevice(initialDevice);
  }, [initialDevice]);

  const overviewHref = overviewPath({ span: timespan, back: "/main" });
  const memoriesHref = memoriesPath(timespan);

  return (
    <AppShell
      echoColorTheme={echoDevice.echoColor}
      echoDevice={echoDevice}
      hideChrome
      pageTitle={mainHome.title}
      viewportLocked
    >
      <section className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col pt-2 text-center">
        <div className="grid min-h-0 flex-1 place-items-center py-4 sm:py-6">
          <button
            className="group grid place-items-center rounded-full transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text/25"
            onClick={() => setSettingsOpen(true)}
            type="button"
            aria-label={`Open settings for ${echoDevice.echoName}`}
          >
            <AbstractMemoryVisual
              composition={visualComposition}
              encounters={visualEncounters}
              gradientOnly
              size={320}
              visualId={`main-home-${echoDevice.id}`}
              {...visualSettings}
            />
          </button>
        </div>
        <div className="shrink-0 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pb-[max(3rem,env(safe-area-inset-bottom))] flex flex-col items-center justify-center">
          <button
            className="font-display text-[clamp(0.8rem,5vw,2rem)] leading-none tracking-[-0.045em] transition hover:text-text-muted"
            onClick={() => setSettingsOpen(true)}
            type="button"
          >
            {echoDevice.echoName}
          </button>
          {!hasTodayEncounters ? (
            <p className="mt-3 max-w-sm font-body text-sm leading-6 text-text-muted">
              No one has crossed its field yet, so today holds only your
              Echo&apos;s own color.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <NavigateWithLoader
              className="glass-btn-primary rounded-full px-6 py-3 font-body text-sm"
              href={overviewHref}
              loaderLabel="Opening encounters"
            >
              {mainHome.encountersOverviewCta}
            </NavigateWithLoader>
            <NavigateWithLoader
              className="glass-btn-secondary rounded-full px-6 py-3 font-body text-sm"
              href={memoriesHref}
              loaderLabel="Opening memories"
            >
              {mainHome.memoriesCta}
            </NavigateWithLoader>
          </div>
        </div>
      </section>
      <EchoSettingsDialog
        device={echoDevice}
        onClose={() => setSettingsOpen(false)}
        onSaved={setEchoDevice}
        open={settingsOpen}
      />
    </AppShell>
  );
}
