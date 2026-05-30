"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { OverviewRangeControls } from "@/components/OverviewRangeControls";
import { PageLoading } from "@/components/PageLoading";
import { SonicPresenceLandscape } from "@/components/SonicPresenceLandscape";
import type { OverviewSpan } from "@/lib/zonedDayRange";
import { TodayEncounterSoundPlayer } from "@/components/TodayEncounterSoundPlayer";
import { encounterDisplayName } from "@/lib/encounterDisplay";
import { mockEncounters } from "@/lib/mockData";
import type { TodayApiResponse } from "@/lib/todayApiTypes";
import type { Encounter } from "@/lib/types";
import { overviewPage, todaySoundTitle } from "@/lib/uiPoetics";

function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; data: TodayApiResponse };

type SoundTarget =
  | { kind: "global"; token: string }
  | { kind: "encounter"; encounter: Encounter; token: string };

const MIN_LOADING_MS = 150;
const USE_TEMP_TODAY_PREVIEW_DATA = true;
const PROXIMITY_RANK: Record<Encounter["proximityZone"], number> = {
  far: 0,
  near: 1,
  close: 2,
  very_close: 3,
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function previewEncountersFor(date: string, data: TodayApiResponse) {
  if (!USE_TEMP_TODAY_PREVIEW_DATA || data.encounters.length > 0) {
    return data.encounters;
  }

  const deviceId = data.device?.id ?? "preview_echo";
  const hours = [8, 10, 13, 15, 17, 19, 20, 21];
  return mockEncounters.map((encounter, index) => {
    const startedAt = new Date(
      `${date}T${String(hours[index] ?? 12).padStart(2, "0")}:00:00`,
    );
    const endedAt = new Date(
      startedAt.getTime() + encounter.durationSec * 1000,
    );

    return {
      ...encounter,
      id: `preview_${date}_${index + 1}`,
      deviceId,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
    };
  });
}

function encounterEchoKey(encounter: Encounter) {
  return (
    encounter.otherEchoModelName?.trim() ||
    encounter.otherEchoHash.trim() ||
    encounter.id
  );
}

function aggregateEncountersForOrbit(encounters: Encounter[]): Encounter[] {
  const groups = new Map<string, Encounter[]>();
  for (const encounter of encounters) {
    const key = encounterEchoKey(encounter);
    groups.set(key, [...(groups.get(key) ?? []), encounter]);
  }

  return [...groups.entries()]
    .map(([key, items]) => {
      const sorted = [...items].sort(
        (a, b) =>
          new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
      );
      const first = sorted[0]!;
      const last = sorted.reduce((latest, item) =>
        new Date(item.endedAt).getTime() > new Date(latest.endedAt).getTime()
          ? item
          : latest,
      );
      const totalDuration = sorted.reduce(
        (sum, item) => sum + Math.max(0, item.durationSec),
        0,
      );
      const weightSum = sorted.reduce(
        (sum, item) => sum + Math.max(1, item.durationSec),
        0,
      );
      const weighted = (pick: (item: Encounter) => number) =>
        sorted.reduce(
          (sum, item) => sum + pick(item) * Math.max(1, item.durationSec),
          0,
        ) / weightSum;
      const strongest = sorted.reduce((best, item) =>
        PROXIMITY_RANK[item.proximityZone] > PROXIMITY_RANK[best.proximityZone]
          ? item
          : best,
      );

      return {
        ...first,
        id: `orbit_${key.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
        startedAt: first.startedAt,
        endedAt: last.endedAt,
        durationSec: totalDuration,
        rssiAvg: weighted((item) => item.rssiAvg),
        rssiMin: Math.min(...sorted.map((item) => item.rssiMin)),
        rssiMax: Math.max(...sorted.map((item) => item.rssiMax)),
        proximityZone: strongest.proximityZone,
        closenessAvg: weighted((item) => item.closenessAvg),
      };
    })
    .sort(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );
}

function TodayDataBody() {
  const searchParams = useSearchParams();
  const backHref = searchParams.get("back") === "/archive" ? "/archive" : "/main";
  const deviceId = searchParams.get("deviceId");
  const date = searchParams.get("date") ?? localIsoDate(new Date());
  const spanParam = searchParams.get("span");
  const span: OverviewSpan =
    spanParam === "weekly" || spanParam === "monthly" ? spanParam : "daily";
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [soundTarget, setSoundTarget] = useState<SoundTarget | null>(null);
  const [stopKey, setStopKey] = useState<string | null>(null);
  const [globalStopKey, setGlobalStopKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const startedAt = performance.now();
    setState({ kind: "loading" });
    try {
      const qs = new URLSearchParams({ date, timeZone, span });
      if (deviceId) qs.set("deviceId", deviceId);
      const res = await fetch(`/api/today?${qs.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        await wait(
          Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)),
        );
        setState({
          kind: "error",
          message: errBody?.error ?? `Request failed (${res.status})`,
        });
        return;
      }
      const data = (await res.json()) as TodayApiResponse;
      await wait(Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)));
      setState({ kind: "ok", data });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error";
      await wait(Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)));
      setState({ kind: "error", message });
    }
  }, [date, deviceId, span, timeZone]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectEncounter = useCallback((encounter: Encounter) => {
    setSoundTarget((current) => {
      if (current?.kind === "encounter" && current.encounter.id === encounter.id) {
        setStopKey(`stop:${encounter.id}:${Date.now()}`);
        return null;
      }
      setStopKey(null);
      setGlobalStopKey(`stop:global-for-${encounter.id}:${Date.now()}`);
      return {
        kind: "encounter",
        encounter,
        token: `encounter:${encounter.id}:${Date.now()}`,
      };
    });
  }, []);

  const selectSelf = useCallback(() => {
    setSoundTarget((current) => {
      if (current?.kind === "global") {
        setStopKey(`stop:global:${Date.now()}`);
        return null;
      }
      setStopKey(null);
      setGlobalStopKey(null);
      return { kind: "global", token: `global:${Date.now()}` };
    });
  }, []);

  const stopOrbitSoundForGlobalPlayback = useCallback(() => {
    setStopKey(`stop:orbit-for-global:${Date.now()}`);
    setSoundTarget(null);
  }, []);

  const previewEncounters = useMemo(
    () => (state.kind === "ok" ? previewEncountersFor(date, state.data) : []),
    [date, state],
  );
  const orbitEncounters = useMemo(
    () => aggregateEncountersForOrbit(previewEncounters),
    [previewEncounters],
  );
  const hasEncounters = previewEncounters.length > 0;
  const title = null;
  const activeEncounters =
    soundTarget?.kind === "encounter"
      ? [soundTarget.encounter]
      : previewEncounters;
  const activeTitle =
    soundTarget?.kind === "encounter"
      ? encounterDisplayName(soundTarget.encounter)
      : todaySoundTitle;

  if (state.kind === "loading") {
    return (
      <AppShell pageTitle={overviewPage.title} viewportLocked>
        <PageLoading className="min-h-0 flex-1" label="Listening for the day" />
      </AppShell>
    );
  }

  const echoColorTheme =
    state.kind === "ok" ? (state.data.device?.echoColor ?? null) : null;

  return (
    <AppShell
      backHref={backHref}
      echoColorTheme={echoColorTheme}
      echoDevice={state.kind === "ok" ? state.data.device : null}
      fullBleed
      hideChrome
      pageTitle={overviewPage.title}
      viewportLocked
    >
      {state.kind === "ok" ? (
        <OverviewRangeControls backHref={backHref} date={date} span={span} />
      ) : null}
      {state.kind === "error" ? (
        <div className="mx-auto max-w-[920px] space-y-4 px-4 py-8">
          <p className="font-body text-sm text-red-900/90">{state.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="glass-btn-secondary rounded-full px-4 py-2 font-body text-sm"
          >
            Try again
          </button>
        </div>
      ) : null}

      {state.kind === "ok" ? (
        <SonicPresenceLandscape
          device={state.data.device}
          encounters={orbitEncounters}
          onSelectEncounter={selectEncounter}
          onSelectSelf={selectSelf}
          playingEncounterId={
            soundTarget?.kind === "encounter"
              ? soundTarget.encounter.id
              : null
          }
          playingSelf={soundTarget?.kind === "global"}
          soundControl={
            hasEncounters ? (
              <>
                <TodayEncounterSoundPlayer
                  date={date}
                  device={state.data.device}
                  encounters={previewEncounters}
                  memory={state.data.dailyMemory}
                  onPlayStart={stopOrbitSoundForGlobalPlayback}
                  showVolume={false}
                  stopKey={globalStopKey}
                  title={todaySoundTitle}
                />
                {soundTarget ? (
                  <TodayEncounterSoundPlayer
                    autoPlayKey={soundTarget.token}
                    controlsVisible={false}
                    date={date}
                    device={state.data.device}
                    encounters={activeEncounters}
                    memory={state.data.dailyMemory}
                    stopKey={stopKey}
                    title={activeTitle}
                  />
                ) : null}
              </>
            ) : undefined
          }
          title={title}
        />
      ) : null}
    </AppShell>
  );
}

function TodayPageFallback() {
  return (
    <AppShell pageTitle={overviewPage.title} viewportLocked>
      <PageLoading className="min-h-0 flex-1" label="Listening for the day" />
    </AppShell>
  );
}

export function TodayPageView() {
  return (
    <Suspense fallback={<TodayPageFallback />}>
      <TodayDataBody />
    </Suspense>
  );
}
