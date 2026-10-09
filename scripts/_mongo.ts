// Shared helper for CLI scripts: connects ONLY to MongoDB (never memory).
import { createRequire } from "node:module";
import { connectMongo, createMongoRepo } from "../src/lib/db/mongo.server";

const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as typeof import("@next/env");

export async function mongoRepoFromEnv() {
  loadEnvConfig(process.cwd());
  const uri = process.env["MONGODB_URI"];
  const dbName = process.env["MONGODB_DB_NAME"];
  if (!uri || !dbName) throw new Error("MONGODB_URI and MONGODB_DB_NAME must be set.");
  const db = await connectMongo(uri, dbName);
  return { db, repo: createMongoRepo(async () => db), close: () => db.client.close() };
}
