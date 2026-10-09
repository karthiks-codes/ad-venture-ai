import { describe, expect, it } from "vitest";
import { decodeSession, encodeSession, type Session } from "@/lib/session.server";

async function withAuthSecret<T>(run: () => Promise<T>): Promise<T> {
  const previous = process.env["AUTH_SECRET"];
  process.env["AUTH_SECRET"] = "test-secret-with-at-least-32-characters";
  try {
    return await run();
  } finally {
    if (previous === undefined) delete process.env["AUTH_SECRET"];
    else process.env["AUTH_SECRET"] = previous;
  }
}

describe("signed session cookies", () => {
  it("round-trips valid team sessions and rejects changed signatures", async () => {
    await withAuthSecret(async () => {
      const session: Session = {
        role: "team",
        teamId: "team-1",
        authVersion: 2,
        exp: Date.now() + 60_000,
      };
      const encoded = await encodeSession(session);
      expect(await decodeSession(encoded)).toEqual(session);
      const [body, signature] = encoded.split(".");
      expect(await decodeSession(`${body}.${signature}x`)).toBeNull();
      expect(await decodeSession(`${encoded}.extra`)).toBeNull();
    });
  });

  it("rejects expired and malformed session claims", async () => {
    await withAuthSecret(async () => {
      const expired = await encodeSession({
        role: "admin",
        email: "admin@example.test",
        googleSub: "google-subject",
        exp: Date.now() - 1,
      });
      expect(await decodeSession(expired)).toBeNull();
      const malformed = await encodeSession({
        role: "team",
        teamId: "team-1",
        authVersion: Number.NaN,
        exp: Date.now() + 60_000,
      });
      expect(await decodeSession(malformed)).toBeNull();
    });
  });
});
