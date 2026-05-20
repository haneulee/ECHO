"use client";

import { useRef, useState } from "react";

type RotaryKnobProps = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  size?: number;
};

const MIN_ANGLE = 135;
const ARC_DEGREES = 270;

export function RotaryKnob({
  value,
  onChange,
  label,
  size = 72,
}: RotaryKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const clampedValue = Math.min(1, Math.max(0, value));
  const dotAngle = MIN_ANGLE + clampedValue * ARC_DEGREES;
  const dotRadius = size * 0.28;
  const dotX = size / 2 + Math.cos((dotAngle * Math.PI) / 180) * dotRadius;
  const dotY = size / 2 + Math.sin((dotAngle * Math.PI) / 180) * dotRadius;

  function updateFromPointer(clientX: number, clientY: number) {
    const rect = knobRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawAngle =
      (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
    let angle = rawAngle < MIN_ANGLE ? rawAngle + 360 : rawAngle;
    angle = Math.min(MIN_ANGLE + ARC_DEGREES, Math.max(MIN_ANGLE, angle));

    onChange((angle - MIN_ANGLE) / ARC_DEGREES);
  }

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(clampedValue * 100)}
      className="relative shrink-0 cursor-pointer touch-none rounded-full bg-[#050505] shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
      onPointerDown={(event) => {
        setIsDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (isDragging) updateFromPointer(event.clientX, event.clientY);
      }}
      onPointerUp={() => setIsDragging(false)}
      ref={knobRef}
      role="slider"
      style={{ height: size, width: size }}
      tabIndex={0}
    >
      <span className="absolute inset-[18%] rounded-full bg-white/[0.035]" />
      <span
        className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E7EA58]"
        style={{ left: dotX, top: dotY }}
      />
    </div>
  );
}
