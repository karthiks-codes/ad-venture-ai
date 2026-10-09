// Usage: bun run db:seed -- --confirm
import { assertSeedAllowed, seedDemo } from "../src/lib/db/seed";
import { mongoRepoFromEnv } from "./_mongo";

assertSeedAllowed(process.env, process.argv);
const { repo, db } = await mongoRepoFromEnv();
const r = await seedDemo(repo);
console.log(`Seeded database "${db.databaseName}":`, r);
process.exit(0);
