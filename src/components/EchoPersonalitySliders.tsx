"use client";

import { useState } from "react";
import type { EchoDevice } from "@/lib/types";
import { RotaryKnob } from "./RotaryKnob";

type EchoPersonalitySlidersProps = {
  device: EchoDevice;
};

const traits = [
  {
    id: "mood",
    label: "Light",
    left: "dusk",
    right: "ember",
    note: "how brightness pools in the line",
  },
  {
    id: "motion",
    label: "Pulse",
    left: "held",
    right: "adrift",
    note: "breath when bodies draw in",
  },
  {
    id: "density",
    label: "Weft",
    left: "sheer",
    right: "heavy",
    note: "threads crowding the room",
  },
  {
    id: "softness",
    label: "Edge",
    left: "blade",
    right: "mist",
    note: "where melody meets hush",
  },
];

export function EchoPersonalitySliders({
  device,
}: EchoPersonalitySlidersProps) {
  const [values, setValues] = useState({
    mood: Math.round(device.currentState.brightness * 100),
    motion: Math.round((1 - device.currentState.calmness) * 42 + 36),
    density: Math.round(device.currentState.densityBias * 100),
    softness: Math.round(device.currentState.calmness * 100),
  });

  return (
    <section className="mt-12 max-w-2xl">
      <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
        Twisting the voice
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {traits.map((trait) => (
          <label
            className="group relative min-h-44 overflow-hidden rounded-[28px] bg-[#26231F]/[0.045] p-4"
            key={trait.id}
          >
            <p className="font-body text-xs uppercase tracking-[0.22em] text-text-muted">
              {trait.label}
            </p>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <RotaryKnob
                label={trait.label}
                onChange={(value) =>
                setValues((current) => ({
                  ...current,
                    [trait.id]: Math.round(value * 100),
                }))
              }
                size={96}
                value={values[trait.id as keyof typeof values] / 100}
              />
            </div>
            <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 font-body text-sm leading-5">
              <span>{trait.left}</span>
              <span>{trait.right}</span>
            </div>
            <p className="absolute bottom-10 left-4 max-w-[11rem] font-body text-xs leading-4 text-text-muted opacity-70">
              {trait.note}
            </p>
          </label>
        ))}
      </div>
    </section>
  );
}
