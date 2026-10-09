// Pure repository-selection policy (unit tested). No silent fallback to memory.
export type RepoChoice =
  | { kind: "mongodb"; uri: string; dbName: string }
  | { kind: "memory" }
  | { kind: "error"; message: string };

export function chooseRepo(env: Record<string, string | undefined>): RepoChoice {
  const demo = env["DEMO_MODE"] === "true";
  const uri = env["MONGODB_URI"]?.trim();
  if (demo) {
    if (env["NODE_ENV"] === "production" && env["ALLOW_DEMO_IN_PRODUCTION"] !== "true")
      return { kind: "error", message: "DEMO_MODE=true is not allowed in production." };
    return { kind: "memory" };
  }
  if (!uri) return { kind: "error", message: "MONGODB_URI is not configured. Set it, or set DEMO_MODE=true for local demo." };
  const dbName = env["MONGODB_DB_NAME"]?.trim();
  if (!dbName) return { kind: "error", message: "MONGODB_DB_NAME is not configured." };
  return { kind: "mongodb", uri, dbName };
}
