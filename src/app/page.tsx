import Link from "next/link";
import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (isLocalMockMode()) {
    logDatabaseUnavailable("/ home local mock mode");
    redirect("/main");
  }
  const r = await resolveSessionUser();
  if (r.kind === "ok") {
    redirect("/main");
  }
  if (r.kind === "db_unavailable") {
    logDatabaseUnavailable("/ home");
    redirect("/main");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2F");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16 text-text">
      <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
        Echo companion
      </p>
      <h1 className="mt-4 max-w-xl font-display text-[44px] leading-[46px] tracking-[-0.04em] sm:text-[64px] sm:leading-[64px]">
        A small object for feeling near.
      </h1>
      <p className="mt-7 max-w-lg font-body text-lg leading-8 text-text-muted">
        Echo stays quiet when alone. When another Echo comes close, layered
        tones begin to meet. At the end of the day, the station turns those
        moments of co-presence into sound memories.
      </p>
      <div className="mt-10 grid gap-4 font-body text-sm leading-6 text-text-muted sm:grid-cols-3">
        <p>
          <span className="block text-text">Carry it.</span>
          A companion moves with you through ordinary rooms.
        </p>
        <p>
          <span className="block text-text">Let it meet.</span>
          Near another Echo, rhythm and tone begin to gather.
        </p>
        <p>
          <span className="block text-text">Place it down.</span>
          The day returns as a visual landscape of sound.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          className="rounded-full bg-nav-active px-6 py-3 font-body text-sm text-white transition hover:opacity-90"
          href="/login"
        >
          Enter
        </Link>
        <Link
          className="rounded-full border border-border bg-surface/65 px-6 py-3 font-body text-sm text-text transition hover:bg-surface"
          href="/signup"
        >
          Begin with Echo
        </Link>
      </div>
    </main>
  );
}
