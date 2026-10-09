"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CreateTeamForm({ readOnly }: { readOnly: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setMessage("");
    setPending(true);
    const data = new FormData(form);
    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamCode: data.get("teamCode"),
          teamName: data.get("teamName"),
          member1Name: data.get("member1Name"),
          member2Name: data.get("member2Name"),
          email: data.get("email"),
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        teamCode?: string;
        emailSent?: boolean;
        error?: string;
      };
      if (!response.ok) {
        setError(result.error || "Team could not be created.");
        return;
      }
      setMessage(
        result.emailSent
          ? `Team ${result.teamCode} was created and its credential email was accepted by Resend.`
          : `Team ${result.teamCode} was created but remains inactive because its credential email was not delivered.`,
      );
      form.reset();
      router.refresh();
    } catch {
      setError("Unable to reach the team-management service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="panel grid gap-4 p-5 sm:grid-cols-2" onSubmit={submit}>
      <h2 className="text-xl font-bold sm:col-span-2">Create a team account</h2>
      <label className="text-sm font-semibold">
        Team code
        <input
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
          name="teamCode"
          required
        />
      </label>
      <label className="text-sm font-semibold">
        Team name
        <input
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
          name="teamName"
          required
        />
      </label>
      <label className="text-sm font-semibold">
        Member 1
        <input
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
          name="member1Name"
          required
        />
      </label>
      <label className="text-sm font-semibold">
        Member 2
        <input
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
          name="member2Name"
          required
        />
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        Team email
        <input
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
          name="email"
          required
          type="email"
        />
      </label>
      {error && (
        <p className="text-sm text-destructive sm:col-span-2" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-success sm:col-span-2" role="status">
          {message}
        </p>
      )}
      <button
        className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
        disabled={readOnly || pending}
        type="submit"
      >
        {pending ? "Creating…" : "Create team and email credentials"}
      </button>
    </form>
  );
}
