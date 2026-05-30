"use client";

type DistanceSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function DistanceSlider({ value, onChange }: DistanceSliderProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between font-body text-xs uppercase text-text-muted">
        <span>How near</span>
        <span>{value.toFixed(2)}</span>
      </span>
      <input
        aria-label="Nearness"
        className="h-2 w-full accent-text"
        max={1}
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        step={0.01}
        type="range"
        value={value}
      />
    </label>
  );
}
