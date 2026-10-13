import { describe, expect, it } from "vitest";
import {
  createGmailRawMessage,
  createTeamLoginUrl,
  sendEmail,
  templates,
} from "@/lib/email.server";
import { createMemoryRepo } from "@/lib/db/memory.server";
import { parseTeamCredential } from "@/lib/team-credential";
import { sha256 } from "@/lib/session.server";

describe("Gmail API MIME messages", () => {
  it("parses pasted team credentials at the first equals sign", () => {
    expect(parseTeamCredential("ADV-030=temporary=password==")).toEqual({
      teamCode: "ADV-030",
      password: "temporary=password==",
    });
    expect(parseTeamCredential("ADV-030=temporary-password")).toEqual({
      teamCode: "ADV-030",
      password: "temporary-password",
    });
    expect(
      parseTeamCredential("Team code: ADV-030\nADV-030=temporary-password\nLogin page: /login"),
    ).toEqual({ teamCode: "ADV-030", password: "temporary-password" });
  });

  it("leaves regular identifiers and malformed credentials unchanged", () => {
    expect(parseTeamCredential("team@example.test")).toBeNull();
    expect(parseTeamCredential("ADV-030=")).toBeNull();
    expect(parseTeamCredential("ADV 030=password")).toBeNull();
  });

  it("formats team credentials as one pasteable team-code=password line", () => {
    const email = templates.credentials({
      teamName: "Pixel Pioneers",
      teamCode: "ADV-030",
      tempPassword: "temporary-password",
      loginUrl: "https://adventure.example/login",
      secureLoginUrl: "https://adventure.example/login#access=single-use-token",
    });

    expect(email.text).toContain("ADV-030=temporary-password");
    expect(email.text).toContain("Team code: ADV-030");
    expect(email.text).toContain("Temporary password: temporary-password");
    expect(email.text).toContain("paste this line into the Team code field");
    expect(email.text).toContain("one-time link (expires in 120 minutes)");
    expect(email.html).toContain("(expires in 2 hours).");
    expect(email.text.indexOf("ADV-030=temporary-password")).toBeLessThan(
      email.text.indexOf("You will be asked to change this temporary password"),
    );
    expect(email.html).toContain('href="https://adventure.example/login#access=single-use-token"');
    expect(email.html).toContain("<code>ADV-030=temporary-password</code>");
    expect(email.html.indexOf("<code>ADV-030=temporary-password</code>")).toBeLessThan(
      email.html.indexOf("You will be asked to change this temporary password"),
    );
    expect(email.html).toContain("https://adventure.example/login");
  });

  it("creates a short-lived, single-use login link without exposing its token in the URL query", async () => {
    const repo = createMemoryRepo({ seed: false });
    const loginUrl = await createTeamLoginUrl(
      repo,
      { id: "team-1", authVersion: 2 },
      "https://adventure.example/login",
    );
    expect(loginUrl).not.toBeNull();

    const url = new URL(loginUrl!);
    expect(url.search).toBe("");
    const token = new URLSearchParams(url.hash.slice(1)).get("access");
    expect(token).toBeTruthy();

    const tokenHash = sha256(token!);
    const savedToken = await repo.getTeamLoginToken(tokenHash);
    expect(savedToken).toMatchObject({
      teamId: "team-1",
      authVersion: 2,
      usedAt: null,
    });
    const expiryWindow = new Date(savedToken!.expiresAt).getTime() - Date.now();
    expect(expiryWindow).toBeGreaterThan(119 * 60_000);
    expect(expiryWindow).toBeLessThanOrEqual(120 * 60_000);
    expect(await repo.consumeTeamLoginToken(tokenHash)).toMatchObject({ teamId: "team-1" });
    expect(await repo.consumeTeamLoginToken(tokenHash)).toBeNull();
  });

  it("does not create a sign-in link when email service is disabled", async () => {
    const repo = createMemoryRepo({ seed: false });
    await repo.updateSettings({ emailServiceEnabled: false });

    await expect(
      createTeamLoginUrl(repo, { id: "team-1", authVersion: 0 }, "https://example.test/login"),
    ).resolves.toBeNull();
  });

  it("does not send when the email service is disabled", async () => {
    const repo = createMemoryRepo({ seed: false });
    await repo.updateSettings({ emailServiceEnabled: false });

    await expect(
      sendEmail(repo, "team@example.test", {
        subject: "Test",
        text: "Test email",
        html: "<p>Test email</p>",
      }),
    ).resolves.toEqual({ sent: false });
  });

  it("encodes multipart text and HTML email as Gmail base64url raw content", () => {
    const raw = createGmailRawMessage(
      {
        to: "team@example.test",
        subject: "ADventure — team login",
        text: "Your temporary password is secret.",
        html: "<p>Your temporary password is secret.</p>",
      },
      "events@example.test",
      "fixed-boundary",
    );
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decoded).toContain("From: ADventure 2026 <events@example.test>");
    expect(decoded).toContain("To: team@example.test");
    expect(decoded).toContain('boundary="fixed-boundary"');
    expect(decoded).toContain("=?UTF-8?B?");
    expect(decoded).toContain(Buffer.from("Your temporary password is secret.").toString("base64"));
    expect(decoded).toContain(
      Buffer.from("<p>Your temporary password is secret.</p>").toString("base64"),
    );
  });

  it("does not allow mail header injection or invalid addresses", () => {
    const raw = createGmailRawMessage(
      {
        to: "team@example.test",
        subject: "Hello\r\nBcc: attacker@example.test",
        text: "Message",
        html: "<p>Message</p>",
      },
      "events@example.test",
      "fixed-boundary",
    );
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    expect(decoded).not.toContain("\r\nBcc: attacker@example.test");
    expect(() =>
      createGmailRawMessage(
        { to: "team@example.test\r\nBcc:attacker@example.test", subject: "Hi", text: "", html: "" },
        "events@example.test",
      ),
    ).toThrow(/Recipient email address is invalid/);
    expect(() =>
      createGmailRawMessage(
        { to: "team@example.test", subject: "Hi", text: "", html: "" },
        "invalid sender",
      ),
    ).toThrow(/Sender email address is invalid/);
  });
});
