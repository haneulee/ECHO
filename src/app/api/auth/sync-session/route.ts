import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { clearSessionCookie } from "@/lib/auth/sessionCookie";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_PREFIXES = [
  "/today",
  "/archive",
  "/profile",
  "/evolution",
  "/onboarding",
  "/sound-test",
] as const;

function safeNext(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  const p = raw.split("?")[0] ?? "";
  if (p === "/") return "/";
  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  );
  return allowed ? p : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fallback = "/today";
  const next = safeNext(searchParams.get("next"), fallback);

  const session = await getSession();
  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", next);
    return NextResponse.redirect(login);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });

  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", next);
    const res = NextResponse.redirect(login);
    clearSessionCookie(res);
    return res;
  }

  return NextResponse.redirect(new URL(next, request.url));
}
