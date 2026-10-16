import { NextResponse } from "next/server";
import { getCurrentTeam } from "@/lib/auth.server";
import { PROBLEMS, getProblem } from "@/config/problems";
import { getRepo } from "@/lib/db/index.server";
import { cryptoRandom, pickProblem } from "@/lib/allocation";

export const runtime = "nodejs";

export async function POST() {
  try {
    const current = await getCurrentTeam();
    if (!current) {
      const allowedToChange = await getCurrentTeam({ allowPasswordChange: true });
      return NextResponse.json(
        {
          error: allowedToChange
            ? "Change your temporary password before drawing a challenge."
            : "Sign in to draw a challenge.",
        },
        { status: allowedToChange ? 403 : 401 },
      );
    }

    if (current.team.problemId) {
      const existingProblem = getProblem(current.team.problemId);
      if (!existingProblem)
        return NextResponse.json(
          { error: "Your assigned challenge needs organizer attention." },
          { status: 409 },
        );
      return NextResponse.json({ problem: existingProblem, existing: true });
    }

    const repo = getRepo();
    const assigned = await repo.assignProblemAtomic(
      current.team.id,
      (counts) => pickProblem({ problems: PROBLEMS, counts, random: cryptoRandom }),
      "draw",
    );
    const resultingTeam = assigned ?? (await repo.getTeam(current.team.id));
    const problem = getProblem(resultingTeam?.problemId);
    if (!problem) {
      return NextResponse.json(
        { error: "All problem statements are currently at capacity." },
        { status: 409 },
      );
    }

    if (assigned && !current.team.temporaryDemoExpiresAt) {
      await repo.log({
        actor: `team:${current.team.teamCode}`,
        action: "problem.draw",
        teamCode: current.team.teamCode,
        meta: { problemId: problem.id },
      });
    }
    return NextResponse.json({ problem, existing: !assigned });
  } catch (error) {
    console.error(
      "[problem-draw] Allocation failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Problem allocation is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
