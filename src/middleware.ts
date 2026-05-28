import { jwtVerify } from "jose/jwt/verify";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ECHO_SESSION_COOKIE } from "@/lib/auth/cookieName";

function authSecret(): Uint8Array | null {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

async function userIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(ECHO_SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = authSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function allowLocalMock(): boolean {
  return process.env.ECHO_MOCK_TODAY === "1";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = await userIdFromRequest(request);
  const localMock = allowLocalMock();

  if (
    pathname.startsWith("/api/today") ||
    pathname.startsWith("/api/archive") ||
    pathname.startsWith("/api/me/echo-device")
  ) {
    if (
      localMock &&
      (pathname.startsWith("/api/today") ||
        pathname.startsWith("/api/archive") ||
        pathname.startsWith("/api/me/echo-device"))
    ) {
      return NextResponse.next();
    }
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const protectedPrefixes = [
    "/main",
    "/today",
    "/archive",
    "/profile",
    "/evolution",
    "/onboarding",
    "/sound-test",
  ];
  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (localMock && isProtected) {
    return NextResponse.next();
  }
  if (isProtected && !userId) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/today/:path*",
    "/archive/:path*",
    "/main/:path*",
    "/profile/:path*",
    "/evolution/:path*",
    "/onboarding/:path*",
    "/sound-test/:path*",
    "/api/today",
    "/api/archive",
    "/api/me/echo-device",
  ],
};
