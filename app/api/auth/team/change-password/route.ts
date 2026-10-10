import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTeam } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { hashPassword, verifyPassword } from "@/lib/password.server";
import { setSession } from "@/lib/session.server";

export const runtime = "nodejs";

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter your current and new password." }, { status: 400 });
  }
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a new password with at least 12 characters." },
      { status: 400 },
    );
  }

  try {
    const current = await getCurrentTeam({ allowPasswordChange: true });
    if (!current) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    if (!(await verifyPassword(parsed.data.currentPassword, current.team.passwordHash))) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    const team = await getRepo().updateTeam(current.team.id, {
      passwordHash,
      mustChangePassword: false,
      authVersion: (current.team.authVersion ?? 0) + 1,
    });
    if (!team) return NextResponse.json({ error: "Team account was not found." }, { status: 404 });
    const repo = getRepo();
    await repo.revokeResetTokens(team.id);
    await repo.log({ actor: `team:${team.teamCode}`, action: "team.password_changed" });
    await setSession({ role: "team", teamId: team.id, authVersion: team.authVersion ?? 0 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[password-change] Request failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Password change is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
