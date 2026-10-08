import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Clock, MapPin, Sparkles, Users } from "lucide-react";
import hero from "@/assets/hero-product.jpg";
import { CRITERIA, EVENT, STEPS, TIMELINE } from "@/config/event";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ADventure 2026 — One Product. Endless Possibilities." },
      { name: "description", content: "AI advertising competition at BVRIT Hyderabad Innovation Day, 13 Oct 2026." },
      { property: "og:title", content: "ADventure 2026 — AI Ad Competition" },
      { property: "og:description", content: "Draw a product, create an AI-powered ad, submit and present. 13 Oct 2026, PB-G3/G4." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-hero circuit-bg">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
          <div className="animate-rise">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">{EVENT.umbrella} · {EVENT.department}</p>
            <h1 className="mt-4 text-5xl font-black md:text-7xl"><span className="text-gradient">AD</span>venture</h1>
            <p className="mt-4 text-xl text-muted-foreground">{EVENT.tagline}</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex gap-2"><Calendar className="h-4 w-4 text-primary" />{EVENT.dateLabel}</li>
              <li className="flex gap-2"><Clock className="h-4 w-4 text-primary" />{EVENT.timeLabel}</li>
              <li className="flex gap-2"><MapPin className="h-4 w-4 text-primary" />{EVENT.venue}</li>
              <li className="flex gap-2"><Users className="h-4 w-4 text-primary" />Teams of {EVENT.teamSize}</li>
            </ul>
            <p className="mt-6 max-w-md text-muted-foreground">Receive a product, conceptualize an ad, create it with AI, edit a short video, submit — and pitch it to the jury.</p>
          </div>
          <img src={hero} alt="Glowing eco sneaker on a studio pedestal" width={1536} height={1024} className="rounded-2xl glow-border" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">How it works</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s} className="panel p-5"><span className="font-display text-2xl text-gradient">0{i + 1}</span><p className="mt-2">{s}</p></li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="flex items-center gap-2 text-3xl font-bold"><Sparkles className="text-accent" />Evaluation criteria</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {CRITERIA.map((c) => (<div key={c.key} className="panel p-5"><h3 className="text-sm font-bold">{c.title}</h3><p className="mt-2 text-sm text-muted-foreground">{c.desc}</p></div>))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Event timeline</h2>
        <ul className="mt-8 divide-y panel">
          {TIMELINE.map((t) => (<li key={t.time} className="flex gap-6 px-5 py-4"><span className="w-20 font-semibold text-primary">{t.time}</span>{t.label}</li>))}
        </ul>
      </section>

      <footer className="border-t px-6 py-10 text-center text-sm text-muted-foreground">
        {EVENT.organizer} · {EVENT.department} · {EVENT.umbrella} {EVENT.year}
      </footer>
    </main>
  );
}
