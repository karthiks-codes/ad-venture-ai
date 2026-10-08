// Email provider abstraction. Default: Resend (HTTP API). Swap in SMTP by adding a provider.
import { EVENT } from "@/config/event";

type Mail = { to: string; subject: string; html: string; text: string };
interface EmailProvider { name: string; send(m: Mail): Promise<{ ok: boolean; id?: string; error?: string }> }

const resend: EmailProvider = {
  name: "resend",
  async send(m) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env["RESEND_API_KEY"]}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env["EMAIL_FROM"], to: m.to, subject: m.subject, html: m.html, text: m.text }),
    });
    if (!res.ok) return { ok: false, error: `Resend [${res.status}]: ${await res.text()}` };
    return { ok: true, id: ((await res.json()) as { id: string }).id };
  },
};

// Dev/demo: logs to server console. Never use in production.
const consoleProvider: EmailProvider = {
  name: "console",
  async send(m) { console.info(`[email:demo] to=${m.to} subject="${m.subject}"\n${m.text}`); return { ok: true }; },
};

function provider(): EmailProvider {
  return process.env["RESEND_API_KEY"] && process.env["EMAIL_FROM"] ? resend : consoleProvider;
}

const layout = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:#0b1024;font-family:Arial,sans-serif;color:#eef2ff">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<div style="font-size:22px;font-weight:800;letter-spacing:-.5px;color:#5ee0ff">ADventure 2026</div>
<div style="color:#a5b4fc;font-size:13px;margin-bottom:24px">${EVENT.tagline}</div>
<h1 style="font-size:20px;margin:0 0 16px">${title}</h1>${body}
<p style="color:#94a3b8;font-size:12px;margin-top:32px">${EVENT.organizer} · ${EVENT.department}<br>${EVENT.dateLabel} · ${EVENT.venue}</p>
</div></body></html>`;

export const templates = {
  credentials: (p: { teamName: string; teamCode: string; tempPassword: string; loginUrl: string }): Omit<Mail, "to"> => ({
    subject: `Your ADventure 2026 team login — ${p.teamCode}`,
    text: `Hello ${p.teamName},\n\nTeam ID: ${p.teamCode}\nTemporary password: ${p.tempPassword}\n\nLog in at ${p.loginUrl}. You will be asked to set a new password on first login.`,
    html: layout(`Welcome, ${p.teamName}`, `<p>Your team account is ready.</p><p><b>Team ID:</b> ${p.teamCode}<br><b>Temporary password:</b> <code>${p.tempPassword}</code></p><p><a href="${p.loginUrl}" style="color:#5ee0ff">Log in</a> — you'll set a new password on first login.</p>`),
  }),
  reset: (p: { teamName: string; resetUrl: string }): Omit<Mail, "to"> => ({
    subject: "Reset your ADventure 2026 password",
    text: `Hello ${p.teamName},\n\nReset your password (valid 30 minutes): ${p.resetUrl}\n\nIf you didn't request this, ignore this email.`,
    html: layout("Password reset", `<p>Click below to set a new password. The link expires in 30 minutes.</p><p><a href="${p.resetUrl}" style="color:#5ee0ff">Reset password</a></p>`),
  }),
  submitted: (p: { teamName: string; fileName: string; at: string }): Omit<Mail, "to"> => ({
    subject: "ADventure 2026 — submission received",
    text: `Hello ${p.teamName}, we received "${p.fileName}" at ${p.at}. Good luck in the presentations!`,
    html: layout("Submission received", `<p>We received <b>${p.fileName}</b> at ${p.at}.</p><p>Good luck in the presentations!</p>`),
  }),
};

export async function sendEmail(to: string, mail: Omit<Mail, "to">) {
  const p = provider();
  const r = await p.send({ ...mail, to });
  if (!r.ok) console.error(`[email] ${p.name} failed: ${r.error}`);
  return { ...r, provider: p.name };
}
