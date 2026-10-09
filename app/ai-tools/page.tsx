import Link from "next/link";
import { getRepo } from "@/lib/db/index.server";
import type { AiTool } from "@/lib/db/types";
import { SiteHeader } from "../_components/site-header";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AiToolsPage() {
  let tools: AiTool[];
  let unavailable = false;
  try {
    tools = await getRepo().listTools();
  } catch (error) {
    console.error(
      "[public-toolkit] Toolkit configuration unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    tools = [];
    unavailable = true;
  }

  const categories = [...new Set(tools.map((tool) => tool.category))];
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          A creative toolkit, not autopilot
        </p>
        <h1 className="mt-3 text-4xl font-bold">AI tools for your next big idea</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Explore the organizer-managed toolkit after you sign in. Use AI to amplify your team’s
          concept, then make the final creative decisions yourselves.
        </p>
        {unavailable ? (
          <div className="panel mt-8 p-6" role="status">
            <h2 className="font-bold">Toolkit configuration is unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect the application to MongoDB or enable local demo mode to load the current tool
              catalogue. Other public event pages remain available.
            </p>
          </div>
        ) : (
          <>
            {categories.map((category) => (
              <section className="mt-10" key={category}>
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
                No tools are currently enabled.
              </p>
            )}
          </>
        )}
        <Link
          className="mt-10 inline-flex rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground"
          href="/login"
        >
          Open your team toolkit
        </Link>
      </section>
    </main>
  );
}
