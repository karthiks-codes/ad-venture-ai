import Link from "next/link";
import { notFound } from "next/navigation";
import { getProblem } from "@/config/problems";
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
          <p className="text-sm font-bold uppercase tracking-widest text-primary">{problem.code}</p>
          <h1 className="mt-3 text-4xl font-bold">{problem.title}</h1>
          <p className="mt-3 text-xl text-accent">{problem.summary}</p>
          <p className="mt-6 leading-relaxed text-muted-foreground">{problem.description}</p>
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
          <section className="mt-8">
            <h2 className="font-bold">Visual reference guidance</h2>
            <p className="mt-2 text-sm text-muted-foreground">{problem.visualReference}</p>
          </section>
        </section>
      </article>
    </main>
  );
}
