import type { Metadata } from "next";

import { EchoTypeLandingPage } from "@/components/EchoTypeLandingPage";
import { echoTypeDescriptions } from "@/lib/echoTypeMeta";
import { echoTypePageContent } from "@/lib/echoTypePageContent";

const content = echoTypePageContent.bounce;

export const metadata: Metadata = {
  title: `${content.label} Echo — A sonic companion for co-presence`,
  description: echoTypeDescriptions.bounce,
};

export default function BounceEchoPage() {
  return <EchoTypeLandingPage echoType="bounce" />;
}
