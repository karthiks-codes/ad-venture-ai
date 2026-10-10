import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTeam } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { canStartUpload } from "@/lib/submission-rules";
import { getFileMeta } from "@/lib/drive.server";
import { sendEmail, templates } from "@/lib/email.server";

export const runtime = "nodejs";

const finalizeSchema = z.object({ fileId: z.string().min(1).max(512) });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Google Drive did not return a valid completed upload." },
      { status: 400 },
    );
  }
  const parsed = finalizeSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Google Drive did not return a valid completed upload." },
      { status: 400 },
    );

  try {
    const current = await getCurrentTeam();
    if (!current) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    const repo = getRepo();
    const [submission, settings, declaration] = await Promise.all([
      repo.getSubmission(current.team.id),
      repo.getSettings(),
      repo.getDeclaration(current.team.id),
    ]);
    if (!submission || submission.status !== "uploading" || !submission.driveFolderId) {
      return NextResponse.json(
        { error: "There is no active upload to finalize." },
        { status: 409 },
      );
    }

    const check = canStartUpload({
      settings,
      now: new Date(),
      status: submission.status,
      hasProblem: Boolean(current.team.problemId),
      hasDeclaration: Boolean(declaration),
      file: {
        size: submission.driveFileSize ?? 0,
        type: submission.mimeType ?? "",
        name: submission.driveFileName ?? "",
      },
    });
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 403 });

    const file = await getFileMeta(parsed.data.fileId);
    const size = Number(file.size);
    if (
      !file.parents?.includes(submission.driveFolderId) ||
      file.name !== submission.driveFileName ||
      size !== submission.driveFileSize ||
      file.mimeType !== submission.mimeType
    ) {
      return NextResponse.json(
        { error: "The completed Drive file does not match this team's reserved upload." },
        { status: 400 },
      );
    }

    const finalized = await repo.finalizeSubmission(current.team.id, {
      driveFileId: file.id,
      driveFileName: file.name,
      driveFileSize: size,
      driveWebViewLink: file.webViewLink ?? null,
      mimeType: file.mimeType,
    });
    if (!finalized)
      return NextResponse.json(
        { error: "This submission was already finalized." },
        { status: 409 },
      );
    await repo.updateTeam(current.team.id, { submissionStatus: "submitted" });
    await repo.log({
      actor: `team:${current.team.teamCode}`,
      action: "submission.finalized",
      teamCode: current.team.teamCode,
      meta: { fileId: file.id, fileName: file.name, size },
    });

    let emailSent = false;
    try {
      const completedAt = finalized.uploadCompletedAt ?? new Date().toISOString();
      const delivery = await sendEmail(
        repo,
        current.team.email,
        templates.submitted({
          teamName: current.team.teamName,
          fileName: file.name,
          at: completedAt,
        }),
      );
      emailSent = delivery.sent;
    } catch (error) {
      emailSent = false;
      console.error(
        "[submission-confirmation] Email delivery failed",
        error instanceof Error ? error.name : "unknown",
      );
    }
    return NextResponse.json({ ok: true, emailSent });
  } catch (error) {
    console.error(
      "[submission-finalize] Finalization failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      {
        error:
          "Submission verification is temporarily unavailable. Your upload has not been marked submitted.",
      },
      { status: 503 },
    );
  }
}
