import { TodayPageView } from "@/app/today/TodayPageView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview",
};

export default function OverviewPage() {
  return <TodayPageView />;
}
