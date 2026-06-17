"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { useRouteLoading } from "@/components/NavigationLoadingProvider";
import { MemoriesTimespanSelect } from "@/components/MemoriesTimespanSelect";
import { OverviewRangeControls } from "@/components/OverviewRangeControls";
import { PageLoading } from "@/components/PageLoading";
import type { OverviewSpan } from "@/lib/zonedDayRange";
import {
  isMemoriesBackPath,
  memoriesPath,
  persistTimespan,
  resolveTimespan,
} from "@/lib/timespanNavigation";
import { ProfileFirmwareSoundPlayer } from "@/components/ProfileFirmwareSoundPlayer";
import { TodayEncounterSoundPlayer } from "@/components/TodayEncounterSoundPlayer";
import { encounterDisplayName } from "@/lib/encounterDisplay";
import { echoTypeLabels } from "@/lib/echoTypeMeta";
import {
  aggregateEncountersByPeer,
  peerEchoKey,
} from "@/lib/aggregateEncountersByPeer";
import { deriveSessionHarmony } from "@/lib/piDailySound";
import type { TodayApiResponse } from "@/lib/todayApiTypes";
import type { EchoType, Encounter } from "@/lib/types";
import { overviewPage, todaySoundTitle } from "@/lib/uiPoetics";
import { useAppRouter } from "@/hooks/useAppRouter";

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

type PlayAllState = {
  running: boolean;
  index: number;
  token: string;
};

type EchoTypeFilter = "all" | EchoType;

const ECHO_TYPE_FILTERS: EchoType[] = ["shy", "messy", "bounce"];

const SonicPresenceLandscape = dynamic(
  () =>
    import("@/components/SonicPresenceLandscape").then((mod) => ({
      default: mod.SonicPresenceLandscape,
    })),
  {
    ssr: false,
    loading: () => <div aria-hidden className="min-h-0 flex-1" />,
  },
);

