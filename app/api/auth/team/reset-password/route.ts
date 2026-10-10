import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepo } from "@/lib/db/index.server";
import { hashPassword } from "@/lib/password.server";
import { sha256 } from "@/lib/session.server";

export const runtime = "nodejs";

const resetSchema = z.object({
  token: z.string().min(32).max(128),
  newPassword: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Reset link or password is invalid." }, { status: 400 });
  }
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Use a valid reset link and a password with at least 12 characters." },
      { status: 400 },
    );

  try {
    const repo = getRepo();
    const tokenHash = sha256(parsed.data.token);
    const token = await repo.consumeResetToken(tokenHash);
    if (!token)
      return NextResponse.json(
        { error: "This reset link is invalid, expired, or already used." },
        { status: 400 },
      );

    const team = await repo.getTeam(token.teamId);
    if (!team || team.status !== "active") {
      return NextResponse.json(
        { error: "This reset link is invalid, expired, or already used." },
        { status: 400 },
      );
    }
    const passwordHash = await hashPassword(parsed.data.newPassword);
    const updated = await repo.updateTeam(team.id, {
      passwordHash,
      mustChangePassword: false,
      authVersion: (team.authVersion ?? 0) + 1,
    });
    if (!updated)
      return NextResponse.json({ error: "Team account was not found." }, { status: 404 });
    await repo.revokeResetTokens(team.id);
    await repo.log({ actor: `team:${team.teamCode}`, action: "team.password_reset" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[password-reset] Service failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Password reset is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
