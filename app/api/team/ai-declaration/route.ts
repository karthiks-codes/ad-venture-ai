import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTeam } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";

export const runtime = "nodejs";

const declarationSchema = z
  .object({
    toolIds: z.array(z.string().min(1).max(100)).max(30),
    otherTools: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
    description: z.string().trim().min(20).max(2000),
    eventFeedback: z.string().trim().min(10).max(1000),
    rulesConfirmed: z.literal(true),
    originalityConfirmed: z.literal(true),
  })
  .refine((declaration) => declaration.toolIds.length > 0 || declaration.otherTools.length > 0);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Complete every AI declaration field." }, { status: 400 });
  }
  const parsed = declarationSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          "Select a sample tool or list another tool you used, describe its contribution, share at least 10 characters of event feedback, and confirm both acknowledgements.",
      },
      { status: 400 },
    );

  try {
    const current = await getCurrentTeam();
    if (!current) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    if (!current.team.problemId)
      return NextResponse.json(
        { error: "Draw your problem statement before completing the declaration." },
        { status: 409 },
      );
    if (current.team.submissionStatus === "submitted")
      return NextResponse.json(
        { error: "Your final submission is already locked." },
        { status: 409 },
      );

    const repo = getRepo();
    const tools = await repo.listTools();
    const enabledIds = new Set(tools.map((tool) => tool.id));
    if (parsed.data.toolIds.some((id) => !enabledIds.has(id))) {
      return NextResponse.json(
        { error: "One or more selected tools are no longer enabled. Refresh and try again." },
        { status: 400 },
      );
    }
    await repo.saveDeclaration({
      teamId: current.team.id,
      ...parsed.data,
      createdAt: new Date().toISOString(),
    });
    await repo.log({ actor: `team:${current.team.teamCode}`, action: "team.ai_declaration_saved" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ai-declaration] Save failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "The AI declaration could not be saved. Please try again." },
      { status: 503 },
    );
  }
}
