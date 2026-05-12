import type { EchoType } from "@/lib/types";

export const echoTypeLabels: Record<EchoType, string> = {
  shy: "Shy",
  messy: "Messy",
  bounce: "Bounce",
};

export const echoTypeDescriptions: Record<EchoType, string> = {
  shy: "Tender and backward until warmth crosses the threshold—then it unfurls.",
  messy:
    "Knots and overlaps—when many gather, the air forgets whose line is whose.",
  bounce: "Sun through leaves—always leaning toward where bodies crowd.",
};
