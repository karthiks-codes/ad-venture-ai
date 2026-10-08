// Stateless signed session cookie (HMAC-SHA256). httpOnly, sameSite=lax, secure in prod.
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { isDemoMode } from "./db/index.server";

export type Session =
  | { role: "team"; teamId: string; exp: number }
  | { role: "admin"; email: string; exp: number };

const COOKIE = "adv_session";
const enc = new TextEncoder();

function secret(): string {
  const s = process.env["AUTH_SECRET"];
  if (s) return s;
  if (isDemoMode()) return "demo-only-insecure-secret-change-me";
  throw new Error("AUTH_SECRET is not configured");
}

const b64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function sign(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function encodeSession(s: Session): Promise<string> {
  const body = b64(enc.encode(JSON.stringify(s)));
  return `${body}.${await sign(body)}`;
}

export async function decodeSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || (await sign(body)) !== sig) return null;
  try {
    const s = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/"))) as Session;
    return s.exp > Date.now() ? s : null;
  } catch { return null; }
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true, sameSite: "lax" as const, path: "/", maxAge,
  secure: process.env["NODE_ENV"] === "production",
});

export async function setSession(s: Omit<Session, "exp">, hours = 10) {
  const full = { ...s, exp: Date.now() + hours * 3600_000 } as Session;
  setCookie(COOKIE, await encodeSession(full), cookieOptions(hours * 3600));
}
export const clearSession = () => deleteCookie(COOKIE, { path: "/" });
export const readSession = () => decodeSession(getCookie(COOKIE));
export const SESSION_COOKIE = COOKIE;

export async function sha256(s: string) {
  return b64(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}
export function randomToken(bytes = 32) {
  const a = new Uint8Array(bytes); crypto.getRandomValues(a); return b64(a);
}

// Best-effort in-memory rate limiter (per instance). Production: back with Mongo TTL collection.
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const t = Date.now();
  const arr = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
  arr.push(t); hits.set(key, arr);
  return arr.length <= max;
}
