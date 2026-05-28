import { echoTypeLabels } from "@/lib/echoTypeMeta";
import type { EchoDevice } from "@/lib/types";
import { MelodyView } from "./MelodyView";

type EchoCardProps = {
  device: EchoDevice;
};

export function EchoCard({ device }: EchoCardProps) {
  const influences = Object.entries(device.currentState.influences);

  return (
    <section className="py-2">
      <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
        Your Echo
      </p>
      <h2 className="mt-3 font-display text-[40px] leading-[44px] tracking-[-0.03em] lg:text-[56px] lg:leading-[60px]">
        {device.echoName}
      </h2>
      <p className="mt-1 font-body text-sm leading-5 text-text-muted">
        {echoTypeLabels[device.echoType]} ·{" "}
        {device.firmwareModelName ?? device.serialNumber}
      </p>
      <div className="mt-4 flex items-center gap-3 font-body text-xs uppercase tracking-[0.22em] text-text-muted">
        <span
          aria-hidden
          className="h-4 w-4 rounded-full border border-text/10"
          style={{ backgroundColor: device.echoColor }}
        />
        <span>{device.echoColor}</span>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-6 lg:gap-10">
        <SoftStat label="brightness" value={device.currentState.brightness} />
        <SoftStat label="calmness" value={device.currentState.calmness} />
        <SoftStat label="density" value={device.currentState.densityBias} />
      </div>

      <div className="mt-6">
        <MelodyView label="Current melody" melody={device.currentState.melody} />
      </div>

      <div className="mt-6">
        <p className="mb-3 font-body text-xs uppercase tracking-[0.26em] text-text-muted">
          Influence state
        </p>
        <div className="space-y-3">
          {influences.map(([type, value]) => (
            <div className="flex items-center gap-3" key={type}>
              <span className="w-12 font-body text-xs capitalize text-text-muted">
                {type}
              </span>
              <span className="h-2 flex-1 rounded-full bg-surface-soft">
                <span
                  className="block h-2 rounded-full bg-text/70"
                  style={{ width: `${value * 100}%` }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SoftStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-body text-[11px] uppercase tracking-[0.2em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl leading-7">
        {Math.round(value * 100)}
      </p>
    </div>
  );
}
