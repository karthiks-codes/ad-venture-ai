"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProblemStatement } from "@/config/problems";

export function TeamActions({
  teamId,
  teamCode,
  status,
  problemId,
  problems,
  readOnly,
}: {
  teamId: string;
  teamCode: string;
  status: "active" | "inactive";
  problemId: string | null;
  problems: ProblemStatement[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [problem, setProblem] = useState(problemId ?? "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function request(path: string, method: string, body?: object) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setMessage(result.error || "Action could not be completed.");
        return;
      }
      setMessage("Saved.");
      router.refresh();
    } catch {
      setMessage("Unable to reach the admin service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-w-56 space-y-2">
      <button
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        disabled={readOnly || pending}
        onClick={() =>
          request(`/api/admin/teams/${teamId}/status`, "PUT", {
            status: status === "active" ? "inactive" : "active",
          })
        }
        type="button"
      >
        {status === "active" ? "Deactivate" : "Activate"}
      </button>
      <button
        className="ml-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        disabled={readOnly || pending}
        onClick={() => {
          if (window.confirm(`Issue a new temporary password to ${teamCode}?`))
            void request(`/api/admin/teams/${teamId}/credentials`, "POST");
        }}
        type="button"
      >
        Email credentials
      </button>
      <div className="flex gap-1">
        <select
          aria-label={`Problem assignment for ${teamCode}`}
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1 text-xs"
          disabled={readOnly || pending}
          onChange={(event) => setProblem(event.target.value)}
          value={problem}
        >
          <option value="">Unassigned</option>
          {problems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} · {item.title}
            </option>
          ))}
        </select>
        <button
          className="rounded-lg border border-border px-2 py-1 text-xs font-semibold disabled:opacity-50"
          disabled={readOnly || pending || !problem || problem === problemId}
          onClick={() => {
            if (
              window.confirm(
                `Confirm ${problemId ? "reassignment" : "assignment"} for ${teamCode}?`,
              )
            )
              void request(`/api/admin/teams/${teamId}/assignment`, "PUT", {
                problemId: problem,
                confirmed: true,
              });
          }}
          type="button"
        >
          Assign
        </button>
      </div>
      {message && (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
