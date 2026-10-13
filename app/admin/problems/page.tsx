import { redirect } from "next/navigation";
import { PROBLEMS } from "@/config/problems";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { AdminShell } from "../_components/admin-shell";

export const runtime = "nodejs";

export default async function AdminProblemsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const counts = await getRepo().assignmentCounts();
  return (
    <AdminShell admin={admin}>
      <h1 className="text-3xl font-bold">Problem statements</h1>
      <p className="mt-2 text-muted-foreground">
        Brief content is static in the application. Assignment counts are live from MongoDB.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {PROBLEMS.map((problem) => (
          <article className="panel p-5" key={problem.id}>
            <p className="text-xs font-bold tracking-widest text-primary">
              {problem.code} · {counts[problem.id] ?? 0} / {problem.capacity} teams
            </p>
            <h2 className="mt-2 text-xl font-bold">{problem.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{problem.sellingProposition}</p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
