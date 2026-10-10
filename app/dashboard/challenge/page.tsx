import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTeam } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { getProblem } from "@/config/problems";
import { DrawButton } from "../draw-button";

export const runtime = "nodejs";

export default async function ChallengePage() {
  const current = await getCurrentTeam();
  if (!current) {
    const needsPasswordChange = await getCurrentTeam({ allowPasswordChange: true });
    redirect(needsPasswordChange ? "/change-password" : "/login");
  }
  if (!current.team.problemId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link className="text-sm font-semibold text-primary" href="/dashboard">
          ← Team workspace
        </Link>
        <section className="panel mt-6 p-7">
          <h1 className="text-3xl font-bold">Your challenge is waiting</h1>
          <p className="mt-3 text-muted-foreground">
            When your team is ready, draw a problem statement. The assignment is permanent for your
            team.
          </p>
          <div className="mt-6">
            <DrawButton />
          </div>
        </section>
      </main>
    );
  }

  const problem = getProblem(current.team.problemId);
  if (!problem) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Challenge unavailable</h1>
        <p className="mt-3 text-muted-foreground">
          Please contact event staff to check your assignment.
        </p>
      </main>
    );
  }
  await getRepo().updateTeam(current.team.id, {
    challengeViewedAt: current.team.challengeViewedAt ?? new Date().toISOString(),
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link className="text-sm font-semibold text-primary" href="/dashboard">
        ← Team workspace
      </Link>
      <section className="panel mt-6 p-7 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          Your assigned brief · {problem.code}
        </p>
        <h1 className="mt-3 text-4xl font-bold">{problem.title}</h1>
        <p className="mt-3 text-xl text-accent">{problem.hook}</p>
        <p className="mt-6 leading-relaxed text-muted-foreground">{problem.description}</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="font-bold">Advertising mission</h2>
            <p className="mt-2 text-sm text-muted-foreground">{problem.objective}</p>
          </div>
          <div>
            <h2 className="font-bold">Target audience</h2>
            <p className="mt-2 text-sm text-muted-foreground">{problem.targetAudience}</p>
          </div>
          <div>
            <h2 className="font-bold">Unique selling proposition</h2>
            <p className="mt-2 text-sm text-muted-foreground">{problem.sellingProposition}</p>
          </div>
          <div>
            <h2 className="font-bold">Recommended duration</h2>
            <p className="mt-2 text-sm text-muted-foreground">{problem.duration}</p>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="font-bold">Required elements and constraints</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {problem.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        </div>
        <div className="mt-8">
          <h2 className="font-bold">Creative angles to explore</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {problem.angles.map((angle) => (
              <li key={angle}>{angle}</li>
            ))}
          </ul>
        </div>
        <Link
          className="mt-8 inline-flex rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground"
          href="/dashboard/ai-toolkit"
        >
          Need help?
        </Link>
      </section>
    </main>
  );
}
