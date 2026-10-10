import Link from "next/link";
import { SiteHeader } from "../_components/site-header";

const rules = [
  [
    "Team format",
    "Each registered team has two members. Only the pre-created team account may access its challenge and submission.",
  ],
  [
    "The challenge",
    "Your product statement is allocated to your team. Do not share unrevealed team challenges with other participants.",
  ],
  [
    "AI is part of the process",
    "Use AI tools to support ideation and ad creation. Your team remains responsible for the concept, claims, editing and final work.",
  ],
  [
    "Originality and rights",
    "Use original work or material you have permission to use. Do not use copyrighted music, images, logos or a real person’s likeness without authorization.",
  ],
  [
    "Final video",
    "Submit one final video through the team workspace before the configured deadline. The server checks the event window, allowed format and maximum size.",
  ],
  [
    "Submissions and judging",
    "Teams submit their final advertisement through the team workspace; there are no presentations to the jury. The jury will review submissions later, and winners and prize distribution will be announced after judging.",
  ],
];

export default function RulesPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">ADventure 2026</p>
        <h1 className="mt-3 text-4xl font-bold">Rules of the challenge</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          A fair creative sprint starts with clear expectations. Review these points before ideation
          begins.
        </p>
        <div className="mt-9 space-y-4">
          {rules.map(([title, text], index) => (
            <section className="panel p-5 sm:p-6" key={title}>
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                Rule {index + 1}
              </p>
              <h2 className="mt-2 text-xl font-bold">{title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          If event staff announce a more specific instruction on the day, follow that instruction.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground"
          href="/login"
        >
          Continue to team login
        </Link>
      </section>
    </main>
  );
}
