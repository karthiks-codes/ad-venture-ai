import "server-only";
// Explicit, idempotent seeding. Only ever invoked by scripts/seed-mongo.ts (never at app runtime).
import type { Repo } from "./types";
import { DEMO_TEAMS, DEMO_TOOLS } from "./seed-data";
import { hashPassword } from "@/lib/password.server";

export function assertSeedAllowed(env: Record<string, string | undefined>, argv: string[]): void {
  if (!argv.includes("--confirm"))
    throw new Error("Refusing to seed: pass --confirm to write demo data.");
  const prodLike =
    env["NODE_ENV"] === "production" ||
    env["VERCEL_ENV"] === "production" ||
    /prod/i.test(env["MONGODB_DB_NAME"] ?? "");
  if (prodLike && env["SEED_ALLOW_PRODUCTION"] !== "true")
    throw new Error(
      "Refusing to seed a production-like database. Set SEED_ALLOW_PRODUCTION=true if you really mean it.",
    );
}

export type SeedResult = { teamsCreated: string[]; teamsSkipped: string[]; toolsUpserted: number };

/** Inserts demo teams that don't exist yet (by teamCode); upserts sample tools by id. Safe to re-run. */
export async function seedDemo(
  repo: Repo,
  passwords: Readonly<Record<string, string>>,
): Promise<SeedResult> {
  const res: SeedResult = { teamsCreated: [], teamsSkipped: [], toolsUpserted: 0 };
  for (const d of DEMO_TEAMS) {
    if (await repo.findTeamByLogin(d.teamCode)) {
      res.teamsSkipped.push(d.teamCode);
      continue;
    }
    const password = passwords[d.teamCode];
    if (!password || password.length < 16)
      throw new Error(`No secure temporary password was provided for ${d.teamCode}.`);
    await repo.createTeam({
      ...d,
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
      isDemo: true,
    });
    res.teamsCreated.push(d.teamCode);
  }
  const existing = new Set((await repo.listTools(true)).map((t) => t.id));
  for (const t of DEMO_TOOLS)
    if (!existing.has(t.id)) {
      await repo.upsertTool(t);
      res.toolsUpserted++;
    }
  await repo.getSettings(); // materialize settings doc
  await repo.log({ actor: "seed-script", action: "seed.demo", meta: { ...res } });
  return res;
}
