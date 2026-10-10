import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getRepo } from "@/lib/db/index.server";
import { sendEmail, templates } from "@/lib/email.server";
import { randomToken, sha256 } from "@/lib/session.server";

export const runtime = "nodejs";

const emailSchema = z.object({ email: z.string().trim().email().max(254) });

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Enter the email address linked to your team." },
      { status: 400 },
    );
  }
  const parsed = emailSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Enter a valid team email address." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  try {
    const repo = getRepo();
    const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
    if (
      !(await repo.hitRateLimit(
        `team-reset:${sha256(`${ip.toLowerCase()}:${email}`)}`,
        4,
        15 * 60_000,
      ))
    ) {
      return NextResponse.json(
        { error: "Too many reset requests. Try again later." },
        { status: 429 },
      );
    }
    if (!(await repo.getSettings()).emailServiceEnabled) {
      return NextResponse.json({
        ok: true,
        message:
          "If an active team account uses that address, reset instructions will be sent when email service is available.",
      });
    }
    const team = await repo.findTeamByLogin(email);
    let resetMail: ReturnType<typeof templates.reset>;
    if (team?.status === "active" && team.email === email) {
      const token = randomToken();
      const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
      await repo.saveResetToken({
        tokenHash: sha256(token),
        teamId: team.id,
        expiresAt,
        usedAt: null,
      });
      const baseUrl = process.env["NEXT_PUBLIC_APP_URL"];
      if (!baseUrl)
        throw new Error("NEXT_PUBLIC_APP_URL must be configured to send password reset links.");
      const resetUrl = new URL(
        `/reset-password?token=${encodeURIComponent(token)}`,
        baseUrl,
      ).toString();
      resetMail = templates.reset({ teamName: team.teamName, resetUrl });
    } else {
      resetMail = templates.resetUnavailable();
    }
    await sendEmail(repo, email, resetMail);
    return NextResponse.json({
      ok: true,
      message: "If an active team account uses that address, reset instructions will be sent.",
    });
  } catch (error) {
    console.error(
      "[password-reset-request] Service failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Password reset is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
