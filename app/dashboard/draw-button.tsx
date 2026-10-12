"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProblemStatement } from "@/config/problems";

export function DrawButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [assignedProblem, setAssignedProblem] = useState<ProblemStatement | null>(null);
  const [error, setError] = useState("");

  async function draw() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = Date.now();
    setPending(true);
    setShuffling(!reducedMotion);
    setAssignedProblem(null);
    setError("");
    try {
      const response = await fetch("/api/team/problem/draw", { method: "POST" });
      const result = (await response.json()) as {
        error?: string;
        problem?: ProblemStatement;
      };
      if (!response.ok) {
        setError(result.error || "Unable to draw a challenge.");
        return;
      }
      if (!result.problem) {
        setError("The challenge was assigned, but its details could not be loaded.");
        return;
      }
      const remainingShuffleTime = Math.max(0, 1400 - (Date.now() - startedAt));
      if (!reducedMotion && remainingShuffleTime > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remainingShuffleTime));
      }
      setAssignedProblem(result.problem);
      setShuffling(false);
      if (!reducedMotion) await new Promise((resolve) => window.setTimeout(resolve, 1250));
      router.push("/dashboard/challenge");
      router.refresh();
    } catch {
      setError("Unable to reach the allocation service. Try again.");
    } finally {
      setShuffling(false);
      setPending(false);
    }
  }

  return (
    <div>
      {(shuffling || assignedProblem) && (
        <div aria-live="polite" className="mb-5" role="status">
          <div
            aria-hidden="true"
            className={`problem-card-deck ${shuffling ? "problem-card-shuffling" : ""} ${assignedProblem ? "problem-card-revealed" : ""}`}
          >
            <div className="problem-card problem-card-back problem-card-back-three" />
            <div className="problem-card problem-card-back problem-card-back-two" />
            <div className="problem-card problem-card-back problem-card-back-one" />
            <div className="problem-card problem-card-front">
              {assignedProblem ? (
                <>
                  <span className="problem-card-eyebrow">
                    Your assigned brief <span>{assignedProblem.code}</span>
                  </span>
                  <span className="problem-card-title">{assignedProblem.title}</span>
                  <span className="problem-card-caption">
                    ADventure 2026 · Problem statement draw
                  </span>
                </>
              ) : (
                <>
                  <span className="problem-card-emblem">A</span>
                  <span className="problem-card-eyebrow">ADventure 2026</span>
                  <span className="problem-card-title">Your brief is being drawn</span>
                  <span className="problem-card-caption">Shuffling challenge cards…</span>
                </>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {assignedProblem
              ? "Your problem statement is ready. Opening your brief…"
              : "A challenge is being selected for your team…"}
          </p>
        </div>
      )}
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
