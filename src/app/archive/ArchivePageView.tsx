"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArchiveCarousel,
  type ArchiveCarouselItem,
} from "@/components/ArchiveCarousel";
import { AppShell } from "@/components/AppShell";
import type { ArchiveApiResponse } from "@/lib/archiveApiTypes";
import { archiveHero } from "@/lib/uiPoetics";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; items: ArchiveCarouselItem[] };

function ArchiveBody() {
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const qs = new URLSearchParams({ timeZone });
      const res = await fetch(`/api/archive?${qs.toString()}`, {
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
      const data = (await res.json()) as ArchiveApiResponse;
      setState({ kind: "ok", items: data.items });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error";
      setState({ kind: "error", message });
    }
  }, [timeZone]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell
      eyebrow={archiveHero.eyebrow}
      title={archiveHero.title}
      viewportLocked
    >
      {state.kind === "loading" ? (
        <p className="px-1 font-body text-sm text-text/70">Loading archive…</p>
      ) : null}
      {state.kind === "error" ? (
        <div className="space-y-4 px-1">
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
      {state.kind === "ok" && state.items.length === 0 ? (
        <p className="max-w-md px-1 font-body text-sm leading-6 text-text/80">
          No saved daily memories yet. When Echo writes a day to the database,
          it lands here in order.
        </p>
      ) : null}
      {state.kind === "ok" && state.items.length > 0 ? (
        <ArchiveCarousel items={state.items} />
      ) : null}
    </AppShell>
  );
}

export function ArchivePageView() {
  return <ArchiveBody />;
}
