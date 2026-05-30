"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import {
  HOW_TO_LIVE_PANELS,
  howToLiveCompositionEmphasis,
  howToLiveEncountersBiased,
} from "@/lib/onboardingHowToLivePanels";
import { useOnboardingVisualSize } from "@/components/OnboardingModelCarousel";
import { isValidEchoColor, normalizeEchoColor } from "@/lib/echoColor";
import {
  echoTypeFromFirmwareModelName,
  isValidFirmwareModelName,
  normalizeFirmwareModelName,
} from "@/lib/echoFirmwareModelName";
import { randomTwoWordEchoName } from "@/lib/onboardingNames";
import {
  onboardingDemoComposition,
  onboardingDemoEncounters,
  onboardingDemoVisualization,
} from "@/lib/onboardingDemoData";
import { onboarding } from "@/lib/uiPoetics";

/** Welcome → profile → Day → Night → App */
const TOTAL_STEPS = 5;

const primaryBtn =
  "glass-btn-primary flex-1 rounded-full py-3.5 font-body text-sm sm:py-4 disabled:cursor-not-allowed disabled:opacity-40";

const secondaryBtn =
  "glass-btn-secondary flex-1 rounded-full py-3.5 font-body text-sm sm:py-4";

export function OnboardingFlow() {
  const router = useRouter();
  const nameStepVisualSize = useOnboardingVisualSize();
  const [step, setStep] = useState(0);
  const [echoName, setEchoName] = useState(() => randomTwoWordEchoName("bounce"));
  const [echoColor, setEchoColor] = useState("#FFE36E");
  const [firmwareModelName, setFirmwareModelName] = useState("");
  const [finishing, setFinishing] = useState(false);

  function next() {
    setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  }

  function back() {
    setStep((current) => Math.max(0, current - 1));
  }

  /** Step 0: leave onboarding (browser history or profile). */
  function backFromWelcome() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/main");
    }
  }

  async function finish() {
    if (finishing) return;
    const normalizedFirmwareModelName =
      normalizeFirmwareModelName(firmwareModelName);
    const echoType = echoTypeFromFirmwareModelName(normalizedFirmwareModelName);
    const name = echoName.trim() || randomTwoWordEchoName(echoType);
    const normalizedEchoColor = normalizeEchoColor(echoColor);
    if (!isValidFirmwareModelName(normalizedFirmwareModelName)) {
      window.alert("Enter a firmware model name like ECHO_BOUNCE_001.");
      return;
    }
    if (!isValidEchoColor(normalizedEchoColor)) {
      window.alert("Choose a valid Echo color.");
      return;
    }
    setFinishing(true);
    try {
      const res = await fetch("/api/me/echo-device", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          echoName: name,
          echoType,
          echoColor: normalizedEchoColor,
          firmwareModelName: normalizedFirmwareModelName,
        }),
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
      router.push("/main");
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
    step >= 2 && step <= 4 ? HOW_TO_LIVE_PANELS[step - 2] : null;
  const normalizedFirmwareModelName =
    normalizeFirmwareModelName(firmwareModelName);
  const canContinueFromProfile =
    Boolean(echoName.trim()) &&
    isValidEchoColor(normalizeEchoColor(echoColor)) &&
    isValidFirmwareModelName(normalizedFirmwareModelName);

  return (
    <div className="mx-auto flex min-h-0 w-full flex-1 flex-col">
      <p
        aria-live="polite"
        className="mb-3 shrink-0 text-center font-body text-xs tabular-nums text-text-muted sm:mb-4"
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
              <div className="mx-auto grid w-full max-w-xl gap-5">
                <label
                  className="font-body text-xs uppercase text-text-muted"
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
                <label
                  className="font-body text-xs uppercase text-text-muted"
                  htmlFor="firmware-model-name"
                >
                  Firmware model name
                </label>
                <input
                  autoComplete="off"
                  className="w-full border-b border-border bg-transparent pb-2 font-display text-2xl leading-8 text-text outline-none placeholder:text-text-muted/45 focus:border-text"
                  id="firmware-model-name"
                  onChange={(event) =>
                    setFirmwareModelName(
                      normalizeFirmwareModelName(event.target.value),
                    )
                  }
                  placeholder="ECHO_BOUNCE_001"
                  spellCheck={false}
                  type="text"
                  value={firmwareModelName}
                />
                <label
                  className="font-body text-xs uppercase text-text-muted"
                  htmlFor="echo-color"
                >
                  Echo color
                </label>
                <div className="flex items-center gap-4">
                  <input
                    aria-label="Echo color"
                    className="h-12 w-16 rounded-full border border-border bg-transparent p-1"
                    id="echo-color"
                    onChange={(event) =>
                      setEchoColor(normalizeEchoColor(event.target.value))
                    }
                    type="color"
                    value={
                      isValidEchoColor(echoColor)
                        ? echoColor.toLowerCase()
                        : "#000000"
                    }
                  />
                  <input
                    className="min-w-0 flex-1 border-b border-border bg-transparent pb-2 font-display text-xl leading-8 text-text outline-none placeholder:text-text-muted/45 focus:border-text"
                    onChange={(event) =>
                      setEchoColor(normalizeEchoColor(event.target.value))
                    }
                    placeholder="#FF9F6E"
                    type="text"
                    value={echoColor}
                  />
                </div>
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
                  <p className="h-4 font-display text-xs uppercase leading-4 text-text-muted">
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
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Pinned to bottom on all breakpoints (above mobile tab bar when visible). */}
      <div
        className={[
          "pointer-events-auto mt-auto flex shrink-0 flex-row gap-3 bg-transparent pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 lg:pb-[max(0.35rem,env(safe-area-inset-bottom))] lg:pt-4",
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
              disabled={!canContinueFromProfile}
              onClick={next}
              type="button"
            >
              {onboarding.primaryContinue}
            </button>
          </>
        ) : null}
        {step >= 2 && step <= 4 ? (
          <>
            <button className={secondaryBtn} onClick={back} type="button">
              {onboarding.back}
            </button>
            <button
              className={primaryBtn}
              disabled={finishing || (step === 4 && !canContinueFromProfile)}
              onClick={() => {
                if (step < 4) {
                  next();
                } else {
                  void finish();
                }
              }}
              type="button"
            >
              {finishing
                ? "Saving…"
                : step < 4
                  ? onboarding.nextChapter
                  : onboarding.primaryFinish}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
