import "server-only";
import { OAuth2Client } from "google-auth-library";
import { randomUUID } from "node:crypto";
import { EVENT } from "@/config/event";
import type { Repo, Team } from "@/lib/db/types";
import { randomToken, sha256 } from "@/lib/session.server";

export type Mail = { to: string; subject: string; html: string; text: string };
interface EmailProvider {
  name: string;
  send(message: Mail): Promise<{ ok: boolean; id?: string; error?: string }>;
}

function requiredEmailConfig() {
  const clientId = process.env["GMAIL_OAUTH_CLIENT_ID"];
  const clientSecret = process.env["GMAIL_OAUTH_CLIENT_SECRET"];
  const refreshToken = process.env["GMAIL_OAUTH_REFRESH_TOKEN"];
  const from = process.env["GMAIL_SENDER_EMAIL"]?.trim();
  if (!clientId || !clientSecret || !refreshToken || !from) {
    throw new Error(
      "Gmail email is not configured. Set GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, GMAIL_OAUTH_REFRESH_TOKEN, and GMAIL_SENDER_EMAIL.",
    );
  }
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(from)) {
    throw new Error("GMAIL_SENDER_EMAIL must be a valid Gmail or Google Workspace mailbox.");
  }
  return { clientId, clientSecret, refreshToken, from };
}

function encodeHeader(value: string): string {
  const safe = value.replace(/[\r\n]+/g, " ").trim();
  return `=?UTF-8?B?${Buffer.from(safe, "utf8").toString("base64")}?=`;
}

