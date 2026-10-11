import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getRepo } from "@/lib/db/index.server";
import { setSession, sha256 } from "@/lib/session.server";

export const runtime = "nodejs";

const tokenSchema = z.object({
  token: z
    .string()
    .min(32)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "This sign-in link is invalid or expired." },
      { status: 400 },
    );
  }
  const parsed = tokenSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "This sign-in link is invalid or expired." },
      { status: 400 },
    );

  try {
    const repo = getRepo();
    const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
    if (
      !(await repo.hitRateLimit(`team-magic-login:${sha256(ip.toLowerCase())}`, 10, 15 * 60_000))
    ) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Wait 15 minutes and try again." },
        { status: 429 },
      );
    }

    const tokenHash = sha256(parsed.data.token);
    const availableToken = await repo.getTeamLoginToken(tokenHash);
    if (!availableToken)
      return NextResponse.json(
        { error: "This sign-in link is invalid or expired." },
        { status: 400 },
      );

    const availableTeam = await repo.getTeam(availableToken.teamId);
    if (
      !availableTeam ||
      availableTeam.status !== "active" ||
      (availableTeam.authVersion ?? 0) !== availableToken.authVersion
    ) {
      return NextResponse.json(
        { error: "This sign-in link is invalid or expired." },
        { status: 400 },
      );
    }

    const token = await repo.consumeTeamLoginToken(tokenHash);
    if (!token)
      return NextResponse.json(
        { error: "This sign-in link is invalid or expired." },
        { status: 400 },
      );

    const team = await repo.getTeam(token.teamId);
    if (!team || team.status !== "active" || (team.authVersion ?? 0) !== token.authVersion) {
      return NextResponse.json(
        { error: "This sign-in link is invalid or expired." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    await repo.updateTeam(team.id, {
      firstLoginAt: team.firstLoginAt ?? now,
      lastLoginAt: now,
    });
    await repo.log({ actor: `team:${team.teamCode}`, action: "team.magic_login" });
    await setSession({ role: "team", teamId: team.id, authVersion: team.authVersion ?? 0 });

    return NextResponse.json({ ok: true, mustChangePassword: team.mustChangePassword });
  } catch (error) {
    console.error(
      "[team-magic-login] Authentication service unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "The sign-in service is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
