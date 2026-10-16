import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTeam } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { canStartUpload } from "@/lib/submission-rules";
import { getFileMeta, saveTeamReportPdf } from "@/lib/drive.server";
import { sendEmail, templates } from "@/lib/email.server";
import { getProblem } from "@/config/problems";
import { createSubmissionReportPdf } from "@/lib/submission-report.server";

export const runtime = "nodejs";

const finalizeSchema = z.object({
  fileId: z.string().min(1).max(512),
  videoDurationMillis: z.number().int().positive().max(86_400_000).nullable().optional(),
});

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
    if (current.team.temporaryDemoExpiresAt) {
      return NextResponse.json(
        { error: "Video uploads are disabled in the temporary participant demo." },
        { status: 403 },
      );
    }
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
    if (!declaration?.eventFeedback?.trim()) {
      return NextResponse.json(
        { error: "Complete and save the event feedback before finalizing your video." },
        { status: 403 },
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

    const problem = getProblem(current.team.problemId);
    if (!problem) {
      return NextResponse.json(
        { error: "Your assigned problem statement could not be loaded for the submission report." },
        { status: 409 },
      );
    }
    const submittedAt = new Date().toISOString();
    const tools = await repo.listTools(true);
    const report = await createSubmissionReportPdf({
      team: {
        teamCode: current.team.teamCode,
        teamName: current.team.teamName,
        member1Name: current.team.member1Name,
        member2Name: current.team.member2Name,
        email: current.team.email,
      },
      problem,
      declaration,
      tools,
      video: {
        fileName: file.name,
        mimeType: file.mimeType,
        size,
        ...(file.webViewLink ? { webViewLink: file.webViewLink } : {}),
        ...(file.videoMediaMetadata?.durationMillis
          ? { durationMillis: file.videoMediaMetadata.durationMillis }
          : parsed.data.videoDurationMillis
            ? { durationMillis: parsed.data.videoDurationMillis }
            : {}),
        ...(file.videoMediaMetadata?.width ? { width: file.videoMediaMetadata.width } : {}),
        ...(file.videoMediaMetadata?.height ? { height: file.videoMediaMetadata.height } : {}),
      },
      submittedAt,
      timeZone: settings.timezone,
    });
    const reportName = `${current.team.teamCode}-submission-report.pdf`;
    const reportFile = await saveTeamReportPdf(submission.driveFolderId, reportName, report);

    const finalized = await repo.finalizeSubmission(current.team.id, {
      driveFileId: file.id,
      driveFileName: file.name,
      driveFileSize: size,
      driveWebViewLink: file.webViewLink ?? null,
      mimeType: file.mimeType,
      uploadCompletedAt: submittedAt,
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
      meta: { fileId: file.id, fileName: file.name, size, reportFileId: reportFile.id },
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
    return NextResponse.json({ ok: true, emailSent, reportFileName: reportFile.name });
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
