"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { onboarding } from "@/lib/uiPoetics";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-white/80 px-4 py-3 font-body text-sm text-text outline-none backdrop-blur-sm transition focus:border-text/35";

export default function SignupPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [echoUnitCode, setEchoUnitCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = "Sign up / Echo";
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          password,
          name: name.trim() || undefined,
          echoUnitCode,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not register.");
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 text-text">
      <Image
        alt="Echo"
        className="fixed left-1/2 top-[max(1.5rem,env(safe-area-inset-top))] z-10 h-auto w-24 -translate-x-1/2"
        height={100}
        priority
        src="/brand/echo_logo.png"
        width={200}
      />
      <h1 className="mt-3 font-display text-3xl tracking-[-0.03em]">Sign up</h1>

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
          Display name{" "}
          <span className="font-body text-text-muted/70">(optional)</span>
          <input
            autoComplete="nickname"
            className={inputClass}
            name="name"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
        </label>
        <label className="block font-body text-xs text-text-muted">
          Password
          <input
            autoComplete="new-password"
            className={inputClass}
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <label className="block font-body text-xs text-text-muted">
          {onboarding.echoUnitSignupLabel}
          <input
            autoComplete="off"
            className={inputClass}
            name="echoUnitCode"
            onChange={(e) => setEchoUnitCode(e.target.value)}
            required
            spellCheck={false}
            value={echoUnitCode}
          />
          <span className="mt-1 block font-body text-[11px] leading-4 text-text-muted/85">
            {onboarding.echoUnitSignupHelp}
          </span>
        </label>
        {error ? (
          <p className="font-body text-sm text-red-900/90">{error}</p>
        ) : null}
        <button
          className="glass-btn-primary w-full rounded-full py-3.5 font-body text-sm disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-8 text-center font-body text-sm text-text-muted">
        Already have an account?{" "}
        <Link
          className="text-text underline-offset-2 hover:underline"
          href="/login"
        >
          Log in
        </Link>
      </p>
      <p className="mt-4 text-center">
        <Link
          className="font-body text-sm text-text-muted hover:text-text"
          href="/"
        >
          ← Back
        </Link>
      </p>
    </main>
  );
}
