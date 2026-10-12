import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTeam } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { AiDeclarationForm } from "../ai-declaration-form";
import { VideoUploader } from "../video-uploader";

export const runtime = "nodejs";

export default async function TeamSubmissionPage() {
  const current = await getCurrentTeam();
  if (!current) {
    const needsPasswordChange = await getCurrentTeam({ allowPasswordChange: true });
    redirect(needsPasswordChange ? "/change-password" : "/login");
  }
  const [settings, submission, declaration] = await Promise.all([
    getRepo().getSettings(),
    getRepo().getSubmission(current.team.id),
    getRepo().getDeclaration(current.team.id),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link className="text-sm font-semibold text-primary" href="/dashboard">
        ← Team workspace
      </Link>
      <h1 className="mt-5 text-3xl font-bold">Complete your submission</h1>
      {!submission || submission.status !== "submitted" ? (
        <section className="panel mt-5 p-7">
          <h2 className="text-2xl font-bold">AI usage declaration</h2>
          {current.team.problemId ? (
            <AiDeclarationForm declaration={declaration} tools={await getRepo().listTools()} />
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Draw your problem statement before saving an AI declaration.
            </p>
          )}
        </section>
      ) : null}
      <section className="panel mt-5 p-7">
        <h2 className="text-2xl font-bold">Final video submission</h2>
        {submission?.status === "submitted" ? (
          <div className="mt-5 rounded-xl border border-success/40 bg-success/10 p-5">
            <h2 className="font-bold text-success">Final video received</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {submission.driveFileName} · {submission.uploadCompletedAt}
            </p>
            <p className="mt-2 text-sm">
              Your team’s final submission is locked. Contact event staff if you need help.
            </p>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-warning/40 bg-warning/10 p-5">
            <h2 className="font-bold">One final video, uploaded directly to organizer storage</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The browser sends the video directly to Google Drive in resumable chunks. This
              application handles only the upload session and small verification metadata.
            </p>
            <p className="mt-3 text-sm">
              Upload enabled: {settings.uploadEnabled ? "yes" : "no"} · AI declaration and event
              feedback: {declaration?.eventFeedback?.trim() ? "complete" : "not complete"}
            </p>
            {current.team.problemId && declaration?.eventFeedback?.trim() && (
              <VideoUploader
                allowedTypes={settings.allowedVideoTypes}
                existingStatus={submission?.status ?? "none"}
                maxBytes={settings.maxVideoSizeBytes}
              />
            )}
          </div>
        )}
      </section>
    </main>
  );
}
