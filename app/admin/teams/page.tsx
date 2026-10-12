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

type TeamSort = "teamCode" | "teamName" | "status" | "login" | "problem" | "submission";
const TEAM_SORTS: TeamSort[] = ["teamCode", "teamName", "status", "login", "problem", "submission"];

function isTeamSort(value: string): value is TeamSort {
  return TEAM_SORTS.includes(value as TeamSort);
}

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    submission?: string;
    problem?: string;
    login?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const {
    q = "",
    status = "",
    submission = "",
    problem = "",
    login = "",
    sort: requestedSort = "teamCode",
    order = "asc",
  } = await searchParams;
  const teams = await getRepo().listTeams();
  const query = q.trim().toLowerCase();
  const sort = isTeamSort(requestedSort) ? requestedSort : "teamCode";
  const descending = order === "desc";
  const filtered = teams
    .filter((team) => {
      const matchesQuery =
        !query ||
        [team.teamCode, team.teamName, team.email, team.member1Name, team.member2Name].some(
          (value) => value.toLowerCase().includes(query),
        );
      const matchesStatus = !["active", "inactive"].includes(status) || team.status === status;
      const matchesSubmission =
        !["submitted", "not-submitted"].includes(submission) ||
        (submission === "submitted"
          ? team.submissionStatus === "submitted"
          : team.submissionStatus !== "submitted");
      const matchesProblem =
        !["drawn", "not-drawn"].includes(problem) ||
        (problem === "drawn" ? Boolean(team.problemId) : !team.problemId);
      const matchesLogin =
        !["completed", "not-completed"].includes(login) ||
        (login === "completed" ? Boolean(team.firstLoginAt) : !team.firstLoginAt);
      return matchesQuery && matchesStatus && matchesSubmission && matchesProblem && matchesLogin;
    })
    .sort((first, second) => {
      let comparison = 0;
      switch (sort) {
        case "teamName":
          comparison = first.teamName.localeCompare(second.teamName);
          break;
        case "status":
          comparison = first.status.localeCompare(second.status);
          break;
        case "login":
          comparison = Number(Boolean(first.firstLoginAt)) - Number(Boolean(second.firstLoginAt));
          break;
        case "problem":
          comparison = (getProblem(first.problemId)?.title ?? "").localeCompare(
            getProblem(second.problemId)?.title ?? "",
          );
          break;
        case "submission":
          comparison = first.submissionStatus.localeCompare(second.submissionStatus);
          break;
        default:
          comparison = first.teamCode.localeCompare(second.teamCode, undefined, { numeric: true });
      }
      return descending ? -comparison : comparison;
    });

  return (
    <AdminShell admin={admin}>
      <h1 className="text-3xl font-bold">Teams</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {filtered.length} of {teams.length} teams
      </p>
      <CreateTeamForm readOnly={admin.role === "viewer"} />
      <ImportTeamsForm readOnly={admin.role === "viewer"} />
      <form className="panel mt-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4" method="get">
        <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
          Search teams
          <input
            className="mt-1 block min-w-0 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm text-foreground"
            defaultValue={q}
            name="q"
            placeholder="Code, team, member or email"
          />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Team status
          <select
            className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
            defaultValue={status}
            name="status"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Submission
          <select
            className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
            defaultValue={submission}
            name="submission"
          >
            <option value="">All submissions</option>
            <option value="submitted">Submitted</option>
            <option value="not-submitted">Not submitted</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Problem statement
          <select
            className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
            defaultValue={problem}
            name="problem"
          >
            <option value="">All teams</option>
            <option value="drawn">Drawn</option>
            <option value="not-drawn">Not drawn</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          First login
          <select
            className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
            defaultValue={login}
            name="login"
          >
            <option value="">All teams</option>
            <option value="completed">Completed</option>
            <option value="not-completed">Not completed</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Sort by
          <select
            className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
            defaultValue={sort}
            name="sort"
          >
            <option value="teamCode">Team code</option>
            <option value="teamName">Team name</option>
            <option value="status">Team status</option>
            <option value="login">First login</option>
            <option value="problem">Problem statement</option>
            <option value="submission">Submission status</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Order
          <select
            className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
            defaultValue={order === "desc" ? "desc" : "asc"}
            name="order"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button className="border border-border px-5 py-2 font-semibold" type="submit">
            Apply filters
          </button>
          <a
            className="rounded-full px-4 py-2 text-sm font-semibold text-primary hover:underline"
            href="/admin/teams"
          >
            Clear
          </a>
        </div>
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
                  <span
                    className={
                      team.status === "active"
                        ? "rounded-full bg-success/15 px-2 py-1 text-xs font-bold text-success"
                        : "rounded-full bg-muted px-2 py-1 text-xs font-bold text-muted-foreground"
                    }
                  >
                    {team.status}
                  </span>
                  <br />
                  <span className="text-muted-foreground">
                    {team.firstLoginAt ? "First login complete" : "First login pending"}
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
