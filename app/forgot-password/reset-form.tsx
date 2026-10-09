"use client";

import { useState, type FormEvent } from "react";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/team/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) setError(result.error || "Unable to request a reset.");
      else setMessage(result.message || "If the account exists, reset instructions will be sent.");
    } catch {
      setError("Unable to reach the reset service. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={submit}>
      <label className="block text-sm font-semibold" htmlFor="email">
        Team email
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3"
          id="email"
          name="email"
          required
          type="email"
        />
      </label>
      {message && (
        <p className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm" role="status">
          {message}
        </p>
      )}
      {error && (
        <p
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Requesting…" : "Send reset link"}
      </button>
    </form>
  );
}
