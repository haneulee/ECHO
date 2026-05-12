import { NextResponse } from "next/server";

import { ECHO_SESSION_COOKIE } from "@/lib/auth/cookieName";

const MAX_AGE = 60 * 60 * 24 * 30;

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ECHO_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(ECHO_SESSION_COOKIE);
}
