"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import {
  HOW_TO_LIVE_PANELS,
  howToLiveCompositionEmphasis,
  howToLiveEncountersBiased,
} from "@/lib/onboardingHowToLivePanels";
import {
  ONBOARDING_MODEL_ORDER,
  OnboardingModelCarousel,
  useOnboardingVisualSize,
} from "@/components/OnboardingModelCarousel";
import { randomTwoWordEchoName } from "@/lib/onboardingNames";
import type { EchoType } from "@/lib/types";
import {
  onboardingDemoComposition,
  onboardingDemoEncounters,
  onboardingDemoVisualization,
} from "@/lib/onboardingDemoData";
import { onboarding } from "@/lib/uiPoetics";

/** Welcome → model → name → Day → Night → App */
const TOTAL_STEPS = 6;

const primaryBtn =
  "flex-1 rounded-full bg-nav-active py-3.5 font-body text-sm text-white transition hover:opacity-90 sm:py-4 disabled:cursor-not-allowed disabled:opacity-40";

const secondaryBtn =
  "flex-1 rounded-full border border-border bg-white py-3.5 font-body text-sm text-text transition hover:bg-surface-soft sm:py-4";

export function OnboardingFlow() {
  const router = useRouter();
  const nameStepVisualSize = useOnboardingVisualSize();
  const [step, setStep] = useState(0);
  const [modelIndex, setModelIndex] = useState(0);
  const [echoName, setEchoName] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [hasEchoDevice, setHasEchoDevice] = useState<boolean | null>(null);
  const [claimUnitCode, setClaimUnitCode] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { user?: { id: string } | null; hasEchoDevice?: boolean }) => {
        if (cancelled) return;
        if (d?.user) setHasEchoDevice(Boolean(d.hasEchoDevice));
        else setHasEchoDevice(false);
      })
      .catch(() => {
        if (!cancelled) setHasEchoDevice(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function applySuggestedNameForModel(type: EchoType) {
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

  async function finish() {
    if (finishing) return;
    if (hasEchoDevice === null) return;
    const echoType = ONBOARDING_MODEL_ORDER[modelIndex];
    const name = echoName.trim() || randomTwoWordEchoName(echoType);
    if (!hasEchoDevice && !claimUnitCode.trim()) {
      window.alert("Enter your Echo unit code—the same value on the device.");
      return;
    }
    setFinishing(true);
    try {
      const body: {
        echoName: string;
        echoType: EchoType;
        echoUnitCode?: string;
      } = { echoName: name, echoType };
      if (!hasEchoDevice) {
        body.echoUnitCode = claimUnitCode.trim();
      }
      const res = await fetch("/api/me/echo-device", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        window.alert(data.error ?? `Could not save device (${res.status})`);
        if (res.status === 401) {
          router.push("/login");
          router.refresh();
        }
        return;
      }
      router.push("/today");
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Network error");
    } finally {
      setFinishing(false);
    }
  }

  const visualCommon = {
    composition: onboardingDemoComposition,
    encounters: onboardingDemoEncounters.slice(0, 6),
    seed: onboardingDemoVisualization.seed,
    density: onboardingDemoVisualization.density,
    brightness: onboardingDemoVisualization.brightness,
    movement: onboardingDemoVisualization.movement,
    showMutation: false,
  };

  const howToPanel =
    step >= 3 && step <= 5 ? HOW_TO_LIVE_PANELS[step - 3] : null;

  return (
    <div className="mx-auto flex min-h-0 w-full flex-1 flex-col">
      <p
        aria-live="polite"
        className="mb-3 shrink-0 text-center font-body text-xs tabular-nums tracking-[0.24em] text-text-muted sm:mb-4"
      >
        {onboarding.stepCounter(step, TOTAL_STEPS)}
      </p>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {step === 0 ? (
          <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-10 pb-8 text-center">
            <h2 className="max-w-md font-display text-[40px] leading-[44px] tracking-[-0.03em] sm:text-[48px] sm:leading-[52px]">
              {onboarding.welcomeTitle}
            </h2>
            <p className="max-w-md font-body text-base leading-7 text-text-muted">
              {onboarding.welcomeBody}
            </p>
          </div>
        ) : null}

        {step === 1 ? (
          <OnboardingModelCarousel
            className="min-h-0 flex-1"
            onActiveIndexChange={setModelIndex}
          />
        ) : null}

        {step === 2 ? (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="pointer-events-none flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-3 pt-2 sm:pb-2 sm:pt-1">
              <div className="flex w-full max-w-[min(100%,520px)] justify-center">
                <AbstractMemoryVisual
                  {...visualCommon}
                  size={nameStepVisualSize}
                />
              </div>
            </div>

            <div className="pointer-events-auto shrink-0 px-4 pb-2 pt-0 sm:pb-3 lg:pb-4">
              <div className="mx-auto w-full max-w-xl">
                <label
                  className="font-body text-xs uppercase tracking-[0.22em] text-text-muted"
                  htmlFor="echo-name"
                >
                  {onboarding.nameFieldLabel}
                </label>
                <input
                  className="mt-3 w-full border-b border-border bg-transparent pb-2 font-display text-2xl leading-8 text-text outline-none placeholder:text-text-muted/45 focus:border-text"
                  id="echo-name"
                  onChange={(event) => setEchoName(event.target.value)}
                  placeholder={onboarding.namePlaceholder}
                  type="text"
                  value={echoName}
                />
              </div>
            </div>
          </div>
        ) : null}

        {howToPanel ? (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="pointer-events-none flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-3 pt-2 sm:pb-2 sm:pt-1">
              <div className="flex w-full max-w-[min(100%,520px)] justify-center">
                <AbstractMemoryVisual
                  composition={howToLiveCompositionEmphasis(
                    howToPanel.emphasizeEchoType,
                  )}
                  encounters={howToLiveEncountersBiased(
                    howToPanel.emphasizeEchoType,
                  )}
                  key={howToPanel.id}
                  showMutation={false}
                  size={nameStepVisualSize}
                  {...howToPanel.visualization}
                />
              </div>
            </div>

            <div className="pointer-events-auto shrink-0 px-4 pb-2 pt-0 sm:pb-3 lg:pb-4">
              <div className="mx-auto w-full max-w-xl">
                <div>
                  <p className="h-4 font-display text-xs uppercase leading-4 tracking-[0.28em] text-text-muted">
                    {onboarding.howToLiveEyebrow}
                  </p>
                  {step === 3 ? (
                    <p className="mt-2 max-w-lg font-body text-sm leading-6 text-text-muted">
                      {onboarding.howToLiveLeadStep3}
                    </p>
                  ) : null}
                  <h2
                    className={[
                      "font-display text-[clamp(1.35rem,5vw,2.25rem)] leading-[1.15] tracking-[-0.03em] sm:text-[32px] sm:leading-9",
                      step === 3 ? "mt-5 sm:mt-6" : "mt-2",
                    ].join(" ")}
                  >
                    {howToPanel.chapter}
                  </h2>
                  <p className="mt-3 font-body text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
                    {howToPanel.body}
                  </p>
                  {step === 5 && hasEchoDevice === null ? (
                    <p className="mt-4 font-body text-xs text-text-muted">
                      Checking your account…
                    </p>
                  ) : null}
                  {step === 5 && hasEchoDevice === false ? (
                    <div className="mt-5">
                      <label
                        className="font-body text-xs uppercase tracking-[0.22em] text-text-muted"
                        htmlFor="echo-claim-unit"
                      >
                        {onboarding.echoUnitOnboardingLabel}
                      </label>
                      <input
                        className="mt-3 w-full border-b border-border bg-transparent pb-2 font-display text-xl leading-8 text-text outline-none placeholder:text-text-muted/45 focus:border-text"
                        id="echo-claim-unit"
                        autoComplete="off"
                        onChange={(event) => setClaimUnitCode(event.target.value)}
                        spellCheck={false}
                        type="text"
                        value={claimUnitCode}
                      />
                      <p className="mt-2 font-body text-[11px] leading-4 text-text-muted/90">
                        {onboarding.echoUnitOnboardingHelp}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Pinned to bottom on all breakpoints (above mobile tab bar when visible). */}
      <div
        className={[
          "pointer-events-auto mt-auto flex shrink-0 flex-row gap-3 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 lg:bg-transparent lg:pb-[max(0.35rem,env(safe-area-inset-bottom))] lg:pt-4 lg:backdrop-blur-none",
        ].join(" ")}
      >
        {step === 0 ? (
          <>
            <button
              className={secondaryBtn}
              onClick={backFromWelcome}
              type="button"
            >
              {onboarding.back}
            </button>
            <button className={primaryBtn} onClick={next} type="button">
              {onboarding.primaryWelcome}
            </button>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <button className={secondaryBtn} onClick={back} type="button">
              {onboarding.back}
            </button>
            <button
              className={primaryBtn}
              onClick={() => {
                applySuggestedNameForModel(ONBOARDING_MODEL_ORDER[modelIndex]);
                next();
              }}
              type="button"
            >
              {onboarding.primaryContinue}
            </button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <button className={secondaryBtn} onClick={back} type="button">
              {onboarding.back}
            </button>
            <button
              className={primaryBtn}
              disabled={!echoName.trim()}
              onClick={next}
              type="button"
            >
              {onboarding.primaryContinue}
            </button>
          </>
        ) : null}
        {step >= 3 && step <= 5 ? (
          <>
            <button className={secondaryBtn} onClick={back} type="button">
              {onboarding.back}
            </button>
            <button
              className={primaryBtn}
              disabled={
                finishing ||
                (step === 5 &&
                  (hasEchoDevice === null ||
                    (hasEchoDevice === false && !claimUnitCode.trim())))
              }
              onClick={() => {
                if (step < 5) {
                  next();
                } else {
                  void finish();
                }
              }}
              type="button"
            >
              {finishing
                ? "Saving…"
                : step < 5
                  ? onboarding.nextChapter
                  : onboarding.primaryFinish}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