function TodayDataBody() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const backParam = searchParams.get("back");
  const span = resolveTimespan(searchParams.get("span"));
  const deviceId = searchParams.get("deviceId");
  const date = searchParams.get("date") ?? localIsoDate(new Date());
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const setSpan = useCallback(
    (next: OverviewSpan) => {
      persistTimespan(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "daily") params.delete("span");
      else params.set("span", next);
      params.set(
        "back",
        isMemoriesBackPath(backParam) ? memoriesPath(next) : "/main",
      );
      router.push(`/overview?${params.toString()}`);
    },
    [backParam, router, searchParams],
  );

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [soundTarget, setSoundTarget] = useState<SoundTarget | null>(null);
  const [playAll, setPlayAll] = useState<PlayAllState>({
    running: false,
    index: 0,
    token: "idle",
  });
  const [echoTypeFilter, setEchoTypeFilter] = useState<EchoTypeFilter>("all");
  const [stopKey, setStopKey] = useState<string | null>(null);

  const load = useCallback(async () => {
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
        setState({
          kind: "error",
          message: errBody?.error ?? `Request failed (${res.status})`,
        });
        return;
      }
      const data = (await res.json()) as TodayApiResponse;
      setState({ kind: "ok", data });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error";
      setState({ kind: "error", message });
    }
  }, [date, deviceId, span, timeZone]);

  useEffect(() => {
    void load();
  }, [load]);

  useRouteLoading(state.kind === "loading");

  const selectEncounter = useCallback((encounter: Encounter) => {
    setPlayAll({ running: false, index: 0, token: `manual:${Date.now()}` });
    setSoundTarget((current) => {
      if (current?.kind === "encounter" && current.encounter.id === encounter.id) {
        setStopKey(`stop:${encounter.id}:${Date.now()}`);
        return null;
      }
      setStopKey(null);
      return {
        kind: "encounter",
        encounter,
        token: `encounter:${encounter.id}:${Date.now()}`,
      };
    });
  }, []);

  const selectSelf = useCallback(() => {
    setPlayAll({ running: false, index: 0, token: `self:${Date.now()}` });
    setSoundTarget((current) => {
      if (current?.kind === "global") {
        setStopKey(`stop:global:${Date.now()}`);
        return null;
      }
      setStopKey(null);
      return { kind: "global", token: `global:${Date.now()}` };
    });
  }, []);

  const dayEncounters = useMemo(
    () => (state.kind === "ok" ? state.data.encounters : []),
    [state],
  );
  const echoTypeCounts = useMemo(() => {
    const counts: Record<EchoType, number> = { shy: 0, messy: 0, bounce: 0 };
    for (const encounter of dayEncounters) counts[encounter.otherEchoType] += 1;
    return counts;
  }, [dayEncounters]);
  const filteredEncounters = useMemo(
    () =>
      echoTypeFilter === "all"
        ? dayEncounters
        : dayEncounters.filter(
            (encounter) => encounter.otherEchoType === echoTypeFilter,
          ),
    [dayEncounters, echoTypeFilter],
  );
  const orbitEncounters = useMemo(
    () => aggregateEncountersByPeer(filteredEncounters),
    [filteredEncounters],
  );
  const playingOrbitEncounterId = useMemo(() => {
    if (soundTarget?.kind !== "encounter") return null;
    const playingKey = peerEchoKey(soundTarget.encounter);
    const orbitMatch = orbitEncounters.find(
      (encounter) => peerEchoKey(encounter) === playingKey,
    );
    return orbitMatch?.id ?? null;
  }, [orbitEncounters, soundTarget]);
  const hasEncounters = filteredEncounters.length > 0;
  const playAllEncounters = useMemo(
    () =>
      [...filteredEncounters].sort(
        (a, b) =>
          new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
      ),
    [filteredEncounters],
  );
  const playAllSessionHarmony = useMemo(() => {
    if (!playAll.running) return null;
    return deriveSessionHarmony(date, playAllEncounters, playAll.index);
  }, [date, playAll.index, playAll.running, playAllEncounters]);
  const title = null;
  const activeEncounters =
    soundTarget?.kind === "encounter" ? [soundTarget.encounter] : [];
  const activeTitle =
    soundTarget?.kind === "encounter"
      ? encounterDisplayName(soundTarget.encounter)
      : state.kind === "ok"
        ? state.data.device?.echoName ?? todaySoundTitle
        : todaySoundTitle;

  const togglePlayAll = useCallback(() => {
    if (playAll.running) {
      setPlayAll({ running: false, index: 0, token: `stop:${Date.now()}` });
      setStopKey(`stop:play-all:${Date.now()}`);
      setSoundTarget(null);
      return;
    }

    if (playAllEncounters.length === 0) return;
    setStopKey(null);
    setPlayAll({ running: true, index: 0, token: `play-all:${Date.now()}` });
  }, [playAll.running, playAllEncounters.length]);

  const selectEchoTypeFilter = useCallback((nextFilter: EchoTypeFilter) => {
    setEchoTypeFilter(nextFilter);
    setPlayAll({ running: false, index: 0, token: `filter:${Date.now()}` });
    setStopKey(`stop:filter:${Date.now()}`);
    setSoundTarget(null);
  }, []);

  const advancePlayAll = useCallback(() => {
    setPlayAll((current) => {
      if (!current.running) return current;
      const nextIndex = current.index + 1;
      if (nextIndex >= playAllEncounters.length) {
        setSoundTarget(null);
        return { running: false, index: 0, token: `done:${Date.now()}` };
      }
      return { ...current, index: nextIndex };
    });
  }, [playAllEncounters.length]);

  useEffect(() => {
    if (!playAll.running) return;
    const encounter = playAllEncounters[playAll.index];
    if (!encounter) {
      setPlayAll({ running: false, index: 0, token: `done:${Date.now()}` });
      setSoundTarget(null);
      return;
    }

    setSoundTarget({
      kind: "encounter",
      encounter,
      token: `${playAll.token}:${playAll.index}:${encounter.id}`,
    });
  }, [playAll.index, playAll.running, playAll.token, playAllEncounters]);

  if (state.kind === "loading") {
    return (
      <AppShell pageTitle={overviewPage.title} viewportLocked>
        <div aria-hidden className="min-h-0 flex-1" />
      </AppShell>
    );
  }

  const echoColorTheme =
    state.kind === "ok" ? (state.data.device?.echoColor ?? null) : null;

  return (
    <AppShell
      echoColorTheme={echoColorTheme}
      echoDevice={state.kind === "ok" ? state.data.device : null}
      fullBleed
      headerActions={
        <div className="overview-header-actions flex items-center gap-2">
          <MemoriesTimespanSelect
            onChange={setSpan}
            value={span}
            variant="header"
          />
          <button
            aria-label={
              playAll.running ? "Stop all encounters" : "Play all encounters"
            }
            className="overview-play-all-button disabled:opacity-40"
            disabled={!hasEncounters}
            onClick={togglePlayAll}
            type="button"
          >
            {playAll.running ? "Stop" : "Play all"}
          </button>
        </div>
      }
      hideChrome
      pageTitle={overviewPage.title}
      viewportLocked
    >
      {state.kind === "ok" ? (
        <div
          aria-label="Filter echoes by type"
          className="overview-type-filter"
          role="group"
        >
          <button
            aria-pressed={echoTypeFilter === "all"}
            className="overview-type-filter__button"
            onClick={() => selectEchoTypeFilter("all")}
            type="button"
          >
            All
          </button>
          {ECHO_TYPE_FILTERS.map((type) => (
            <button
              aria-pressed={echoTypeFilter === type}
              className="overview-type-filter__button"
              disabled={echoTypeCounts[type] === 0}
              key={type}
              onClick={() => selectEchoTypeFilter(type)}
              type="button"
            >
              {echoTypeLabels[type]}
            </button>
          ))}
        </div>
      ) : null}
      {state.kind === "ok" ? (
        <OverviewRangeControls
          date={date}
          hasNextPeriod={state.data.hasNextPeriod}
          hasPrevPeriod={state.data.hasPrevPeriod}
          nextPeriodDate={state.data.nextPeriodDate}
          prevPeriodDate={state.data.prevPeriodDate}
          span={span}
          timeZone={timeZone}
        />
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
          presencePlaybackMode="overview"
          playingEncounterId={playingOrbitEncounterId}
          playingSelf={soundTarget?.kind === "global"}
          soundControl={
            soundTarget && state.data.device ? (
              soundTarget.kind === "global" ? (
                <ProfileFirmwareSoundPlayer
                  autoPlayKey={soundTarget.token}
                  controlsVisible={false}
                  device={state.data.device}
                  stopKey={stopKey}
                  title={activeTitle}
                />
              ) : (
                <TodayEncounterSoundPlayer
                  autoPlayKey={soundTarget.token}
                  compactRhythm={playAll.running}
                  cohesiveVoice
                  controlsVisible={false}
                  date={date}
                  device={state.data.device}
                  encounters={activeEncounters}
                  onPlayEnd={playAll.running ? advancePlayAll : undefined}
                  sessionHarmony={playAllSessionHarmony}
                  stopKey={stopKey}
                  title={activeTitle}
                />
              )
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
