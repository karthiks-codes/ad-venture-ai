import { redirect } from "next/navigation";
import Link from "next/link";
import { getProblem, isLegacyProblem, PROBLEMS } from "@/config/problems";
import { assignmentCount } from "@/lib/allocation";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { AdminShell } from "../_components/admin-shell";

export const runtime = "nodejs";

export default async function AdminProblemsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const repo = getRepo();
  const [counts, teams] = await Promise.all([repo.assignmentCounts(), repo.listTeams()]);
  const legacyTeams = teams.filter((team) => isLegacyProblem(team.problemId));
  return (
    <AdminShell admin={admin}>
      <h1 className="text-3xl font-bold">Problem statements</h1>
      <p className="mt-2 text-muted-foreground">
        Current briefs are versioned in the application. Assignment counts are live from MongoDB.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {PROBLEMS.map((problem) => (
          <article className="panel p-5" key={problem.id}>
            <p className="text-xs font-bold tracking-widest text-primary">
              {problem.code} · {assignmentCount(problem, counts)} / {problem.capacity} teams
            </p>
            <h2 className="mt-2 text-xl font-bold">{problem.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{problem.sellingProposition}</p>
            {problem.features?.length ? (
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                {problem.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
      {legacyTeams.length > 0 && (
        <section className="panel mt-8 p-5">
          <h2 className="text-xl font-bold">Assignments from previous statements</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            These teams can still open their original briefs. Reassign them from the Teams page if
            they should draw from the current set.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {legacyTeams.map((team) => {
              const problem = getProblem(team.problemId);
              return (
                <li key={team.id}>
                  <Link
                    className="font-semibold text-primary hover:underline"
                    href={`/admin/teams?q=${encodeURIComponent(team.teamCode)}`}
                  >
                    {team.teamCode}
                  </Link>
                  {problem ? ` · ${problem.code} — ${problem.title}` : " · Unknown statement"}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </AdminShell>
  );
}
