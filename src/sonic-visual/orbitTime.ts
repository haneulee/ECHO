/** 24h → angle: midnight at top (−π/2). */
export function timeOfDayToAngle(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return -Math.PI / 2;
  const ms =
    d.getHours() * 3600000 +
    d.getMinutes() * 60000 +
    d.getSeconds() * 1000 +
    d.getMilliseconds();
  const frac = ms / 86400000;
  return frac * Math.PI * 2 - Math.PI / 2;
}

/** Angular span from duration (keeps arcs readable on the ring). */
export function durationToSpanRad(durationSec: number): number {
  const maxFrac = 0.42;
  const frac = Math.min(durationSec / 86400, maxFrac);
  return frac * Math.PI * 2;
}
