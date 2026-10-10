import Link from "next/link";
import { DEMO_TOOLS } from "@/lib/db/seed-data";
import { SiteHeader } from "../_components/site-header";

export default function AiToolsPage() {
  const tools = DEMO_TOOLS;
  const categories = [...new Set(tools.map((tool) => tool.category))];
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          AI-powered resources
        </p>
        <h1 className="mt-3 text-4xl font-bold">Need help?</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          The tools listed here are examples only, not a required or exclusive list. You are free to
          use any AI tools you choose; these links open the tools’ public websites in a new tab.
        </p>
        <aside className="panel mt-5 max-w-3xl border-primary/40 p-5" role="note">
          <h2 className="font-bold">You are not limited to these tools</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This is a sample toolkit to help you get started. All tools are optional—you may use
            other AI tools instead or alongside them.
          </p>
        </aside>
        {categories.map((category) => (
          <section className="mt-10" key={category}>
            <h2 className="text-2xl font-bold">{category}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools
                .filter((tool) => tool.category === category)
                .map((tool) => (
                  <a
                    className="panel block p-5 transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={tool.url}
                    key={tool.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold">{tool.name}</h3>
                      {tool.recommended && (
                        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
                    <span className="mt-4 inline-flex font-semibold text-primary">Open tool ↗</span>
                  </a>
                ))}
            </div>
          </section>
        ))}
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
