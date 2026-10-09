import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type Session =
  | { role: "team"; teamId: string; authVersion: number; exp: number }
  | { role: "admin"; email: string; googleSub: string; exp: number };
type NewSession =
  | { role: "team"; teamId: string; authVersion: number }
  | { role: "admin"; email: string; googleSub: string };

const COOKIE = "adv_session";
const SESSION_HOURS = 10;

function secret(): string {
  const value = process.env["AUTH_SECRET"];
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  }
  return value;
}

function signature(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export async function encodeSession(session: Session): Promise<string> {
  const body = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${body}.${signature(body)}`;
}

export async function decodeSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, supplied] = parts;
  if (!body || !supplied) return null;

  const expected = Buffer.from(signature(body));
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const session: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (
      typeof session !== "object" ||
      session === null ||
      !("exp" in session) ||
      typeof session.exp !== "number" ||
      !Number.isFinite(session.exp) ||
      session.exp <= Date.now()
    ) {
      return null;
    }
    if (
      "role" in session &&
      session.role === "team" &&
      "teamId" in session &&
      typeof session.teamId === "string" &&
      "authVersion" in session &&
      typeof session.authVersion === "number" &&
      Number.isSafeInteger(session.authVersion) &&
      session.authVersion >= 0
    ) {
      return session as Session;
    }
    if (
      "role" in session &&
      session.role === "admin" &&
      "email" in session &&
      typeof session.email === "string" &&
      "googleSub" in session &&
      typeof session.googleSub === "string" &&
      session.email.length > 0 &&
      session.googleSub.length > 0
    ) {
      return session as Session;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSession(session: NewSession, hours = SESSION_HOURS): Promise<void> {
  const expires = Date.now() + hours * 60 * 60 * 1000;
  const fullSession = { ...session, exp: expires } as Session;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, await encodeSession(fullSession), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: hours * 60 * 60,
    expires: new Date(expires),
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export async function readSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(COOKIE)?.value);
}

export const SESSION_COOKIE = COOKIE;

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
