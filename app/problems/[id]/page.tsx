import Link from "next/link";
import { notFound } from "next/navigation";
import { getProblem } from "@/config/problems";
import { ProblemVisualCues } from "../../_components/problem-visual-cues";
import { SiteHeader } from "../../_components/site-header";

export default async function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problem = getProblem(id);
  if (!problem) notFound();

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-6 py-12">
        <Link className="text-sm font-semibold text-primary" href="/problems">
          ← All product challenges
        </Link>
        <section className="panel mt-6 p-7 sm:p-9">
          {problem.archived && (
            <p className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
              This brief belongs to a previous ADventure statement set and remains available for
              teams with an existing assignment.
            </p>
          )}
          <p className="text-sm font-bold uppercase tracking-widest text-primary">{problem.code}</p>
          <h1 className="mt-3 text-4xl font-bold">{problem.title}</h1>
          <p className="mt-3 text-xl text-accent">{problem.summary}</p>
          <p className="mt-6 leading-relaxed text-muted-foreground">{problem.description}</p>
          <ProblemVisualCues images={problem.visualCues} />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <section>
              <h2 className="font-bold">Target audience</h2>
              <p className="mt-2 text-sm text-muted-foreground">{problem.targetAudience}</p>
            </section>
            <section>
              <h2 className="font-bold">Key product benefit</h2>
              <p className="mt-2 text-sm text-muted-foreground">{problem.sellingProposition}</p>
            </section>
          </div>
          {problem.features?.length ? (
            <section className="mt-8">
              <h2 className="font-bold">Product features</h2>
              <ul className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {problem.features.map((feature) => (
                  <li className="rounded-lg bg-muted/50 p-3" key={feature}>
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {(problem.objective || problem.duration) && (
            <section className="mt-8 grid gap-6 sm:grid-cols-2">
              {problem.objective && (
                <div>
                  <h2 className="font-bold">Campaign objective</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{problem.objective}</p>
                </div>
              )}
              {problem.duration && (
                <div>
                  <h2 className="font-bold">Suggested duration</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{problem.duration}</p>
                </div>
              )}
            </section>
          )}
          {problem.constraints && (
            <section className="mt-8">
              <h2 className="font-bold">Brief constraints</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {problem.constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </section>
          )}
          {problem.angles && (
            <section className="mt-8">
              <h2 className="font-bold">Suggested creative angles</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {problem.angles.map((angle) => (
                  <li key={angle}>{angle}</li>
                ))}
              </ul>
            </section>
          )}
        </section>
      </article>
    </main>
  );
}
