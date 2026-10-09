import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTeam } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";

export const runtime = "nodejs";

export default async function TeamToolkitPage() {
  const current = await getCurrentTeam();
  if (!current) {
    const needsPasswordChange = await getCurrentTeam({ allowPasswordChange: true });
    redirect(needsPasswordChange ? "/change-password" : "/login");
  }
  const repo = getRepo();
  const tools = await repo.listTools();
  if (!current.team.toolkitViewedAt) {
    await repo.updateTeam(current.team.id, { toolkitViewedAt: new Date().toISOString() });
  }
  const categories = [...new Set(tools.map((tool) => tool.category))];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link className="text-sm font-semibold text-primary" href="/dashboard">
        ← Team workspace
      </Link>
      <h1 className="mt-5 text-4xl font-bold">AI toolkit</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Use the tools below to explore ideas, generate creative assets and shape your advertisement.
        Tool availability is managed by event staff.
      </p>
      {categories.map((category) => (
        <section className="mt-9" key={category}>
          <h2 className="text-2xl font-bold">{category}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools
              .filter((tool) => tool.category === category)
              .map((tool) => (
                <article className="panel p-5" key={tool.id}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold">{tool.name}</h3>
                    {tool.recommended && (
                      <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
                  <a
                    className="mt-4 inline-flex font-semibold text-primary underline-offset-4 hover:underline"
                    href={tool.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open tool ↗
                  </a>
                </article>
              ))}
          </div>
        </section>
      ))}
      {tools.length === 0 && (
        <p className="panel mt-8 p-6 text-muted-foreground">
          The organizer has not enabled any tools yet.
        </p>
      )}
    </main>
  );
}
