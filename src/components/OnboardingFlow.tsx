"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { randomTwoWordEchoName } from "@/lib/onboardingNames";
import type { EchoType } from "@/lib/types";
import {
  echoTypeDescriptions,
  echoTypeLabels,
  mockDailyMemory,
  mockEncounters,
} from "@/lib/mockData";

const TOTAL_STEPS = 4;

const echoTypes = Object.keys(echoTypeLabels) as EchoType[];

export function OnboardingFlow() {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [echoType, setEchoType] = useState<EchoType | null>(null);
  const [echoName, setEchoName] = useState("");

  function selectModelType(type: EchoType) {
    setEchoType(type);
    setEchoName(randomTwoWordEchoName(type));
  }

  function next() {
    setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  }

  function back() {
    setStep((current) => Math.max(0, current - 1));
  }

  /** Step 0: leave onboarding (browser history or Today). */
  function backFromWelcome() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/today");
    }
  }

  function finish() {
    router.push("/profile");
  }

  const visualCommon = {
    composition: mockDailyMemory.composition,
    encounters: mockEncounters.slice(0, 6),
    seed: mockDailyMemory.visualization.seed,
    density: mockDailyMemory.visualization.density,
    brightness: mockDailyMemory.visualization.brightness,
    movement: mockDailyMemory.visualization.movement,
    showMutation: false,
    size: 300 as const,
  };

  return (
    <div className="mx-auto w-full max-w-lg px-0">
      <p
        aria-live="polite"
        className="mb-8 text-center font-body text-xs tabular-nums tracking-[0.24em] text-text-muted"
      >
        Step {step + 1} of {TOTAL_STEPS}
      </p>

      {step === 0 ? (
        <div className="flex min-h-[min(72vh,580px)] flex-col items-center justify-center gap-10 pb-12 text-center">
          <h2 className="max-w-md font-display text-[40px] leading-[44px] tracking-[-0.03em] sm:text-[48px] sm:leading-[52px]">
            Welcome to Echo
          </h2>
          <p className="max-w-md font-body text-base leading-7 text-text-muted">
            Echo listens through proximity, not surveillance. Take a quiet
            moment to wake your companion and shape its first gentle voice.
          </p>
          <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-md sm:flex-row sm:justify-center">
            <button
              className="rounded-full border border-border bg-white px-8 py-4 font-body text-sm text-text transition hover:bg-surface-soft sm:flex-1 sm:max-w-[200px]"
              onClick={backFromWelcome}
              type="button"
            >
              Back
            </button>
            <button
              className="rounded-full bg-nav-active px-8 py-4 font-body text-sm text-white transition hover:opacity-90 sm:flex-1 sm:max-w-[200px]"
              onClick={next}
              type="button"
            >
              Setup your Echo
            </button>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-10 pb-16 lg:pb-20">
          <div className="text-center">
            <h2 className="font-display text-[28px] leading-8 tracking-[-0.02em] sm:text-[32px] sm:leading-9">
              Choose your model
            </h2>
            <p className="mt-3 font-body text-sm leading-6 text-text-muted">
              Your model shapes melody and harmonic character. Tap one— a
              suggested name will appear on the next step.
            </p>
          </div>

          <div className="grid gap-4">
            {echoTypes.map((type) => {
              const selected = echoType === type;

              return (
                <button
                  className={[
                    "rounded-2xl border px-5 py-5 text-left transition",
                    selected
                      ? "border-text bg-text/[0.04] text-text"
                      : "border-border bg-white text-text-muted hover:border-text/40 hover:text-text",
                  ].join(" ")}
                  key={type}
                  onClick={() => selectModelType(type)}
                  type="button"
                >
                  <p className="font-display text-xl leading-7 text-text">
                    {echoTypeLabels[type]}
                  </p>
                  <p className="mt-2 font-body text-sm leading-5">
                    {echoTypeDescriptions[type]}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 rounded-full border border-border bg-white py-4 font-body text-sm text-text transition hover:bg-surface-soft"
              onClick={back}
              type="button"
            >
              Back
            </button>
            <button
              className="flex-1 rounded-full bg-nav-active py-4 font-body text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!echoType}
              onClick={next}
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col items-center gap-10 pb-16 lg:gap-12 lg:pb-20">
          <div className="relative w-full max-w-[320px] shrink-0">
            <AbstractMemoryVisual {...visualCommon} />
          </div>

          <div className="w-full max-w-md">
            <div className="flex items-end justify-between gap-4">
              <label
                className="font-body text-xs uppercase tracking-[0.22em] text-text-muted"
                htmlFor="echo-name"
              >
                Echo name
              </label>
              <button
                className="rounded-full border border-border px-3 py-1.5 font-body text-xs text-text transition hover:bg-surface-soft"
                onClick={() => nameInputRef.current?.focus()}
                type="button"
              >
                Edit
              </button>
            </div>
            <input
              className="mt-3 w-full border-b border-border bg-transparent pb-2 font-display text-2xl leading-8 text-text outline-none placeholder:text-text-muted/45 focus:border-text"
              id="echo-name"
              onChange={(event) => setEchoName(event.target.value)}
              placeholder="Name your Echo"
              ref={nameInputRef}
              type="text"
              value={echoName}
            />
          </div>

          <div className="flex w-full max-w-md gap-3">
            <button
              className="flex-1 rounded-full border border-border bg-white py-4 font-body text-sm text-text transition hover:bg-surface-soft"
              onClick={back}
              type="button"
            >
              Back
            </button>
            <button
              className="flex-1 rounded-full bg-nav-active py-4 font-body text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!echoName.trim()}
              onClick={next}
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-10 pb-20">
          <div>
            <h2 className="font-display text-[28px] leading-8 tracking-[-0.02em] sm:text-[32px] sm:leading-9">
              How to live with Echo
            </h2>
            <p className="mt-3 font-body text-sm leading-6 text-text-muted">
              A few quiet habits help the archive stay true to your days.
            </p>
          </div>

          <ul className="grid gap-6 font-body text-base leading-7 text-text">
            <li className="border-l-2 border-text/15 pl-5">
              <span className="font-body text-xs uppercase tracking-[0.2em] text-text-muted">
                Day
              </span>
              <p className="mt-2">
                Wear Echo while you move. When another Echo is nearby, yours
                borrows their melody—distance shapes harmonics, not volume.
              </p>
            </li>
            <li className="border-l-2 border-text/15 pl-5">
              <span className="font-body text-xs uppercase tracking-[0.2em] text-text-muted">
                Night
              </span>
              <p className="mt-2">
                Dock Echo on the Station. It uploads the day&apos;s encounters
                and turns them into a single sound memory you can open in the
                app.
              </p>
            </li>
            <li className="border-l-2 border-text/15 pl-5">
              <span className="font-body text-xs uppercase tracking-[0.2em] text-text-muted">
                App
              </span>
              <p className="mt-2">
                Open Today for the latest memory, Archive for past days, and My
                Echo to tune personality and hear your melody.
              </p>
            </li>
          </ul>

          <div className="flex w-full max-w-md flex-col gap-3 self-center sm:flex-row">
            <button
              className="rounded-full border border-border bg-white py-4 font-body text-sm text-text transition hover:bg-surface-soft sm:flex-1"
              onClick={back}
              type="button"
            >
              Back
            </button>
            <button
              className="rounded-full bg-nav-active py-4 font-body text-sm text-white transition hover:opacity-90 sm:flex-1"
              onClick={finish}
              type="button"
            >
              Enter Echo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
