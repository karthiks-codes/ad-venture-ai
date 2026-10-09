import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";

export const runtime = "nodejs";

const statusSchema = z.object({ status: z.enum(["active", "inactive"]) }).strict();

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  if (admin.role === "viewer")
    return NextResponse.json({ error: "Your administrator role is read-only." }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Account status is invalid." }, { status: 400 });
  }
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Account status is invalid." }, { status: 400 });
  const { id } = await context.params;
  try {
    const repo = getRepo();
    const existing = await repo.getTeam(id);
    if (!existing)
      return NextResponse.json({ error: "Team account was not found." }, { status: 404 });
    if (existing.status === parsed.data.status) return NextResponse.json({ ok: true });
    const team = await repo.updateTeam(id, {
      status: parsed.data.status,
      authVersion: (existing.authVersion ?? 0) + 1,
    });
    if (!team) return NextResponse.json({ error: "Team account was not found." }, { status: 404 });
    await repo.revokeResetTokens(team.id);
    await repo.log({
      actor: `admin:${admin.email}`,
      action: `admin.team_${parsed.data.status}`,
      teamCode: team.teamCode,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[admin-team-status] Update failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Team account status could not be changed." },
      { status: 503 },
    );
  }
}
