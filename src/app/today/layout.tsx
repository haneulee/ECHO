import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";

export default async function TodayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isLocalMockMode()) {
    logDatabaseUnavailable("/today layout local mock mode");
    return children;
  }
  const r = await resolveSessionUser();
  if (r.kind === "none") {
    redirect("/login?next=/today");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2Ftoday");
  }
  if (r.kind === "db_unavailable") {
    logDatabaseUnavailable("/today layout");
    return children;
  }
  return children;
}
