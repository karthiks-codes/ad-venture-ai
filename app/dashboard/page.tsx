import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTeam } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { DrawButton } from "./draw-button";

export const runtime = "nodejs";

const sections = [
  ["Your challenge", "/dashboard/challenge"],
  ["AI toolkit", "/dashboard/ai-toolkit"],
  ["Final submission", "/dashboard/submission"],
  ["Team profile", "/dashboard/profile"],
] as const;

export default async function TeamDashboardPage() {
  const current = await getCurrentTeam();
  if (!current) {
    const passwordChangeRequired = await getCurrentTeam({ allowPasswordChange: true });
    redirect(passwordChangeRequired ? "/change-password" : "/login");
  }
  const repo = getRepo();
  const [declaration, submission] = await Promise.all([
    repo.getDeclaration(current.team.id),
    repo.getSubmission(current.team.id),
  ]);

  return (
    <main className="min-h-screen bg-hero circuit-bg">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link className="font-display font-extrabold" href="/">
            ADventure 2026
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {current.team.teamCode} · {current.team.teamName}
            </span>
            <form action="/api/auth/team/logout" method="post">
              <button className="text-sm font-semibold text-primary" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </nav>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Team workspace</p>
        <h1 className="mt-3 text-4xl font-bold">Let’s make a memorable ad.</h1>
        <p className="mt-3 text-muted-foreground">
          Your challenge and creative progress live here.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className="panel p-6">
            <h2 className="text-xl font-bold">Your product challenge</h2>
            {current.team.problemId ? (
              <p className="mt-3 text-muted-foreground">
                Your challenge is ready. Review the brief before planning your advertisement.
              </p>
            ) : (
              <>
                <p className="mt-3 text-muted-foreground">
                  Draw once to receive your team’s product brief. Your assignment cannot be changed
                  from the team workspace.
                </p>
                <div className="mt-5">
                  <DrawButton />
                </div>
              </>
            )}
          </section>
          <section className="panel p-6">
            <h2 className="text-xl font-bold">Competition progress</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {[
                ["Account active", current.team.status === "active"],
                ["Problem selected", Boolean(current.team.problemId)],
                ["Challenge reviewed", Boolean(current.team.challengeViewedAt)],
                ["AI toolkit explored", Boolean(current.team.toolkitViewedAt)],
                ["AI declaration", declaration !== null],
                ["Final submission", submission?.status === "submitted"],
              ].map(([label, done]) => (
                <li className="flex items-center gap-3" key={String(label)}>
                  <span
                    aria-label={done ? "Complete" : "Not complete"}
                    className={`h-2.5 w-2.5 rounded-full ${done ? "bg-success" : "bg-muted-foreground/40"}`}
                  />
                  {label}
                </li>
              ))}
            </ol>
          </section>
        </div>
        <nav aria-label="Team workspace" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map(([label, href]) => (
            <Link
              className="panel p-5 font-bold transition-colors hover:border-primary/60"
              href={href}
              key={href}
            >
              {label}
              <span className="ml-2 text-primary" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
