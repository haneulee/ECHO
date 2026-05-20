import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";

export default async function EvolutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isLocalMockMode()) {
    logDatabaseUnavailable("/evolution layout local mock mode");
    return children;
  }
  const r = await resolveSessionUser();
  if (r.kind === "none") {
    redirect("/login?next=/evolution");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2Fevolution");
  }
  if (r.kind === "db_unavailable") {
    logDatabaseUnavailable("/evolution layout");
    return children;
  }
  return children;
}
