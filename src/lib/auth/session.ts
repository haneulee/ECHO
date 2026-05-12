import "server-only";

import { cookies } from "next/headers";

import { ECHO_SESSION_COOKIE } from "./cookieName";
import { verifySessionToken } from "./jwt";

export type Session = { userId: string };

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(ECHO_SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  return { userId };
}
