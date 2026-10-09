import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTeam } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { canStartUpload } from "@/lib/submission-rules";
import {
  checkResumableSession,
  decryptUploadSession,
  driveConfigured,
  createResumableSession,
  encryptUploadSession,
  ensureTeamFolder,
} from "@/lib/drive.server";

export const runtime = "nodejs";

const fileSchema = z.object({
  size: z.number().int().positive().safe(),
  mimeType: z.string().min(1).max(100),
});

const extensionByMimeType: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Select a supported video file." }, { status: 400 });
  }
  const parsed = fileSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Select a supported video file." }, { status: 400 });

  let reserved = false;
  let teamId: string | undefined;
  let repo: ReturnType<typeof getRepo> | undefined;
  try {
    const current = await getCurrentTeam();
    if (!current) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    teamId = current.team.id;
    repo = getRepo();
    if (!current.team.problemId)
      return NextResponse.json({ error: "Draw your problem statement first." }, { status: 409 });
    const [settings, declaration] = await Promise.all([
      repo.getSettings(),
      repo.getDeclaration(teamId),
    ]);
    const existing = await repo.getSubmission(teamId);
    const expectedFileName = `final-video.${extensionByMimeType[parsed.data.mimeType] || "mp4"}`;
    if (existing?.status === "submitted")
      return NextResponse.json(
        { error: "Your team has already submitted its final video." },
        { status: 409 },
      );

    const check = canStartUpload({
      settings,
      now: new Date(),
      status: existing?.status ?? "none",
      hasProblem: Boolean(current.team.problemId),
      hasDeclaration: Boolean(declaration),
      file: { size: parsed.data.size, type: parsed.data.mimeType, name: expectedFileName },
    });
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 403 });
    if (!driveConfigured())
      return NextResponse.json(
        { error: "Google Drive upload is not configured for this event." },
        { status: 503 },
      );

    const configuredUrl = process.env["NEXT_PUBLIC_APP_URL"];
    if (!configuredUrl)
      return NextResponse.json(
        { error: "The application upload origin is not configured." },
        { status: 503 },
      );
    const expectedOrigin = new URL(configuredUrl).origin;
    const requestOrigin = request.headers.get("origin");
    if (requestOrigin && requestOrigin !== expectedOrigin) {
      return NextResponse.json(
        { error: "Upload sessions must be requested from the event application." },
        { status: 403 },
      );
    }

    if (
      existing?.status === "uploading" &&
      existing.driveFileName === expectedFileName &&
      existing.driveFileSize === parsed.data.size &&
      existing.mimeType === parsed.data.mimeType &&
      existing.uploadSessionUrlEncrypted
    ) {
      const uploadUrl = decryptUploadSession(existing.uploadSessionUrlEncrypted);
      const driveState = await checkResumableSession(uploadUrl, parsed.data.size);
      if (driveState.state === "in-progress") {
        return NextResponse.json({ uploadUrl, expectedFileName, resumed: true });
      }
      if (driveState.state === "complete" && driveState.fileId) {
        return NextResponse.json({
          uploadUrl,
          expectedFileName,
          resumed: true,
          completedFileId: driveState.fileId,
        });
      }
      await repo.updateSubmission(teamId, { status: "failed", uploadSessionUrlEncrypted: null });
    } else if (existing?.status === "uploading") {
      return NextResponse.json(
        { error: "An upload is already in progress. Select the same file to resume it." },
        { status: 409 },
      );
    }

    const started = await repo.beginSubmission(teamId, {
      driveFileName: expectedFileName,
      driveFileSize: parsed.data.size,
      mimeType: parsed.data.mimeType,
    });
    if (!started)
      return NextResponse.json(
        { error: "A final submission is already in progress or complete." },
        { status: 409 },
      );
    reserved = true;

    const folderId = await ensureTeamFolder(current.team.teamCode, current.team.teamName);
    const uploadUrl = await createResumableSession({
      folderId,
      fileName: expectedFileName,
      mimeType: parsed.data.mimeType,
      size: parsed.data.size,
      origin: expectedOrigin,
    });
    const updated = await repo.updateSubmission(teamId, {
      driveFolderId: folderId,
      uploadSessionUrlEncrypted: encryptUploadSession(uploadUrl),
    });
    if (!updated)
      throw new Error("Submission reservation disappeared before upload session persistence.");
    await repo.log({
      actor: `team:${current.team.teamCode}`,
      action: "submission.upload_started",
      teamCode: current.team.teamCode,
      meta: { fileName: expectedFileName, size: parsed.data.size, mimeType: parsed.data.mimeType },
    });
    return NextResponse.json({ uploadUrl, expectedFileName, resumed: false });
  } catch (error) {
    if (reserved && repo && teamId)
      await repo.updateSubmission(teamId, { status: "failed", uploadSessionUrlEncrypted: null });
    console.error(
      "[submission-session] Upload session creation failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "A Google Drive upload session could not be created. You can safely try again." },
      { status: 503 },
    );
  }
}
