import "server-only";
import bcrypt from "bcryptjs";

function plaintextPasswordsEnabled(): boolean {
  if (process.env["DEV_PLAINTEXT_PASSWORDS"] !== "true") return false;
  if (process.env["NODE_ENV"] === "production" || process.env["VERCEL_ENV"] === "production") {
    throw new Error("DEV_PLAINTEXT_PASSWORDS cannot be enabled in production.");
  }
  return true;
}

export async function hashPassword(password: string): Promise<string> {
  if (plaintextPasswordsEnabled()) return password;
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, storedValue: string): Promise<boolean> {
  const plaintextEnabled = plaintextPasswordsEnabled();
  if (/^\$2[aby]\$\d{2}\$/.test(storedValue)) {
    return bcrypt.compare(password, storedValue);
  }
  return plaintextEnabled && password === storedValue;
}
