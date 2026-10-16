"use client";

import { useState, type FormEvent } from "react";

export function AdminDemoRequestForm() {
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
      const response = await fetch("/api/demo-access/admin-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
        }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setError(result.error || "Your request could not be sent.");
        return;
      }
      setMessage(result.message || "Your request was sent.");
      formElement.reset();
    } catch {
      setError("Unable to send your request. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <label className="block text-sm font-semibold" htmlFor="admin-demo-name">
        Name
        <input
          autoComplete="name"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3"
          id="admin-demo-name"
          maxLength={120}
          name="name"
          required
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="admin-demo-email">
        Email address
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3"
          id="admin-demo-email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="admin-demo-message">
        What would you like to see?
        <textarea
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3"
          id="admin-demo-message"
          maxLength={1000}
          minLength={10}
          name="message"
          required
          rows={3}
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
        className="w-full rounded-xl border border-primary px-5 py-3 font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Sending request…" : "Request an admin demo"}
      </button>
      <p className="text-xs text-muted-foreground">
        This sends a request to the platform owner. It does not grant admin access.
      </p>
    </form>
  );
}
