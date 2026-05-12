"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 font-body text-sm text-text outline-none transition focus:border-nav-active";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/today";
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not log in.");
        return;
      }
      router.push(next.startsWith("/") ? next : "/today");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 text-text">
      <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
        Echo
      </p>
      <h1 className="mt-3 font-display text-3xl tracking-[-0.03em]">Log in</h1>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <label className="block font-body text-xs text-text-muted">
          User id
          <input
            autoComplete="username"
            className={inputClass}
            name="userId"
            onChange={(e) => setUserId(e.target.value)}
            required
            value={userId}
          />
        </label>
        <label className="block font-body text-xs text-text-muted">
          Password
          <input
            autoComplete="current-password"
            className={inputClass}
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? (
          <p className="font-body text-sm text-red-900/90">{error}</p>
        ) : null}
        <button
          className="w-full rounded-full bg-nav-active py-3.5 font-body text-sm text-white transition hover:opacity-90 disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-8 text-center font-body text-sm text-text-muted">
        No account?{" "}
        <Link className="text-nav-active underline-offset-2 hover:underline" href="/signup">
          Sign up
        </Link>
      </p>
      <p className="mt-4 text-center">
        <Link className="font-body text-sm text-text-muted hover:text-text" href="/">
          ← Back
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 font-body text-sm">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
