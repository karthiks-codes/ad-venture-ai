// Usage: bun run db:smoke — writes, reads back, and deletes a uniquely named document.
import { mongoRepoFromEnv } from "./_mongo";

const { db, repo } = await mongoRepoFromEnv();
const id = `smoke-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const c = db.collection<{ _id: string; at: Date }>("_smoke");
await c.insertOne({ _id: id, at: new Date() });
const found = await c.findOne({ _id: id });
await c.deleteOne({ _id: id });
const gone = !(await c.findOne({ _id: id }));
const health = await repo.health();
console.log({ database: db.databaseName, wrote: id, readBack: Boolean(found), cleanedUp: gone, health });
if (!found || !gone || health.status !== "connected") { console.error("SMOKE TEST FAILED"); process.exit(1); }
console.log("SMOKE TEST PASSED");
process.exit(0);
