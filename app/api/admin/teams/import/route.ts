import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { DuplicateError } from "@/lib/db/types";
import { createTeamLoginUrl, sendEmail, templates } from "@/lib/email.server";
import { hashPassword } from "@/lib/password.server";
import { randomToken } from "@/lib/session.server";
import { parseTeamCsv } from "@/lib/team-import";

export const runtime = "nodejs";
export const maxDuration = 300;

const teamSchema = z.object({
  teamCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{2,32}$/),
  teamName: z.string().trim().min(1).max(120),
  member1Name: z.string().trim().min(1).max(120),
  member2Name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
});

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  if (admin.role === "viewer")
    return NextResponse.json({ error: "Your administrator role is read-only." }, { status: 403 });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 200_000)
    return NextResponse.json({ error: "CSV file exceeds the 200 KB limit." }, { status: 413 });
  let csv: string;
  try {
    csv = await request.text();
  } catch {
    return NextResponse.json({ error: "CSV file could not be read." }, { status: 400 });
  }

  let rows: ReturnType<typeof parseTeamCsv>;
  try {
    rows = parseTeamCsv(csv);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CSV format is invalid." },
      { status: 400 },
    );
  }

  const repo = getRepo();
  const processRow = async (
    row: (typeof rows)[number],
  ): Promise<{ row: number; teamCode?: string; status: "created" | "failed"; message: string }> => {
    const parsed = teamSchema.safeParse(row.values);
    if (!parsed.success) {
      return {
        row: row.rowNumber,
        status: "failed",
        message: "Check the team code, names, and email address.",
      };
    }
    const teamCode = parsed.data.teamCode.toUpperCase();
    try {
      const temporaryPassword = randomToken(24);
      const team = await repo.createTeam({
        ...parsed.data,
        teamCode,
        email: parsed.data.email.toLowerCase(),
        passwordHash: await hashPassword(temporaryPassword),
        mustChangePassword: true,
        status: "inactive",
      });

      let emailSent = false;
      let active = false;
      try {
        const baseUrl = process.env["NEXT_PUBLIC_APP_URL"];
        if (!baseUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
        const loginUrl = new URL("/login", baseUrl).toString();
        const secureLoginUrl = await createTeamLoginUrl(repo, team, loginUrl);
        const delivery = await sendEmail(
          repo,
          team.email,
          templates.credentials({
            teamName: team.teamName,
            teamCode: team.teamCode,
            tempPassword: temporaryPassword,
            loginUrl,
            secureLoginUrl,
          }),
        );
        emailSent = delivery.sent;
        if (delivery.sent) active = Boolean(await repo.updateTeam(team.id, { status: "active" }));
        else await repo.revokeTeamLoginTokens(team.id);
      } catch (error) {
        await repo.revokeTeamLoginTokens(team.id);
        console.error(
          "[admin-team-import] Credential email failed",
          error instanceof Error ? error.name : "unknown",
        );
      }

      let auditLogged = true;
      try {
        await repo.log({
          actor: `admin:${admin.email}`,
          action: "admin.team_imported",
          teamCode: team.teamCode,
          meta: { emailSent, active, csvRow: row.rowNumber },
        });
      } catch (error) {
        auditLogged = false;
        console.error(
          "[admin-team-import] Audit write failed",
          error instanceof Error ? error.name : "unknown",
        );
      }
      return {
        row: row.rowNumber,
        teamCode,
        status: "created",
        message: [
          active
            ? "Created and activated; Gmail accepted credential email."
            : emailSent
              ? "Credential email was accepted, but activation failed; verify account status before retrying."
              : "Created but remains inactive because credential email was not sent.",
          auditLogged ? "" : "Audit log failed; investigate before proceeding.",
        ]
          .filter(Boolean)
          .join(" "),
      };
    } catch (error) {
      if (error instanceof DuplicateError) {
        return {
          row: row.rowNumber,
          teamCode,
          status: "failed",
          message: "Team code or email already exists.",
        };
      }
      console.error(
        "[admin-team-import] Team row failed",
        error instanceof Error ? error.name : "unknown",
      );
      return {
        row: row.rowNumber,
        teamCode,
        status: "failed",
        message: "Team could not be created; check service availability.",
      };
    }
  };

  const results: Awaited<ReturnType<typeof processRow>>[] = [];
  for (let index = 0; index < rows.length; index += 5) {
    results.push(...(await Promise.all(rows.slice(index, index + 5).map(processRow))));
  }

  return NextResponse.json({
    created: results.filter((result) => result.status === "created").length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
  });
}
