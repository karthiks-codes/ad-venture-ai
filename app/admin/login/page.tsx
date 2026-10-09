import Link from "next/link";

const errors: Record<string, string> = {
  "oauth-unconfigured": "Google OAuth is not configured for this deployment.",
  "oauth-denied": "Google sign-in was cancelled or denied.",
  "oauth-state": "Sign-in expired or could not be verified. Start again.",
  "oauth-token": "Google could not complete sign-in. Try again.",
  "oauth-identity": "Google did not return a verified account identity.",
  "not-authorized": "This Google account is not an active ADventure administrator.",
  "oauth-unavailable": "Administrator sign-in is temporarily unavailable.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen bg-hero circuit-bg px-6 py-12">
      <Link className="font-display font-extrabold" href="/">
        ADventure 2026
      </Link>
      <section className="panel mx-auto mt-20 max-w-md p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Organizer access</p>
        <h1 className="mt-3 text-3xl font-bold">Administrator sign-in</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Use Google to authenticate. Access is granted only when your verified account has an
          active administrator record.
        </p>
        {error && (
          <p
            className="mt-5 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {errors[error] || "Sign-in could not be completed."}
          </p>
        )}
        <a
          className="mt-7 inline-flex w-full justify-center rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground"
          href="/api/auth/admin/google"
        >
          Continue with Google
        </a>
        <p className="mt-4 text-xs text-muted-foreground">
          If you are an organizer and do not have access, ask the system owner to bootstrap your
          admin record.
        </p>
      </section>
    </main>
  );
}
