"use client";

import { useState } from "react";

import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { NavigateWithLoader } from "@/components/NavigateWithLoader";
import {
  memoriesPath,
  overviewPath,
  readPersistedTimespan,
} from "@/lib/timespanNavigation";
import type { DailyMemory, EchoDevice, Encounter } from "@/lib/types";
import { encounterDayHeadline, mainHome } from "@/lib/uiPoetics";

type MainHomeViewProps = {
  echoDevice: EchoDevice;
  hasTodayEncounters: boolean;
  visualComposition: DailyMemory["composition"];
  visualEncounters: Encounter[];
  visualSettings: DailyMemory["visualization"];
};

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function MainHomeView({
  echoDevice,
  hasTodayEncounters,
  visualComposition,
  visualEncounters,
  visualSettings,
}: MainHomeViewProps) {
  const [timespan] = useState(readPersistedTimespan);
  const [today] = useState(todayLabel);

  const overviewHref = overviewPath({ span: timespan, back: "/main" });
  const memoriesHref = memoriesPath(timespan);
  const todayEncounterCount = hasTodayEncounters ? visualEncounters.length : 0;

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
          <div className="grid place-items-center rounded-full">
            <AbstractMemoryVisual
              composition={visualComposition}
              encounters={visualEncounters}
              gradientOnly
              size={320}
              visualId={`main-home-${echoDevice.id}`}
              {...visualSettings}
            />
          </div>
        </div>
        <div className="shrink-0 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pb-[max(3rem,env(safe-area-inset-bottom))] flex flex-col items-center justify-center">
          <p className="whitespace-nowrap font-display text-[clamp(0.8rem,5vw,2rem)] leading-none tracking-[-0.045em]">
            {today}
          </p>
          {!hasTodayEncounters ? (
            <p className="mt-3 max-w-[calc(100vw-2rem)] whitespace-nowrap font-body text-[clamp(0.72rem,3.2vw,0.875rem)] leading-6 text-text-muted">
              {encounterDayHeadline(todayEncounterCount, echoDevice.echoName)}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <NavigateWithLoader
              className="glass-btn-primary whitespace-nowrap rounded-full px-6 py-3 font-body text-sm"
              href={overviewHref}
              loaderLabel="Opening encounters"
            >
              {mainHome.encountersOverviewCta}
            </NavigateWithLoader>
            <NavigateWithLoader
              className="glass-btn-secondary whitespace-nowrap rounded-full px-6 py-3 font-body text-sm"
              href={memoriesHref}
              loaderLabel="Opening memories"
            >
              {mainHome.memoriesCta}
            </NavigateWithLoader>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
