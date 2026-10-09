import { PROBLEMS } from "@/config/problems";
import { SiteHeader } from "../_components/site-header";

export default function ProblemsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          A new brief for every team
        </p>
        <h1 className="mt-3 text-4xl font-bold">Product challenges</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Teams draw one challenge from the event’s static problem set after signing in. These
          sample briefs show the kind of creative opportunity to expect; your assignment will be
          revealed only inside your team workspace.
        </p>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PROBLEMS.map((problem) => (
            <article className="panel flex flex-col p-6" key={problem.id}>
              <span className="text-xs font-bold tracking-widest text-primary">{problem.code}</span>
              <h2 className="mt-3 text-xl font-bold">{problem.title}</h2>
              <p className="mt-2 text-sm font-semibold text-accent">{problem.hook}</p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {problem.description}
              </p>
              <p className="mt-5 text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Audience: </span>
                {problem.targetAudience}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
