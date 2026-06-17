import type { Metadata } from "next";

import { EchoTypeLandingPage } from "@/components/EchoTypeLandingPage";
import { echoTypeDescriptions } from "@/lib/echoTypeMeta";
import { echoTypePageContent } from "@/lib/echoTypePageContent";

const content = echoTypePageContent.messy;

export const metadata: Metadata = {
  title: `${content.label} Echo — A sonic companion for co-presence`,
  description: echoTypeDescriptions.messy,
};

export default function MessyEchoPage() {
  return <EchoTypeLandingPage echoType="messy" />;
}
