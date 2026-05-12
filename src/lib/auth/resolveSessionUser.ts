import "server-only";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type ResolvedSession =
  | { kind: "none" }
  | { kind: "stale_jwt" }
  | { kind: "ok"; userId: string };

/**
 * JWT session + DB user. Does not mutate cookies (not allowed in layouts / RSC).
 * Use `kind: "stale_jwt"` → redirect to `GET /api/auth/sync-session` to clear cookie.
 */
export async function resolveSessionUser(): Promise<ResolvedSession> {
  const session = await getSession();
  if (!session) return { kind: "none" };
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });
  if (!user) return { kind: "stale_jwt" };
  return { kind: "ok", userId: session.userId };
}
