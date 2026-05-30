import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";

export default async function OverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isLocalMockMode()) {
    logDatabaseUnavailable("/overview layout local mock mode");
    return children;
  }
  const r = await resolveSessionUser();
  if (r.kind === "none") {
    redirect("/login?next=/overview");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2Foverview");
  }
  if (r.kind === "db_unavailable") {
    logDatabaseUnavailable("/overview layout");
    return children;
  }
  return children;
}
