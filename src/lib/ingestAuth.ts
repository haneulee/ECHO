import { timingSafeEqual } from "node:crypto";

export function readBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const prefix = "Bearer ";
  if (!authorization.startsWith(prefix)) return null;
  return authorization.slice(prefix.length).trim();
}

export function verifyIngestSecret(token: string | null): boolean {
  const secret = process.env.INGEST_SECRET;
  if (!secret || !token) return false;
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
