import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password.server";

const originalEnv = {
  flag: process.env["DEV_PLAINTEXT_PASSWORDS"],
  nodeEnv: process.env["NODE_ENV"],
  vercelEnv: process.env["VERCEL_ENV"],
};

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else Reflect.set(process.env, key, value);
}

afterEach(() => {
  setEnv("DEV_PLAINTEXT_PASSWORDS", originalEnv.flag);
  setEnv("NODE_ENV", originalEnv.nodeEnv);
  setEnv("VERCEL_ENV", originalEnv.vercelEnv);
});

describe("password helpers", () => {
  it("uses bcrypt by default", async () => {
    setEnv("DEV_PLAINTEXT_PASSWORDS", undefined);
    setEnv("NODE_ENV", "test");

    const stored = await hashPassword("test-password");
    expect(stored).toMatch(/^\$2[aby]\$/);
    await expect(verifyPassword("test-password", stored)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", stored)).resolves.toBe(false);
    await expect(verifyPassword("test-password", "test-password")).resolves.toBe(false);
  });

  it("stores and verifies plaintext only when explicitly enabled outside production", async () => {
    setEnv("DEV_PLAINTEXT_PASSWORDS", "true");
    setEnv("NODE_ENV", "development");
    setEnv("VERCEL_ENV", undefined);

    const stored = await hashPassword("test-password");
    expect(stored).toBe("test-password");
    await expect(verifyPassword("test-password", stored)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", stored)).resolves.toBe(false);
  });

  it("continues verifying existing bcrypt hashes while plaintext mode is enabled", async () => {
    setEnv("DEV_PLAINTEXT_PASSWORDS", "true");
    setEnv("NODE_ENV", "development");
    const stored = await bcrypt.hash("test-password", 4);

    await expect(verifyPassword("test-password", stored)).resolves.toBe(true);
  });

  it.each([
    ["NODE_ENV", "production"],
    ["VERCEL_ENV", "production"],
  ])("rejects plaintext mode when %s is %s", async (environment, value) => {
    setEnv("DEV_PLAINTEXT_PASSWORDS", "true");
    setEnv(environment, value);

    await expect(hashPassword("test-password")).rejects.toThrow(/cannot be enabled in production/i);
    await expect(verifyPassword("test-password", "test-password")).rejects.toThrow(
      /cannot be enabled in production/i,
    );
  });
});
