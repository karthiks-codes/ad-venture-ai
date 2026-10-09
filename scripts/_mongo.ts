// Shared helper for CLI scripts: connects ONLY to MongoDB (never memory).
import { connectMongo, createMongoRepo } from "../src/lib/db/mongo.server";

export async function mongoRepoFromEnv() {
  const uri = process.env["MONGODB_URI"];
  const dbName = process.env["MONGODB_DB_NAME"];
  if (!uri || !dbName) throw new Error("MONGODB_URI and MONGODB_DB_NAME must be set.");
  const db = await connectMongo(uri, dbName);
  return { db, repo: createMongoRepo(async () => db), close: () => (db as unknown as { client: { close(): Promise<void> } }).client.close() };
}
