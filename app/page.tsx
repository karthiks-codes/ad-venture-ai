import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, Sparkles, UsersRound } from "lucide-react";
import { CRITERIA, EVENT, STEPS, TIMELINE } from "@/config/event";
import { SiteHeader } from "./_components/site-header";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative overflow-hidden bg-hero circuit-bg">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-rise">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              ADventure · Open creative challenge
            </p>
            <h1 className="mt-4 text-5xl font-black md:text-7xl">
              <span className="text-gradient">AD</span>venture
            </h1>
            <p className="mt-4 text-xl text-muted-foreground">{EVENT.tagline}</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="h-4 w-4 text-primary" />
                {EVENT.dateLabel}
              </li>
              <li className="flex items-center gap-2">
                <Clock3 aria-hidden="true" className="h-4 w-4 text-primary" />
                {EVENT.timeLabel}
              </li>
              <li className="flex items-center gap-2">
                <UsersRound aria-hidden="true" className="h-4 w-4 text-primary" />
                Team of {EVENT.teamSize}
              </li>
            </ul>
            <p className="mt-6 max-w-md text-muted-foreground">
              Receive a product, conceptualize an ad, create it with AI, edit a short video and
              submit. The jury will review submissions later; winners and prize distribution will be
              announced after judging.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
                href="/login"
              >
                Enter your team space
              </Link>
              <Link
                className="rounded-full border border-border px-6 py-3 font-semibold transition-colors hover:bg-muted"
                href="/rules"
              >
                Explore the rules
              </Link>
              <Link
                className="rounded-full border border-border px-6 py-3 font-semibold transition-colors hover:bg-muted"
                href="/demo"
              >
                Try a demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-bold uppercase tracking-widest text-accent">
          From product to submission
        </p>
        <h2 className="mt-2 text-3xl font-bold">Make something worth remembering.</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li className="panel p-5" key={step}>
              <span className="font-display text-2xl text-gradient">0{index + 1}</span>
              <p className="mt-2">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="flex items-center gap-2 text-3xl font-bold">
          <Sparkles aria-hidden="true" className="text-accent" />
          Evaluation criteria
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CRITERIA.map((criterion) => (
            <article className="panel p-5" key={criterion.key}>
              <h3 className="text-sm font-bold">{criterion.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{criterion.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Event timeline (Tentative)</h2>
        <ul className="mt-8 divide-y panel">
          {TIMELINE.map((item) => (
            <li className="flex gap-6 px-5 py-4" key={item.time}>
              <span className="w-20 shrink-0 font-semibold text-primary">{item.time}</span>
              {item.label}
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
        ADventure {EVENT.year} · A product-to-advertising challenge
      </footer>
    </main>
  );
}
