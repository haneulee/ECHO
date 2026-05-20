import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";

export default async function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isLocalMockMode()) {
    logDatabaseUnavailable("/archive layout local mock mode");
    return children;
  }
  const r = await resolveSessionUser();
  if (r.kind === "none") {
    redirect("/login?next=/archive");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2Farchive");
  }
  if (r.kind === "db_unavailable") {
    logDatabaseUnavailable("/archive layout");
    return children;
  }
  return children;
}
