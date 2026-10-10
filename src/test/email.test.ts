import { describe, expect, it } from "vitest";
import { createGmailRawMessage, sendEmail } from "@/lib/email.server";
import { createMemoryRepo } from "@/lib/db/memory.server";

describe("Gmail API MIME messages", () => {
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
