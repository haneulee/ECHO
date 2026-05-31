import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";

export default async function MemoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isLocalMockMode()) {
    logDatabaseUnavailable("/memories layout local mock mode");
    return children;
  }
  const r = await resolveSessionUser();
  if (r.kind === "none") {
    redirect("/login?next=/memories");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2Fmemories");
  }
  if (r.kind === "db_unavailable") {
    logDatabaseUnavailable("/memories layout");
    return children;
  }
  return children;
}
