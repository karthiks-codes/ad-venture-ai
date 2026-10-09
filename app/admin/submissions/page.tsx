import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { formatBytes } from "@/lib/submission-rules";
import { getProblem } from "@/config/problems";
import { AdminShell } from "../_components/admin-shell";
import { ReopenSubmissionButton } from "./reopen-button";

export const runtime = "nodejs";

export default async function AdminSubmissionsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const repo = getRepo();
  const [teams, submissions] = await Promise.all([repo.listTeams(), repo.listSubmissions()]);
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const declarations = await Promise.all(
    submissions.map((submission) => repo.getDeclaration(submission.teamId)),
  );
  return (
    <AdminShell admin={admin}>
      <h1 className="text-3xl font-bold">Submissions</h1>
      <div className="panel mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {[
                "Team",
                "Problem",
                "File",
                "Size",
                "Submitted",
                "Status",
                "AI declaration",
                "Drive",
                ...(admin.role === "owner" ? ["Override"] : []),
              ].map((heading) => (
                <th className="px-4 py-3" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {submissions.map((submission, index) => {
              const team = teamById.get(submission.teamId);
              return (
                <tr key={submission.teamId}>
                  <td className="px-4 py-3">
                    {team?.teamCode ?? "Unknown team"}
                    <br />
                    <span className="text-muted-foreground">{team?.teamName}</span>
                  </td>
                  <td className="px-4 py-3">{getProblem(team?.problemId)?.title ?? "—"}</td>
                  <td className="px-4 py-3">{submission.driveFileName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {submission.driveFileSize ? formatBytes(submission.driveFileSize) : "—"}
                  </td>
                  <td className="px-4 py-3">{submission.uploadCompletedAt ?? "—"}</td>
                  <td className="px-4 py-3">{submission.status}</td>
                  <td className="px-4 py-3">{declarations[index] ? "Complete" : "Missing"}</td>
                  <td className="px-4 py-3">
                    {submission.driveWebViewLink ? (
                      <a
                        className="text-primary underline"
                        href={submission.driveWebViewLink}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open file
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  {admin.role === "owner" && (
                    <td className="px-4 py-3">
                      {submission.status === "submitted" ? (
                        <ReopenSubmissionButton teamId={submission.teamId} />
                      ) : (
                        "—"
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {!submissions.length && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={admin.role === "owner" ? 9 : 8}
                >
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
