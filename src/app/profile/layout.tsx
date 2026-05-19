import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