export function createGmailRawMessage(
  message: Mail,
  from: string,
  boundary = `adv-${randomUUID()}`,
): string {
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(from)) {
    throw new Error("Sender email address is invalid.");
  }
  const safeTo = message.to.replace(/[\r\n]+/g, "").trim();
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(safeTo)) {
    throw new Error("Recipient email address is invalid.");
  }
  const content = [
    `From: ADventure 2026 <${from}>`,
    `To: ${safeTo}`,
    `Subject: ${encodeHeader(message.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(message.text, "utf8").toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(message.html, "utf8").toString("base64"),
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return Buffer.from(content, "utf8").toString("base64url");
}

const gmail: EmailProvider = {
  name: "gmail",
  async send(message) {
    const { clientId, clientSecret, refreshToken, from } = requiredEmailConfig();
    const oauth = new OAuth2Client(clientId, clientSecret);
    oauth.setCredentials({ refresh_token: refreshToken });
    const accessToken = await oauth.getAccessToken();
    if (!accessToken.token) throw new Error("Google did not issue a Gmail API access token.");

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: createGmailRawMessage(message, from) }),
    });
    if (!response.ok) throw new Error(`Gmail API rejected the email [${response.status}].`);
    const result: unknown = await response.json();
    if (
      typeof result !== "object" ||
      result === null ||
      !("id" in result) ||
      typeof result.id !== "string" ||
      result.id.length === 0
    ) {
      throw new Error("Gmail API did not confirm the email request.");
    }
    return { ok: true, id: result.id };
  },
};

function provider(): EmailProvider {
  requiredEmailConfig();
  return gmail;
}

export async function createTeamLoginUrl(
  repo: Repo,
  team: Pick<Team, "id" | "authVersion">,
  loginUrl: string,
): Promise<string | null> {
  if (!(await repo.getSettings()).emailServiceEnabled) return null;

  const token = randomToken();
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  await repo.saveTeamLoginToken({
    tokenHash: sha256(token),
    teamId: team.id,
    authVersion: team.authVersion ?? 0,
    expiresAt,
    usedAt: null,
  });

  const url = new URL(loginUrl);
  url.hash = new URLSearchParams({ access: token }).toString();
  return url.toString();
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );

const layout = (
  title: string,
  body: string,
) => `<!doctype html><html><body style="margin:0;background:#0b1024;font-family:Arial,sans-serif;color:#eef2ff">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<div style="font-size:22px;font-weight:800;letter-spacing:-.5px;color:#5ee0ff">ADventure 2026</div>
<div style="color:#a5b4fc;font-size:13px;margin-bottom:24px">${EVENT.tagline}</div>
<h1 style="font-size:20px;margin:0 0 16px">${title}</h1>${body}
<p style="color:#94a3b8;font-size:12px;margin-top:32px">${EVENT.organizer} · ${EVENT.department}<br>${EVENT.dateLabel} · ${EVENT.venue}</p>
</div></body></html>`;

export const templates = {
  credentials: (p: {
    teamName: string;
    teamCode: string;
    tempPassword: string;
    loginUrl: string;
    secureLoginUrl?: string | null;
  }): Omit<Mail, "to"> => ({
    subject: `Your ADventure 2026 team login — ${p.teamCode}`,
    text: `Hello ${p.teamName},\n\nYour ADventure team login is ready.\n\nTeam code: ${p.teamCode}\nTemporary password: ${p.tempPassword}\n\n${p.secureLoginUrl ? `Sign in with this one-time link (expires in 30 minutes): ${p.secureLoginUrl}` : `Login page: ${p.loginUrl}`}\n\nOr enter the team code and password in their fields, or paste this line into the Team code field:\n${p.teamCode}=${p.tempPassword}\n\nYou will be asked to change this temporary password after signing in.`,
    html: layout(
      `Welcome, ${escapeHtml(p.teamName)}`,
      `<p>Your ADventure team login is ready.</p><p><b>Team code:</b> <code>${escapeHtml(p.teamCode)}</code><br><b>Temporary password:</b> <code>${escapeHtml(p.tempPassword)}</code></p>${p.secureLoginUrl ? `<p><a href="${escapeHtml(p.secureLoginUrl)}" style="color:#5ee0ff">Sign in with your one-time link</a> (expires in 30 minutes).</p>` : `<p><a href="${escapeHtml(p.loginUrl)}" style="color:#5ee0ff">Open the login page</a></p>`}<p>Or enter the team code and password in their fields, or copy this line and paste it into the <b>Team code or email</b> field:</p><p style="padding:14px;background:#151b32;border-radius:8px;font-family:monospace;font-size:16px;user-select:all"><code>${escapeHtml(p.teamCode)}=${escapeHtml(p.tempPassword)}</code></p><p>You will be asked to change this temporary password after signing in.</p>`,
    ),
  }),
  reset: (p: { teamName: string; resetUrl: string }): Omit<Mail, "to"> => ({
    subject: "Reset your ADventure 2026 password",
    text: `Hello ${p.teamName},\n\nReset your password (valid 30 minutes): ${p.resetUrl}\n\nIf you didn't request this, ignore this email.`,
    html: layout(
      "Password reset",
      `<p>Click below to set a new password. The link expires in 30 minutes.</p><p><a href="${escapeHtml(p.resetUrl)}" style="color:#5ee0ff">Reset password</a></p>`,
    ),
  }),
  resetUnavailable: (): Omit<Mail, "to"> => ({
    subject: "ADventure 2026 — password reset request",
    text: "If an active ADventure team account uses this email, a reset link will be sent separately. If you did not request a reset, you can ignore this message.",
    html: layout(
      "Password reset request",
      "<p>If an active ADventure team account uses this email, a reset link will be sent separately. If you did not request a reset, you can ignore this message.</p>",
    ),
  }),
  submitted: (p: { teamName: string; fileName: string; at: string }): Omit<Mail, "to"> => ({
    subject: "ADventure 2026 — submission received",
    text: `Hello ${p.teamName}, we received "${p.fileName}" at ${p.at}. The jury will review submissions later; winners and prize distribution will be announced after judging.`,
    html: layout(
      "Submission received",
      `<p>We received <b>${escapeHtml(p.fileName)}</b> at ${escapeHtml(p.at)}.</p><p>The jury will review submissions later; winners and prize distribution will be announced after judging.</p>`,
    ),
  }),
};

export async function sendEmail(repo: Repo, to: string, mail: Omit<Mail, "to">) {
  if (!(await repo.getSettings()).emailServiceEnabled) return { sent: false as const };
  const mailProvider = provider();
  const result = await mailProvider.send({ ...mail, to });
  if (!result.ok) throw new Error(`${mailProvider.name} did not confirm the email request.`);
  return { ...result, provider: mailProvider.name, sent: true as const };
}
