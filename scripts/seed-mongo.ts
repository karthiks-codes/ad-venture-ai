// Usage: npm run db:seed -- --confirm
import { randomBytes } from "node:crypto";
import { assertSeedAllowed, seedDemo } from "../src/lib/db/seed";
import { DEMO_TEAMS } from "../src/lib/db/seed-data";
import { mongoRepoFromEnv } from "./_mongo";

assertSeedAllowed(process.env, process.argv);
const passwords = Object.fromEntries(
  DEMO_TEAMS.map((team) => [team.teamCode, randomBytes(24).toString("base64url")]),
);
const { repo, db, close } = await mongoRepoFromEnv();
try {
  const result = await seedDemo(repo, passwords);
  console.log(`Seeded database "${db.databaseName}":`, result);
} finally {
  await close();
}
