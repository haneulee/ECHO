import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode } from "@/lib/localMockMode";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isLocalMockMode()) {
    return children;
  }
  const r = await resolveSessionUser();
  if (r.kind === "none") {
    redirect("/login?next=/profile");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2Fprofile");
  }
  if (r.kind === "db_unavailable") {
    redirect("/offline");
  }
  return children;
}
