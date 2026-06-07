import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Overview",
};

export default function TodayRedirectPage() {
  redirect("/overview");
}
