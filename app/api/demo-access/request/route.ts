import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getRepo } from "@/lib/db/index.server";
import { DuplicateError } from "@/lib/db/types";
import { createTeamLoginUrl, sendEmail, templates } from "@/lib/email.server";
import { hashPassword } from "@/lib/password.server";
import { randomToken, sha256 } from "@/lib/session.server";

export const runtime = "nodejs";

const requestSchema = z.object({ email: z.string().trim().email().max(254) }).strict();
const DEMO_ACCESS_MS = 2 * 60 * 60_000;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  try {
    const repo = getRepo();
    const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
    const ipHash = sha256(ip.toLowerCase());
    if (!(await repo.hitRateLimit(`public-demo-ip:${ipHash}`, 8, 60 * 60_000))) {
      return NextResponse.json(
        { error: "Too many demo requests from this network. Try again later." },
        { status: 429 },
      );
    }
    if (!(await repo.hitRateLimit(`public-demo-email:${sha256(email)}`, 2, 60 * 60_000))) {
      return NextResponse.json(
        { error: "A demo link was already requested for this address. Check your inbox." },
        { status: 429 },
      );
    }
    if (!(await repo.getSettings()).emailServiceEnabled) {
      return NextResponse.json(
        { error: "Demo email access is temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }

    const appUrl = process.env["NEXT_PUBLIC_APP_URL"];
    if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
    const baseUrl = new URL(appUrl);
    if (process.env["NODE_ENV"] === "production" && baseUrl.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS in production.");
    }

    const id = randomUUID().replaceAll("-", "");
    const expiresAt = new Date(Date.now() + DEMO_ACCESS_MS).toISOString();
    const team = await repo.createTeam({
      teamCode: `VIS-${id.slice(0, 10)}`,
      teamName: "Public participant demo",
      member1Name: "Demo visitor",
      member2Name: "Demo participant",
      email: `visitor-${id}@demo.invalid`,
      passwordHash: await hashPassword(randomToken(32)),
      mustChangePassword: false,
      status: "active",
      isDemo: true,
      temporaryDemoExpiresAt: expiresAt,
    });
    const loginPage = new URL("/login", baseUrl).toString();
    const loginUrl = await createTeamLoginUrl(repo, team, loginPage);
    if (!loginUrl) throw new Error("Email service is disabled.");
    try {
      await sendEmail(repo, email, templates.publicDemoAccess({ loginUrl }));
    } catch (error) {
      await repo.revokeTeamLoginTokens(team.id);
      throw error;
    }

    return NextResponse.json({
      ok: true,
      message: "If email delivery is available, a one-time demo sign-in link will arrive shortly.",
    });
  } catch (error) {
    if (error instanceof DuplicateError) {
      return NextResponse.json(
        { error: "A demo session could not be created. Please try again." },
        { status: 503 },
      );
    }
    console.error(
      "[public-demo-request] Service unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Demo access is temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }
}
