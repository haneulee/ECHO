import { factoryStateForType } from "@/lib/echoFactoryProfile";
import type { EchoType } from "@/lib/types";

export function defaultStateForType(t: EchoType) {
  return factoryStateForType(t);
}
