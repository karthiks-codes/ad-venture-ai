// Fair allocation: choose among the problems with the FEWEST current assignments
// that still have capacity; break ties with a server-provided random number.
// Pure function → trivially unit-testable. Persistence layer guarantees atomicity.
export type AllocationInput = {
  problems: { id: string; assignmentId?: string; capacity: number }[];
  counts: Record<string, number>;
  random: () => number; // must be server-side randomness (crypto)
};

export function assignmentCount(
  problem: { id: string; assignmentId?: string },
  counts: Record<string, number>,
): number {
  const assignmentId = problem.assignmentId ?? problem.id;
  return (
    (counts[assignmentId] ?? 0) + (assignmentId === problem.id ? 0 : (counts[problem.id] ?? 0))
  );
}

export function pickProblem({ problems, counts, random }: AllocationInput): string | null {
  const open = problems.filter((p) => assignmentCount(p, counts) < p.capacity);
  if (open.length === 0) return null;
  const min = Math.min(...open.map((p) => assignmentCount(p, counts)));
  const candidates = open.filter((p) => assignmentCount(p, counts) === min);
  const idx = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  const selected = candidates[idx]!;
  return selected.assignmentId ?? selected.id;
}

export function cryptoRandom(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0]! / 2 ** 32;
}
