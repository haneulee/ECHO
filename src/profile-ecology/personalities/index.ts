import type { EcologyPersonalityId } from "../types";
import { bloomSnapshot } from "./bloom";
import { driftSnapshot } from "./drift";
import { rippleSnapshot } from "./ripple";

export const ecologySnapshots: Record<
  EcologyPersonalityId,
  typeof driftSnapshot
> = {
  drift: driftSnapshot,
  ripple: rippleSnapshot,
  bloom: bloomSnapshot,
};
