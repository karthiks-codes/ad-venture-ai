import type { Repo } from "./types";
import { PersistenceUnavailableError } from "./types";
import { chooseRepo } from "./select";
import { createMemoryRepo } from "./memory.server";
import { connectMongo, createMongoRepo } from "./mongo.server";

const g = globalThis as unknown as { __adventureRepo?: { key: string; repo: Repo } };

export function isDemoMode(): boolean {
  return chooseRepo(process.env).kind === "memory";
}

/**
 * Returns MongoRepo whenever MONGODB_URI (+ MONGODB_DB_NAME) is configured and DEMO_MODE !== "true".
 * Returns MemoryRepo ONLY when DEMO_MODE=true. Otherwise throws PersistenceUnavailableError (503).
 */
export function getRepo(): Repo {
  const choice = chooseRepo(process.env);
  if (choice.kind === "error") throw new PersistenceUnavailableError(choice.message);
  const key = choice.kind === "mongodb" ? `mongo:${choice.dbName}` : "memory";
  if (g.__adventureRepo?.key === key) return g.__adventureRepo.repo;
  const repo = choice.kind === "mongodb" ? createMongoRepo(() => connectMongo(choice.uri, choice.dbName)) : createMemoryRepo();
  g.__adventureRepo = { key, repo };
  return repo;
}
