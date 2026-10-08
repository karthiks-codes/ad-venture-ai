// Fair allocation: choose among the problems with the FEWEST current assignments
// that still have capacity; break ties with a server-provided random number.
// Pure function → trivially unit-testable. Persistence layer guarantees atomicity.
export type AllocationInput = {
  problems: { id: string; capacity: number }[];
  counts: Record<string, number>;
  random: () => number; // must be server-side randomness (crypto)
};

export function pickProblem({ problems, counts, random }: AllocationInput): string | null {
  const open = problems.filter((p) => (counts[p.id] ?? 0) < p.capacity);
  if (open.length === 0) return null;
  const min = Math.min(...open.map((p) => counts[p.id] ?? 0));
  const candidates = open.filter((p) => (counts[p.id] ?? 0) === min);
  const idx = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[idx]!.id;
}

export function cryptoRandom(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0]! / 2 ** 32;
}
