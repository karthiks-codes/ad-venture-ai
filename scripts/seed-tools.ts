// Usage: npm run db:seed-tools -- --confirm
import { createRequire } from "node:module";
import { assertSeedAllowed, seedTools } from "../src/lib/db/seed";
import { mongoRepoFromEnv } from "./_mongo";

const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as typeof import("@next/env");
loadEnvConfig(process.cwd());
assertSeedAllowed(process.env, process.argv);
const { repo, close } = await mongoRepoFromEnv();
try {
  const toolsUpserted = await seedTools(repo);
  console.log(`Upserted and verified ${toolsUpserted} sample tools in MongoDB.`);
} finally {
  await close();
}
