"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DrawButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function draw() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/team/problem/draw", { method: "POST" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error || "Unable to draw a challenge.");
        return;
      }
      router.push("/dashboard/challenge");
      router.refresh();
    } catch {
      setError("Unable to reach the allocation service. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        className="rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60"
        disabled={pending}
        onClick={draw}
        type="button"
      >
        {pending ? "Drawing your challenge…" : "Draw problem statement"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
