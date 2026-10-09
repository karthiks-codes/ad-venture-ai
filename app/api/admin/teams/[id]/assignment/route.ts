import { NextResponse } from "next/server";
import { z } from "zod";
import { PROBLEMS } from "@/config/problems";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";

export const runtime = "nodejs";

const assignmentSchema = z
  .object({
    problemId: z.string().min(1),
    confirmed: z.literal(true),
  })
  .strict();

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
    return NextResponse.json({ error: "Confirm a valid problem reassignment." }, { status: 400 });
  }
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Confirm a valid problem reassignment." }, { status: 400 });
  const target = PROBLEMS.find((problem) => problem.id === parsed.data.problemId);
  if (!target)
    return NextResponse.json({ error: "Problem statement was not found." }, { status: 404 });

  const { id } = await context.params;
  try {
    const repo = getRepo();
    const team = await repo.getTeam(id);
    if (!team) return NextResponse.json({ error: "Team account was not found." }, { status: 404 });
    const updated = await repo.assignProblemAtomic(
      id,
      (counts) => ((counts[target.id] ?? 0) < target.capacity ? target.id : null),
      "admin",
      true,
    );
    if (!updated)
      return NextResponse.json(
        { error: "No problem statement is available within configured capacity." },
        { status: 409 },
      );
    await repo.log({
      actor: `admin:${admin.email}`,
      action: "admin.problem_reassigned",
      teamCode: team.teamCode,
      meta: { previousProblemId: team.problemId, problemId: updated.problemId },
    });
    return NextResponse.json({ ok: true, problemId: updated.problemId });
  } catch (error) {
    console.error(
      "[admin-team-assignment] Reassignment failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Problem assignment could not be changed." },
      { status: 503 },
    );
  }
}
