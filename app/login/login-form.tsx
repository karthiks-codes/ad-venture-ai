"use client";

import { useEffect, useState, type ClipboardEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { parseTeamCredential } from "@/lib/team-credential";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("access");
    if (!token) return;

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setPending(true);
    void (async () => {
      try {
        const response = await fetch("/api/auth/team/magic-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const result = (await response.json()) as {
          ok?: boolean;
          mustChangePassword?: boolean;
          error?: string;
        };
        if (!response.ok) {
          setError(result.error || "This sign-in link is invalid or expired.");
          return;
        }
        router.replace(result.mustChangePassword ? "/change-password" : "/dashboard");
        router.refresh();
      } catch {
        setError("Unable to verify the sign-in link. Please try again.");
      } finally {
        setPending(false);
      }
    })();
  }, [router]);

  function handleCredentialPaste(event: ClipboardEvent<HTMLInputElement>) {
    const credential = parseTeamCredential(event.clipboardData.getData("text"));
    if (!credential) return;

    event.preventDefault();
    setIdentifier(credential.teamCode);
    setPassword(credential.password);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/team/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: form.get("identifier"),
          password: form.get("password"),
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        mustChangePassword?: boolean;
        error?: string;
      };
      if (!response.ok) {
        setError(result.error || "Unable to sign in.");
        return;
      }
      router.push(result.mustChangePassword ? "/change-password" : "/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach the login service. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={submit}>
      <label className="block text-sm font-semibold" htmlFor="identifier">
        Team code or email
        <input
          autoComplete="username"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3"
          id="identifier"
          name="identifier"
          onChange={(event) => setIdentifier(event.target.value)}
          onPaste={handleCredentialPaste}
          required
          value={identifier}
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="password">
        Password
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {error && (
        <p
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in securely…" : "Sign in to your team"}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Team accounts are created by the event organizers. Public registration is not available.
      </p>
    </form>
  );
}
