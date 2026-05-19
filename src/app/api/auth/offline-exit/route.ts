import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth/sessionCookie";

export const dynamic = "force-dynamic";

/** Clears session without touching the DB (for use when Postgres is unreachable). */
export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/", request.url));
  clearSessionCookie(res);
  return res;
}
