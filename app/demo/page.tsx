import Link from "next/link";
import { AdminDemoRequestForm } from "./admin-request-form";
import { ParticipantDemoRequestForm } from "./participant-request-form";

export default function DemoAccessPage() {
  return (
    <main className="min-h-screen bg-hero circuit-bg px-6 py-12">
      <Link className="font-display text-sm font-extrabold" href="/">
        <span className="text-gradient">AD</span>venture 2026
      </Link>
      <section className="mx-auto mt-12 max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          Explore ADventure
        </p>
        <h1 className="mt-3 text-4xl font-bold">Request a demo</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Try the participant workspace with an email sign-in link, or ask the platform
          administrators for a guided look at the admin experience.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="panel p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Participant workspace</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A one-time email link opens an isolated participant demo for up to two hours. Problem
              draws and declarations are temporary; video uploads are disabled.
            </p>
            <ParticipantDemoRequestForm />
          </section>
          <section className="panel p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Admin experience</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send the administrators a request to arrange a guided demo of the admin experience.
            </p>
            <AdminDemoRequestForm />
          </section>
        </div>
      </section>
    </main>
  );
}
