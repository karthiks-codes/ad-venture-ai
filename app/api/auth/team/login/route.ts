import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getRepo } from "@/lib/db/index.server";
import { setSession, sha256 } from "@/lib/session.server";

export const runtime = "nodejs";

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(256),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Enter your team code or email and password." },
      { status: 400 },
    );
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your team code or email and password." },
      { status: 400 },
    );
  }

  const identifier = parsed.data.identifier.trim();
  try {
    const repo = getRepo();
    const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
    const key = sha256(`${ip.toLowerCase()}:${identifier.toLowerCase()}`);
    if (!(await repo.hitRateLimit(`team-login:${key}`, 8, 15 * 60_000))) {
      return NextResponse.json(
        { error: "Too many login attempts. Wait 15 minutes and try again." },
        { status: 429 },
      );
    }

    const team = await repo.findTeamByLogin(identifier);
    const valid =
      team &&
      team.status === "active" &&
      (await bcrypt.compare(parsed.data.password, team.passwordHash));
    if (!valid || !team) {
      return NextResponse.json(
        { error: "Team code/email or password is incorrect." },
        { status: 401 },
      );
    }

    const now = new Date().toISOString();
    await repo.updateTeam(team.id, {
      firstLoginAt: team.firstLoginAt ?? now,
      lastLoginAt: now,
    });
    await repo.log({ actor: `team:${team.teamCode}`, action: "team.login" });
    await setSession({ role: "team", teamId: team.id, authVersion: team.authVersion ?? 0 });

    return NextResponse.json({ ok: true, mustChangePassword: team.mustChangePassword });
  } catch (error) {
    console.error(
      "[team-login] Authentication service unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "The login service is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
