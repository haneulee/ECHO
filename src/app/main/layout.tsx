import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isLocalMockMode()) {
    logDatabaseUnavailable("/main layout local mock mode");
    return children;
  }
  const r = await resolveSessionUser();
  if (r.kind === "none") {
    redirect("/login?next=/main");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2Fmain");
  }
  if (r.kind === "db_unavailable") {
    logDatabaseUnavailable("/main layout");
    return children;
  }
  return children;
}
