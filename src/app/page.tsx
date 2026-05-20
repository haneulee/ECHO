import Link from "next/link";
import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (isLocalMockMode()) {
    logDatabaseUnavailable("/ home local mock mode");
    redirect("/today");
  }
  const r = await resolveSessionUser();
  if (r.kind === "ok") {
    redirect("/today");
  }
  if (r.kind === "db_unavailable") {
    logDatabaseUnavailable("/ home");
    redirect("/today");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2F");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16 text-text">
      <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
        Echo
      </p>
      <h1 className="mt-4 font-display text-[40px] leading-[44px] tracking-[-0.03em] sm:text-[48px] sm:leading-[52px]">
        A quiet companion for proximity
      </h1>
      <p className="mt-6 font-body text-base leading-7 text-text-muted">
        Echo remembers who leaned near—through sound, not surveillance. Carry
        it through the day; when another Echo draws close, the weave thickens.
        Your past days stay here, one tide at a time.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          className="rounded-full bg-nav-active px-6 py-3 font-body text-sm text-white transition hover:opacity-90"
          href="/login"
        >
          Log in
        </Link>
        <Link
          className="rounded-full border border-border bg-white px-6 py-3 font-body text-sm text-text transition hover:bg-surface-soft"
          href="/signup"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
