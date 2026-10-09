import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTeam } from "@/lib/auth.server";
import { ChangePasswordForm } from "./change-password-form";

export const runtime = "nodejs";

export default async function ChangePasswordPage() {
  const current = await getCurrentTeam({ allowPasswordChange: true });
  if (!current) redirect("/login");
  if (!current.mustChangePassword) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-hero circuit-bg px-6 py-10">
      <Link className="font-display text-sm font-extrabold" href="/">
        ADventure 2026
      </Link>
      <section className="panel mx-auto mt-16 max-w-md p-7 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          One quick security step
        </p>
        <h1 className="mt-3 text-3xl font-bold">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set a private password before accessing your team workspace.
        </p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
