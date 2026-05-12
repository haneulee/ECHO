import { redirect } from "next/navigation";

import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";

export default async function EvolutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const r = await resolveSessionUser();
  if (r.kind === "none") {
    redirect("/login?next=/evolution");
  }
  if (r.kind === "stale_jwt") {
    redirect("/api/auth/sync-session?next=%2Fevolution");
  }
  return children;
}
