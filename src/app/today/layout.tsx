import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";

export default async function TodayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const r = await resolveSessionUser();
  if (r.kind === "none") {
    redirect("/login?next=/today");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2Ftoday");
  }
  if (r.kind === "db_unavailable") {
    redirect("/offline");
  }
  return children;
}
