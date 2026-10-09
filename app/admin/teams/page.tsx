import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { getProblem } from "@/config/problems";
import { PROBLEMS } from "@/config/problems";
import { AdminShell } from "../_components/admin-shell";
import { CreateTeamForm } from "./create-team-form";
import { ImportTeamsForm } from "./import-teams-form";
import { TeamActions } from "./team-actions";

export const runtime = "nodejs";

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const { q = "" } = await searchParams;
  const teams = await getRepo().listTeams();
  const query = q.trim().toLowerCase();
  const filtered = teams.filter(
    (team) =>
      !query ||
      [team.teamCode, team.teamName, team.email, team.member1Name, team.member2Name].some((value) =>
        value.toLowerCase().includes(query),
      ),
  );

  return (
    <AdminShell admin={admin}>
      <h1 className="text-3xl font-bold">Teams</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {filtered.length} of {teams.length} teams
      </p>
      <CreateTeamForm readOnly={admin.role === "viewer"} />
      <ImportTeamsForm readOnly={admin.role === "viewer"} />
      <form className="mt-5 flex gap-2" method="get">
        <label className="sr-only" htmlFor="team-search">
          Search teams
        </label>
        <input
          className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-2"
          defaultValue={q}
          id="team-search"
          name="q"
          placeholder="Search code, team, members or email"
        />
        <button className="rounded-xl border border-border px-4 py-2 font-semibold" type="submit">
          Search
        </button>
      </form>
      <div className="panel mt-5 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {[
                "Team",
                "Members",
                "Email",
                "Status / login",
                "Problem",
                "Submission",
                "Actions",
              ].map((heading) => (
                <th className="px-4 py-3" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((team) => (
              <tr key={team.id}>
                <td className="px-4 py-3">
                  <strong>{team.teamCode}</strong>
                  <br />
                  <span className="text-muted-foreground">{team.teamName}</span>
                </td>
                <td className="px-4 py-3">
                  {team.member1Name}
                  <br />
                  {team.member2Name}
                </td>
                <td className="px-4 py-3">{team.email}</td>
                <td className="px-4 py-3">
                  {team.status}
                  <br />
                  <span className="text-muted-foreground">
                    {team.firstLoginAt ? "Logged in" : "Not logged in"}
                  </span>
                </td>
                <td className="px-4 py-3">{getProblem(team.problemId)?.title ?? "Unassigned"}</td>
                <td className="px-4 py-3">{team.submissionStatus}</td>
                <td className="px-4 py-3">
                  <TeamActions
                    teamId={team.id}
                    teamCode={team.teamCode}
                    status={team.status}
                    problemId={team.problemId}
                    problems={PROBLEMS}
                    readOnly={admin.role === "viewer"}
                  />
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                  No matching teams.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
