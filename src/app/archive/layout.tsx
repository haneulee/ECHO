import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";

export default async function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const r = await resolveSessionUser();
  if (r.kind === "none") {
    redirect("/login?next=/archive");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2Farchive");
  }
  if (r.kind === "db_unavailable") {
    redirect("/offline");
  }
  return children;
}
