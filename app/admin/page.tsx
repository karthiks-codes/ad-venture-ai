import { redirect } from "next/navigation";
import { PROBLEMS } from "@/config/problems";
import { assignmentCount } from "@/lib/allocation";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { AdminShell } from "./_components/admin-shell";
import { AuditEvents } from "./audit-events";

export const runtime = "nodejs";

export default async function AdminOverviewPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const repo = getRepo();
  const [teams, submissions, logs, health, counts] = await Promise.all([
    repo.listTeams(),
    repo.listSubmissions(),
    repo.listLogs(8),
    repo.health(),
    repo.assignmentCounts(),
  ]);
  const submitted = submissions.filter((submission) => submission.status === "submitted").length;
  const cards = [
    ["Total teams", teams.length],
    ["Active teams", teams.filter((team) => team.status === "active").length],
    ["First logins", teams.filter((team) => team.firstLoginAt !== null).length],
    ["Problems assigned", teams.filter((team) => team.problemId !== null).length],
    ["Videos submitted", submitted],
    ["Pending videos", Math.max(0, teams.length - submitted)],
  ];

  return (
    <AdminShell admin={admin}>
      <p className="text-sm font-bold uppercase tracking-widest text-primary">Event operations</p>
      <h1 className="mt-2 text-3xl font-bold">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <article className="panel p-5" key={String(label)}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-xl font-bold">Allocation distribution</h2>
          <ul className="mt-4 space-y-3">
            {PROBLEMS.map((problem) => (
              <li className="flex justify-between gap-4 text-sm" key={problem.id}>
                <span>
                  {problem.code} · {problem.title}
                </span>
                <span className="font-bold">
                  {assignmentCount(problem, counts)} / {problem.capacity}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel p-6">
          <h2 className="text-xl font-bold">MongoDB health</h2>
          <p className="mt-3 text-sm">
            <span className={health.status === "connected" ? "text-success" : "text-warning"}>
              {health.status}
            </span>
            {health.latencyMs !== undefined ? ` · ${health.latencyMs} ms` : ""}
          </p>
          {health.message && <p className="mt-2 text-sm text-muted-foreground">{health.message}</p>}
        </section>
      </div>
      <section className="panel mt-7 p-6">
        <h2 className="text-xl font-bold">Recent audit events</h2>
        <AuditEvents initialLogs={logs} />
      </section>
    </AdminShell>
  );
}
