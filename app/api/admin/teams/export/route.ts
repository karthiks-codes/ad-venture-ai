import { NextResponse } from "next/server";
import { getProblem } from "@/config/problems";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";

export const runtime = "nodejs";

function xml(value: unknown): string {
  return Array.from(String(value ?? ""))
    .filter((character) => {
      const code = character.codePointAt(0)!;
      return (
        code === 0x09 ||
        code === 0x0a ||
        code === 0x0d ||
        (code >= 0x20 && code <= 0xd7ff) ||
        (code >= 0xe000 && code <= 0xfffd) ||
        (code >= 0x10000 && code <= 0x10ffff)
      );
    })
    .join("")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cell(value: unknown, href?: string): string {
  const link = href ? ` ss:HRef="${xml(href)}"` : "";
  return `<Cell${link}><Data ss:Type="String">${xml(value)}</Data></Cell>`;
}

function worksheet(name: string, rows: string[][]): string {
  const table = rows.map((row) => `<Row>${row.join("")}</Row>`).join("");
  return (
    `<Worksheet ss:Name="${xml(name)}"><Table ` +
    `ss:ExpandedColumnCount="${rows[0]?.length ?? 0}" ` +
    `ss:ExpandedRowCount="${rows.length}">${table}</Table></Worksheet>`
  );
}

export async function GET(_request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
    }

    const repo = getRepo();
    const teams = await repo.listTeams();
    const headers = [
      "Team code",
      "Team name",
      "Member 1",
      "Member 2",
      "Contact email",
      "Team status",
      "First login",
      "Assigned problem",
      "Submission status",
    ];
    const rows: string[][] = [headers.map((value) => cell(value))];

    for (const team of teams) {
      const problem = getProblem(team.problemId);
      rows.push([
        cell(team.teamCode),
        cell(team.teamName),
        cell(team.member1Name),
        cell(team.member2Name),
        cell(team.email),
        cell(team.status),
        cell(team.firstLoginAt ? "Complete" : "Pending"),
        cell(problem?.title ?? "Unassigned"),
        cell(team.submissionStatus),
      ]);
    }

    const workbook =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<?mso-application progid="Excel.Sheet"?>` +
      `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
      `xmlns:o="urn:schemas-microsoft-com:office:office" ` +
      `xmlns:x="urn:schemas-microsoft-com:office:excel" ` +
      `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
      worksheet("Teams", rows) +
      `</Workbook>`;

    return new Response(workbook, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": 'attachment; filename="adventure-teams.xls"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "[admin-teams-export] Export failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json({ error: "Teams export could not be created." }, { status: 503 });
  }
}
