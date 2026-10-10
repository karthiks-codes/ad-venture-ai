import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { DuplicateError } from "@/lib/db/types";
import { sendEmail, templates } from "@/lib/email.server";
import { hashPassword } from "@/lib/password.server";
import { randomToken } from "@/lib/session.server";

export const runtime = "nodejs";

const createSchema = z
  .object({
    teamCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]{2,32}$/),
    teamName: z.string().trim().min(1).max(120),
    member1Name: z.string().trim().min(1).max(120),
    member2Name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
  })
  .strict();

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  if (admin.role === "viewer")
    return NextResponse.json({ error: "Your administrator role is read-only." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Team details are invalid." }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Check the team code, member names, team name, and email." },
      { status: 400 },
    );

  const password = randomToken(10);
  const repo = getRepo();
  try {
    const passwordHash = await hashPassword(password);
    const team = await repo.createTeam({
      ...parsed.data,
      teamCode: parsed.data.teamCode.toUpperCase(),
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      mustChangePassword: true,
      status: "inactive",
    });
    let emailSent = false;
    try {
      const baseUrl = process.env["NEXT_PUBLIC_APP_URL"];
      if (!baseUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
      const delivery = await sendEmail(
        repo,
        team.email,
        templates.credentials({
          teamName: team.teamName,
          teamCode: team.teamCode,
          tempPassword: password,
          loginUrl: new URL("/login", baseUrl).toString(),
        }),
      );
      if (delivery.sent) {
        await repo.updateTeam(team.id, { status: "active" });
        emailSent = true;
      }
    } catch (error) {
      console.error(
        "[admin-team-create] Credential email failed",
        error instanceof Error ? error.name : "unknown",
      );
    }
    await repo.log({
      actor: `admin:${admin.email}`,
      action: "admin.team_created",
      teamCode: team.teamCode,
      meta: { emailSent },
    });
    return NextResponse.json({ ok: true, emailSent, teamCode: team.teamCode }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateError)
      return NextResponse.json(
        { error: "A team with that code or email already exists." },
        { status: 409 },
      );
    console.error(
      "[admin-team-create] Team creation failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json({ error: "Team could not be created." }, { status: 503 });
  }
}
