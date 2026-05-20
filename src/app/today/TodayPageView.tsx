"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { PageLoading } from "@/components/PageLoading";
import { TodayEncounterSoundPlayer } from "@/components/TodayEncounterSoundPlayer";
import type { TodayApiResponse } from "@/lib/todayApiTypes";
import type { DailyMemory, EchoDevice, EchoType, Encounter } from "@/lib/types";
import { todayHero, todaySoundTitle } from "@/lib/uiPoetics";
import { formatCalendarEyebrow } from "@/lib/zonedDayRange";

const echoTypeTitleColor: Record<EchoType, string> = {
  shy: "#658BC1",
  messy: "#B56F5C",
  bounce: "#D5A940",
};

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

const MIN_LOADING_MS = 650;
const ECHO_TYPES: EchoType[] = ["shy", "messy", "bounce"];

type TodayVisualMemory = Pick<DailyMemory, "composition" | "visualization">;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash % 10000) + 1;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildTodayVisualMemory(
  date: string,
  encounters: Encounter[],
  device: EchoDevice | null,
  dailyMemory: DailyMemory | null,
): TodayVisualMemory | null {
  if (dailyMemory) return dailyMemory;
  if (encounters.length === 0) return null;

  const totalDurationSec = encounters.reduce(
    (sum, encounter) => sum + encounter.durationSec,
    0,
  );
  const averageCloseness = average(
    encounters.map((encounter) => encounter.closenessAvg),
  );
  const fallbackMelody = device?.currentState.melody ?? ["C4", "E4", "G4"];
  const voices = ECHO_TYPES.map((echoType) => {
    const typedEncounters = encounters.filter(
      (encounter) => encounter.otherEchoType === echoType,
    );
    if (typedEncounters.length === 0) return null;

    return {
      echoType,
      presence: typedEncounters.length / encounters.length,
      melody: fallbackMelody,
      averageCloseness: average(
        typedEncounters.map((encounter) => encounter.closenessAvg),
      ),
    };
  }).filter((voice): voice is NonNullable<typeof voice> => voice !== null);

  return {
    composition: {
      style: "Live daily resonance",
      tempoBpm: 52,
      scale: "A minor pentatonic",
      voices,
    },
    visualization: {
      seed: hashSeed(
        `${date}:${encounters.map((encounter) => encounter.id).join("|")}`,
      ),
      density: clamp01(encounters.length / 12),
      brightness: clamp01(0.38 + averageCloseness * 0.58),
      movement: clamp01(totalDurationSec / 3600),
    },
  };
}

function TodayDataBody() {
  const searchParams = useSearchParams();
  const deviceId = searchParams.get("deviceId");
  const date = searchParams.get("date") ?? localIsoDate(new Date());
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    const startedAt = performance.now();
    setState({ kind: "loading" });
    try {
      const qs = new URLSearchParams({ date, timeZone });
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
  }, [date, deviceId, timeZone]);

  useEffect(() => {
    void load();
  }, [load]);

  const eyebrow = useMemo(
    () => formatCalendarEyebrow(date, timeZone),
    [date, timeZone],
  );

  const emptyDay =
    state.kind === "ok" &&
    state.data.encounters.length === 0 &&
    state.data.dailyMemory === null;

  const hasEncounters = state.kind === "ok" && state.data.encounters.length > 0;

  const todayVisualMemory =
    state.kind === "ok"
      ? buildTodayVisualMemory(
          date,
          state.data.encounters,
          state.data.device,
          state.data.dailyMemory,
        )
      : null;
  const showVisualSection =
    state.kind === "ok" && hasEncounters && todayVisualMemory;
  const echoDevice = state.kind === "ok" ? state.data.device : null;
  const echoName = echoDevice?.echoName ?? "your Echo";
  const echoNameColor = echoDevice
    ? echoTypeTitleColor[echoDevice.echoType]
    : undefined;
  const title = (
    <>
      How{" "}
      <span style={echoNameColor ? { color: echoNameColor } : undefined}>
        {echoName}
      </span>{" "}
      sensed others today
    </>
  );

  if (state.kind === "loading") {
    return (
      <AppShell viewportLocked>
        <PageLoading className="min-h-0 flex-1" label="Loading today's field" />
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow={eyebrow}
      intro={todayHero.intro}
      title={title}
      viewportLocked
    >
      {state.kind === "error" ? (
        <div className="mx-auto max-w-[920px] space-y-4 px-4 py-8">
          <p className="font-body text-sm text-red-900/90">{state.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-[#1a3a48]/30 bg-white px-4 py-2 font-body text-sm text-text transition hover:border-[#1a3a48]/50"
          >
            Try again
          </button>
        </div>
      ) : null}

      {state.kind === "ok" ? (
        <>
          {emptyDay ? (
            <section className="mx-auto flex min-h-0 w-full max-w-[920px] flex-1 items-center justify-center px-4 pb-16 pt-8 sm:pb-12">
              <div className="flex max-w-sm flex-col items-center text-center">
                <Image
                  alt=""
                  aria-hidden
                  className="mb-6 h-20 w-20 opacity-75"
                  height={80}
                  src="/brand/ECHO_logo_4.svg"
                  width={80}
                />
                <p className="font-body text-sm leading-6 text-text/75">
                  No encounters. <br />
                  Feel co-presence through your Echo's sound.
                </p>
              </div>
            </section>
          ) : null}

          {showVisualSection ? (
            <section className="relative isolate flex min-h-0 w-full flex-1 flex-col overflow-hidden pb-1">
              <div className="relative z-0 mx-auto flex min-h-0 w-full max-w-[920px] flex-1 items-center justify-center overflow-visible px-1">
                <div className="max-h-full max-w-[min(112%,520px)] overflow-visible [&>svg]:max-h-full [&>svg]:w-auto">
                  <AbstractMemoryVisual
                    bleed
                    composition={todayVisualMemory.composition}
                    encounters={state.data.encounters}
                    gradientOnly
                    key={state.data.dailyMemory?.id ?? `today-${date}`}
                    size={500}
                    visualId={state.data.dailyMemory?.id ?? `today-${date}`}
                    {...todayVisualMemory.visualization}
                  />
                </div>
              </div>

              {hasEncounters ? (
                <div className="relative z-30 mx-auto -mt-2 flex w-full max-w-[920px] shrink-0 justify-center px-4 pb-1 pt-0">
                  <div className="rounded-full px-4 py-2.5">
                    <TodayEncounterSoundPlayer
                      date={date}
                      device={state.data.device}
                      encounters={state.data.encounters}
                      memory={state.data.dailyMemory}
                      title={todaySoundTitle}
                    />
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}

function TodayPageFallback() {
  return (
    <AppShell viewportLocked>
      <PageLoading className="min-h-0 flex-1" label="Loading today's field" />
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
