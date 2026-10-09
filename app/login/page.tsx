import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-hero circuit-bg px-6 py-10">
      <Link className="font-display text-sm font-extrabold" href="/">
        <span className="text-gradient">AD</span>venture 2026
      </Link>
      <section className="panel mx-auto mt-16 max-w-md p-7 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          Your creative challenge awaits
        </p>
        <h1 className="mt-3 text-3xl font-bold">Team login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in using the credentials sent by your organizers.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
