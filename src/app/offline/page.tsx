import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Echo — database unreachable",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16 text-text">
      <p className="font-body text-xs uppercase text-text-muted">
        Echo
      </p>
      <h1 className="mt-4 font-display text-[32px] leading-9 tracking-[-0.03em] sm:text-[40px] sm:leading-[44px]">
        Can&apos;t reach the database
      </h1>
      <p className="mt-6 font-body text-base leading-7 text-text-muted">
        You still have a login cookie, so the app checks your account against
        Postgres on each load. If the database is down or{" "}
        <code className="rounded bg-surface-soft px-1.5 py-0.5 font-mono text-sm text-text">
          DATABASE_URL
        </code>{" "}
        is wrong, you will keep landing here. Fix the database, or sign out below
        to browse the public home without a session.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          className="glass-btn-primary rounded-full px-6 py-3 font-body text-sm"
          href="/"
        >
          Try again
        </Link>
        <Link
          className="glass-btn-secondary rounded-full px-6 py-3 font-body text-sm"
          href="/api/auth/offline-exit"
        >
          Sign out &amp; go home
        </Link>
      </div>
    </main>
  );
}
