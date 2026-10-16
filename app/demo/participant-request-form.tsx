"use client";

import { useState, type FormEvent } from "react";

export function ParticipantDemoRequestForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/demo-access/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setError(result.error || "The demo link could not be sent.");
        return;
      }
      setMessage(result.message || "Check your inbox for a sign-in link.");
      formElement.reset();
    } catch {
      setError("Unable to reach the email service. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <label className="block text-sm font-semibold" htmlFor="participant-demo-email">
        Email address
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3"
          id="participant-demo-email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>
      {error ? (
        <p
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm" role="status">
          {message}
        </p>
      ) : null}
      <button
        className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Sending link…" : "Email me a demo link"}
      </button>
    </form>
  );
}
