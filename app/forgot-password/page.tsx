import Link from "next/link";
import { ForgotPasswordForm } from "./reset-form";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-hero circuit-bg px-6 py-10">
      <Link className="font-display text-sm font-extrabold" href="/">
        ADventure 2026
      </Link>
      <section className="panel mx-auto mt-16 max-w-md p-7 sm:p-9">
        <h1 className="text-3xl font-bold">Reset your password</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter your team email. If it matches an active account, a single-use reset link will be
          sent.
        </p>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
