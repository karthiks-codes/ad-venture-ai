// Usage: npm run db:smoke — writes, reads back, and deletes a uniquely named document.
import { mongoRepoFromEnv } from "./_mongo";

const { db, repo, close } = await mongoRepoFromEnv();
const id = `smoke-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const c = db.collection<{ _id: string; at: Date }>("_smoke");
let failure: unknown;
try {
  await c.insertOne({ _id: id, at: new Date() });
  const found = await c.findOne({ _id: id });
  if (!found || found._id !== id)
    throw new Error("MongoDB did not return the temporary smoke-test document.");
  const health = await repo.health();
  if (health.status !== "connected") throw new Error("MongoDB health check failed.");
  console.log({ database: db.databaseName, readBack: true, health: health.status });
} catch (error) {
  failure = error;
}

try {
  await c.deleteOne({ _id: id });
  const remaining = await c.findOne({ _id: id });
  if (remaining) throw new Error("Smoke-test cleanup failed; temporary document remains.");
} catch (error) {
  failure ??= error;
} finally {
  await close();
}

if (failure) throw failure;
console.log("MongoDB smoke test passed; temporary record removed.");
