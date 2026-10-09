import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";

export const runtime = "nodejs";

const toolSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    name: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(1000),
    url: z.string().url().max(2048),
    enabled: z.boolean(),
    recommended: z.boolean(),
    order: z.number().int().min(0).max(10000),
  })
  .strict();

export async function PUT(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  if (admin.role === "viewer")
    return NextResponse.json({ error: "Your administrator role is read-only." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Tool configuration is invalid." }, { status: 400 });
  }
  const parsed = toolSchema.safeParse(body);
  if (
    !parsed.success ||
    !["http:", "https:"].includes(
      new URL(parsed.success ? parsed.data.url : "https://invalid").protocol,
    )
  ) {
    return NextResponse.json(
      { error: "Review the tool name, URL, category and display settings." },
      { status: 400 },
    );
  }

  try {
    const tool = await getRepo().upsertTool(parsed.data);
    await getRepo().log({
      actor: `admin:${admin.email}`,
      action: "admin.ai_tool_saved",
      meta: { toolId: tool.id, enabled: tool.enabled },
    });
    return NextResponse.json({ ok: true, tool });
  } catch (error) {
    console.error("[admin-ai-tools] Save failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Tool configuration could not be saved." }, { status: 503 });
  }
}
