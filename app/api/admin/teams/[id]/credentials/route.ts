import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { sendEmail, templates } from "@/lib/email.server";
import { hashPassword } from "@/lib/password.server";
import { randomToken } from "@/lib/session.server";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  if (admin.role === "viewer")
    return NextResponse.json({ error: "Your administrator role is read-only." }, { status: 403 });

  const { id } = await context.params;
  try {
    const repo = getRepo();
    const team = await repo.getTeam(id);
    if (!team) return NextResponse.json({ error: "Team account was not found." }, { status: 404 });
    if (!(await repo.getSettings()).emailServiceEnabled) {
      return NextResponse.json(
        { error: "Email service is disabled. Enable it before resetting team credentials." },
        { status: 409 },
      );
    }
    const temporaryPassword = randomToken(24);
    const baseUrl = process.env["NEXT_PUBLIC_APP_URL"];
    if (!baseUrl)
      return NextResponse.json(
        { error: "Application URL is not configured for credential email." },
        { status: 503 },
      );

    await repo.updateTeam(team.id, {
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
      authVersion: (team.authVersion ?? 0) + 1,
    });
    await repo.revokeResetTokens(team.id);
    try {
      const delivery = await sendEmail(
        repo,
        team.email,
        templates.credentials({
          teamName: team.teamName,
          teamCode: team.teamCode,
          tempPassword: temporaryPassword,
          loginUrl: new URL("/login", baseUrl).toString(),
        }),
      );
      if (!delivery.sent) {
        return NextResponse.json(
          {
            error:
              "Email service was disabled before delivery. Credentials were rotated but not emailed; retry after enabling email.",
          },
          { status: 503 },
        );
      }
    } catch (error) {
      console.error(
        "[admin-team-credentials] Credential email failed",
        error instanceof Error ? error.name : "unknown",
      );
      return NextResponse.json(
        {
          error:
            "Credentials were rotated but email delivery failed. Retry to issue a new temporary password.",
        },
        { status: 503 },
      );
    }
    await repo.updateTeam(team.id, { status: "active" });
    await repo.log({
      actor: `admin:${admin.email}`,
      action: "admin.team_credentials_emailed",
      teamCode: team.teamCode,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[admin-team-credentials] Credential reset failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json({ error: "Credentials could not be reset." }, { status: 503 });
  }
}
