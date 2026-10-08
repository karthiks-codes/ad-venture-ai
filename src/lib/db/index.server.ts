import type { Repo } from "./types";
import { createMemoryRepo } from "./memory.server";

const g = globalThis as unknown as { __adventureRepo?: Repo };

export function isDemoMode(): boolean {
  return !process.env["MONGODB_URI"] || process.env["DEMO_MODE"] === "true";
}

export function getRepo(): Repo {
  if (!g.__adventureRepo) {
    if (!isDemoMode()) {
      // TODO(mongo): return createMongoRepo() — see ./mongo.server.ts
      console.warn("[adventure] MONGODB_URI set but Mongo adapter not yet implemented; using demo store.");
    }
    g.__adventureRepo = createMemoryRepo();
  }
  return g.__adventureRepo;
}
