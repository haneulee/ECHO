import "server-only";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type ResolvedSession =
  | { kind: "none" }
  | { kind: "stale_jwt" }
  | { kind: "ok"; userId: string }
  | { kind: "db_unavailable" };

export function isDatabaseConnectFailure(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const o = e as { name?: string; code?: string };
  if (o.name === "PrismaClientInitializationError") return true;
  if (o.code === "P1001" || o.code === "P1002" || o.code === "P1017")
    return true;
  return false;
}

/**
 * JWT session + DB user. Does not mutate cookies (not allowed in layouts / RSC).
 * Use `kind: "stale_jwt"` → redirect to `GET /api/auth/sync-session` to clear cookie.
 */
export async function resolveSessionUser(): Promise<ResolvedSession> {
  const session = await getSession();
  if (!session) return { kind: "none" };
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true },
    });
    if (!user) return { kind: "stale_jwt" };
    return { kind: "ok", userId: session.userId };
  } catch (e) {
    if (isDatabaseConnectFailure(e)) return { kind: "db_unavailable" };
    throw e;
  }
}
