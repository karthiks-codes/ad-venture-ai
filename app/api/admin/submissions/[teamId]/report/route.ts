import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { downloadDriveFile } from "@/lib/drive.server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
    }

    const { teamId } = await params;
    const repo = getRepo();
    const [team, submission, logs] = await Promise.all([
      repo.getTeam(teamId),
      repo.getSubmission(teamId),
      repo.listLogs(0),
    ]);
    if (!team || submission?.status !== "submitted") {
      return NextResponse.json({ error: "Submission report not found." }, { status: 404 });
    }

    const reportLog = logs.find(
      (entry) =>
        entry.action === "submission.finalized" &&
        entry.teamCode === team.teamCode &&
        typeof entry.meta?.["reportFileId"] === "string",
    );
    const reportFileId = reportLog?.meta?.["reportFileId"];
    if (typeof reportFileId !== "string") {
      return NextResponse.json({ error: "PDF report not found." }, { status: 404 });
    }

    const pdf = await downloadDriveFile(reportFileId);
    return new Response(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${team.teamCode}-submission-report.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "[admin-submission-report] Download failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json({ error: "PDF report could not be downloaded." }, { status: 503 });
  }
}
