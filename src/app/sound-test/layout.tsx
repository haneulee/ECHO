import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";

export default async function SoundTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const r = await resolveSessionUser();
  if (r.kind === "none") {
    redirect("/login?next=/sound-test");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2Fsound-test");
  }
  if (r.kind === "db_unavailable") {
    redirect("/offline");
  }
  return children;
}
