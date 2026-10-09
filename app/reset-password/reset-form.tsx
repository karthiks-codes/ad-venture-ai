"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/team/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.get("newPassword") }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(result.error || "Unable to reset your password.");
        return;
      }
      router.push("/login?reset=complete");
    } catch {
      setError("Unable to reach the reset service. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={submit}>
      <label className="block text-sm font-semibold" htmlFor="newPassword">
        New password (at least 12 characters)
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3"
          id="newPassword"
          minLength={12}
          name="newPassword"
          required
          type="password"
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
        className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
