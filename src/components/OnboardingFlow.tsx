"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SonicPresenceLandscape } from "@/components/SonicPresenceLandscape";
import { HOW_TO_LIVE_PANELS } from "@/lib/onboardingHowToLivePanels";
import { useOnboardingVisualSize } from "@/components/OnboardingModelCarousel";
import { isValidEchoColor, normalizeEchoColor } from "@/lib/echoColor";
import {
  echoTypeFromFirmwareModelName,
  isValidFirmwareModelName,
  normalizeFirmwareModelName,
} from "@/lib/echoFirmwareModelName";
import { randomTwoWordEchoName } from "@/lib/onboardingNames";
import { buildOnboardingPreviewDevice } from "@/lib/onboardingPreviewDevice";
import { onboarding } from "@/lib/uiPoetics";

/** Profile → Carry → Meet → Remember */
const TOTAL_STEPS = 4;

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

  async function finish() {
    if (finishing) return;
    const normalizedFirmwareModelName =
      normalizeFirmwareModelName(firmwareModelName);
    const echoType = echoTypeFromFirmwareModelName(normalizedFirmwareModelName);
    const name = echoName.trim() || randomTwoWordEchoName(echoType);
    const normalizedEchoColor = normalizeEchoColor(echoColor);
    if (!isValidFirmwareModelName(normalizedFirmwareModelName)) {
      window.alert(onboarding.firmwareModelInvalid);
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

  const previewDevice = useMemo(
    () =>
      buildOnboardingPreviewDevice({
        echoName,
        echoColor,
        firmwareModelName,
      }),
    [echoColor, echoName, firmwareModelName],
  );

  const howToPanel =
    step >= 1 && step <= 3 ? HOW_TO_LIVE_PANELS[step - 1] : null;
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
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="pointer-events-none flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-3 pt-2 sm:pb-2 sm:pt-1">
              <div
                className="relative overflow-hidden"
                style={{
                  height: nameStepVisualSize,
                  width: nameStepVisualSize,
                }}
              >
                <div className="absolute inset-0 -translate-y-[12%]">
                  <SonicPresenceLandscape
                    device={previewDevice}
                    embedded
                    encounters={[]}
                    variant="echoOnly"
                  />
                </div>
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
                  {onboarding.firmwareModelLabel}
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
                  placeholder={onboarding.firmwareModelPlaceholder}
                  spellCheck={false}
                  type="text"
                  value={firmwareModelName}
                />
                <p className="font-body text-[11px] leading-4 text-text-muted/85">
                  {onboarding.firmwareModelHelp}
                </p>
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
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center">
            <div className="mx-auto w-full max-w-xl">
              <h2 className="font-display text-[clamp(1.35rem,5vw,2.25rem)] leading-[1.15] tracking-[-0.03em] sm:text-[32px] sm:leading-9">
                {howToPanel.chapter}
              </h2>
              <p className="mt-3 font-body text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
                {howToPanel.body}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={[
          "pointer-events-auto mt-auto flex shrink-0 flex-row gap-3 bg-transparent pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 lg:pb-[max(0.35rem,env(safe-area-inset-bottom))] lg:pt-4",
        ].join(" ")}
      >
        {step === 0 ? (
          <button
            className={primaryBtn}
            disabled={!canContinueFromProfile}
            onClick={next}
            type="button"
          >
            {onboarding.primaryContinue}
          </button>
        ) : null}
        {step >= 1 && step <= 3 ? (
          <>
            <button className={secondaryBtn} onClick={back} type="button">
              {onboarding.back}
            </button>
            <button
              className={primaryBtn}
              disabled={finishing || (step === 3 && !canContinueFromProfile)}
              onClick={() => {
                if (step < 3) {
                  next();
                } else {
                  void finish();
                }
              }}
              type="button"
            >
              {finishing
                ? "Saving…"
                : step < 3
                  ? onboarding.nextChapter
                  : onboarding.primaryFinish}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
