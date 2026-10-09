import Link from "next/link";
import { ResetPasswordForm } from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const validToken = token.length >= 32 && token.length <= 128;
  return (
    <main className="min-h-screen bg-hero circuit-bg px-6 py-10">
      <Link className="font-display text-sm font-extrabold" href="/">
        ADventure 2026
      </Link>
      <section className="panel mx-auto mt-16 max-w-md p-7 sm:p-9">
        <h1 className="text-3xl font-bold">Choose a new password</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Reset links are single-use and expire after 30 minutes.
        </p>
        {validToken ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="mt-6 text-sm text-destructive" role="alert">
            The reset link is missing or malformed. Request a new link.
          </p>
        )}
      </section>
    </main>
  );
}
