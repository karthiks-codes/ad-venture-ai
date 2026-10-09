"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AiDeclaration, AiTool } from "@/lib/db/types";

export function AiDeclarationForm({
  tools,
  declaration,
}: {
  tools: AiTool[];
  declaration: AiDeclaration | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/team/ai-declaration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolIds: form.getAll("toolIds"),
          description: form.get("description"),
          rulesConfirmed: form.get("rulesConfirmed") === "on",
          originalityConfirmed: form.get("originalityConfirmed") === "on",
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(result.error || "Unable to save your declaration.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Unable to reach the declaration service. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={submit}>
      <label className="block text-sm font-semibold" htmlFor="toolIds">
        AI tools used (select all that apply)
        <select
          className="mt-2 min-h-36 w-full rounded-xl border border-input bg-background px-4 py-3"
          defaultValue={declaration?.toolIds ?? []}
          id="toolIds"
          multiple
          name="toolIds"
          required
        >
          {tools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.name} · {tool.category}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold" htmlFor="description">
        How did AI contribute to your advertisement?
        <textarea
          className="mt-2 min-h-32 w-full rounded-xl border border-input bg-background px-4 py-3"
          defaultValue={declaration?.description ?? ""}
          id="description"
          maxLength={2000}
          minLength={20}
          name="description"
          required
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          defaultChecked={declaration?.rulesConfirmed ?? false}
          name="rulesConfirmed"
          required
          type="checkbox"
        />
        <span>We confirm our submission follows the event rules.</span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          defaultChecked={declaration?.originalityConfirmed ?? false}
          name="originalityConfirmed"
          required
          type="checkbox"
        />
        <span>We confirm the work is original or uses material with appropriate rights.</span>
      </label>
      {error && (
        <p
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm" role="status">
          Your AI declaration has been saved.
        </p>
      )}
      <button
        className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60"
        disabled={pending || tools.length === 0}
        type="submit"
      >
        {pending ? "Saving…" : declaration ? "Update declaration" : "Save AI declaration"}
      </button>
    </form>
  );
}
