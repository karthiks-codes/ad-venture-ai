"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReopenSubmissionButton({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function reopen() {
    const reason = window.prompt(
      "Explain why this finalized submission must be reopened (minimum 15 characters):",
    );
    if (reason === null) return;
    if (reason.trim().length < 15) {
      setError("Enter a clear reason with at least 15 characters.");
      return;
    }
    if (!window.confirm("This will allow the team to replace its final submission. Continue?"))
      return;
    setError("");
    setPending(true);
    try {
      const response = await fetch(`/api/admin/submissions/${teamId}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, confirmed: true }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error || "Submission could not be reopened.");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to reach the submission override service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        className="rounded-lg border border-warning px-3 py-1.5 text-xs font-semibold text-warning disabled:opacity-60"
        disabled={pending}
        onClick={reopen}
        type="button"
      >
        {pending ? "Reopening…" : "Reopen"}
      </button>
      {error && (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
