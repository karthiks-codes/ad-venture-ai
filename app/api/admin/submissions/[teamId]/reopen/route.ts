import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";

export const runtime = "nodejs";

const reopenSchema = z
  .object({
    reason: z.string().trim().min(15).max(1000),
    confirmed: z.literal(true),
  })
  .strict();

export async function POST(request: Request, context: { params: Promise<{ teamId: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  if (admin.role !== "owner")
    return NextResponse.json(
      { error: "Only an owner may override a finalized submission." },
      { status: 403 },
    );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Provide a reason and confirm the submission override." },
      { status: 400 },
    );
  }
  const parsed = reopenSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Provide a reason of at least 15 characters and confirm the override." },
      { status: 400 },
    );

  const { teamId } = await context.params;
  try {
    const repo = getRepo();
    const [team, previous] = await Promise.all([repo.getTeam(teamId), repo.getSubmission(teamId)]);
    if (!team || !previous)
      return NextResponse.json({ error: "Team submission was not found." }, { status: 404 });
    const reopened = await repo.reopenSubmission(teamId);
    if (!reopened)
      return NextResponse.json(
        { error: "Only a finalized submission can be reopened." },
        { status: 409 },
      );
    await repo.updateTeam(teamId, { submissionStatus: "reopened" });
    await repo.log({
      actor: `admin:${admin.email}`,
      action: "admin.submission_reopened",
      teamCode: team.teamCode,
      meta: { reason: parsed.data.reason, previousFileId: previous.driveFileId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[admin-submission-reopen] Override failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "The submission override could not be recorded." },
      { status: 503 },
    );
  }
}
