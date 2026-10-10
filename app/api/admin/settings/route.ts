import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";

export const runtime = "nodejs";

const settingsSchema = z
  .object({
    eventStartAt: z.string().datetime({ offset: true }),
    submissionDeadline: z.string().datetime({ offset: true }),
    timezone: z.string().min(1).max(100),
    maxVideoSizeBytes: z
      .number()
      .int()
      .positive()
      .max(10 * 1024 ** 3),
    allowedVideoTypes: z
      .array(z.enum(["video/mp4", "video/quicktime"]))
      .min(1)
      .max(2),
    uploadEnabled: z.boolean(),
    emailServiceEnabled: z.boolean(),
    eventActive: z.boolean(),
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
    return NextResponse.json({ error: "Settings payload is invalid." }, { status: 400 });
  }
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Review the event settings and supported video types." },
      { status: 400 },
    );

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: parsed.data.timezone });
    if (Date.parse(parsed.data.submissionDeadline) <= Date.parse(parsed.data.eventStartAt)) {
      return NextResponse.json(
        { error: "The submission deadline must be after the event start." },
        { status: 400 },
      );
    }
    const repo = getRepo();
    const updated = await repo.updateSettings(parsed.data);
    await repo.log({
      actor: `admin:${admin.email}`,
      action: "admin.settings_updated",
      meta: { fields: Object.keys(parsed.data) },
    });
    return NextResponse.json({ ok: true, settings: updated });
  } catch (error) {
    console.error(
      "[admin-settings] Update failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Settings could not be saved. Please try again." },
      { status: 503 },
    );
  }
}
