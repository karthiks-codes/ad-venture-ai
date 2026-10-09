// MongoDB Atlas repository — production persistence (official `mongodb` driver).
import { MongoClient, MongoServerError, type Db } from "mongodb";
import type { AiDeclaration, AiTool, Admin, AuditLog, NewTeam, Repo, ResetToken, Submission, Team } from "./types";
import { DuplicateError, PersistenceUnavailableError } from "./types";
import type { Settings } from "@/lib/submission-rules";
import { getProblem } from "@/config/problems";
import { settingsFromEnv } from "./defaults";

type WithId<T> = T & { _id: string };
const now = () => new Date().toISOString();
const strip = <T,>(d: WithId<T> | null): T | null => {
  if (!d) return null;
  const { _id, ...rest } = d as WithId<T> & Record<string, unknown>;
  return { id: _id, ...rest } as unknown as T;
};

// Cache the client on globalThis so serverless warm invocations and dev hot reloads reuse one pool.
const g = globalThis as unknown as { __advMongo?: { uri: string; db: string; promise: Promise<Db> } };

export async function connectMongo(uri: string, dbName: string): Promise<Db> {
  if (g.__advMongo && g.__advMongo.uri === uri && g.__advMongo.db === dbName) return g.__advMongo.promise;
  const promise = (async () => {
    const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000, appName: "ad-venture-ads" });
    await client.connect();
    const db = client.db(dbName);
    await ensureIndexes(db);
    return db;
  })();
  g.__advMongo = { uri, db: dbName, promise };
  try {
    return await promise;
  } catch (e) {
    g.__advMongo = undefined; // allow retry on next request; never fall back to memory
    throw new PersistenceUnavailableError(`MongoDB connection failed: ${(e as Error).message.split("\n")[0]}`);
  }
}

export async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("teams").createIndexes([
      { key: { teamCode: 1 }, unique: true, name: "teamCode_unique" },
      { key: { email: 1 }, unique: true, name: "email_unique" },
      { key: { problemId: 1 } },
      { key: { submissionStatus: 1 } },
      { key: { status: 1 } },
    ]),
    db.collection("admins").createIndexes([
      { key: { email: 1 }, unique: true, name: "admin_email_unique" },
      { key: { googleSub: 1 }, unique: true, partialFilterExpression: { googleSub: { $type: "string" } }, name: "admin_sub_unique" },
    ]),
    db.collection("teamAssignments").createIndexes([{ key: { teamId: 1 }, unique: true }, { key: { problemId: 1 } }]),
    db.collection("submissions").createIndexes([{ key: { teamId: 1 }, unique: true }, { key: { status: 1 } }]),
    db.collection("aiDeclarations").createIndexes([{ key: { teamId: 1 }, unique: true }]),
    db.collection("aiTools").createIndexes([{ key: { order: 1 } }, { key: { enabled: 1 } }]),
    db.collection("auditLogs").createIndexes([{ key: { at: -1 } }, { key: { teamCode: 1, at: -1 } }, { key: { action: 1, at: -1 } }]),
    db.collection("passwordResetTokens").createIndexes([
      { key: { tokenHash: 1 }, unique: true },
      { key: { expiresAtDate: 1 }, expireAfterSeconds: 0 },
    ]),
    db.collection("rateLimits").createIndexes([{ key: { key: 1, at: 1 } }, { key: { at: 1 }, expireAfterSeconds: 3600 }]),
  ]);
}

export function createMongoRepo(getDb: () => Promise<Db>): Repo {
  const col = async <T,>(name: string) => (await getDb()).collection<WithId<T>>(name);
  const teams = () => col<Omit<Team, "id">>("teams");

  return {
    kind: "mongodb",
    async health() {
      const t = Date.now();
      try {
        await (await getDb()).command({ ping: 1 });
        return { kind: "mongodb", status: "connected", latencyMs: Date.now() - t };
      } catch {
        return { kind: "mongodb", status: "error", message: "Database unreachable" };
      }
    },

    async listTeams() { return (await (await teams()).find().sort({ teamCode: 1 }).toArray()).map((d) => strip<Team>(d)!); },
    async getTeam(id) { return strip<Team>(await (await teams()).findOne({ _id: id })); },
    async findTeamByLogin(identifier) {
      const q = identifier.trim();
      return strip<Team>(await (await teams()).findOne({ $or: [{ teamCode: q.toUpperCase() }, { email: q.toLowerCase() }] }));
    },
    async createTeam(t: NewTeam) {
      const ts = now();
      const doc: WithId<Omit<Team, "id">> = {
        _id: crypto.randomUUID(),
        teamCode: t.teamCode.trim().toUpperCase(), teamName: t.teamName.trim(), member1Name: t.member1Name.trim(), member2Name: t.member2Name.trim(),
        email: t.email.trim().toLowerCase(), passwordHash: t.passwordHash, mustChangePassword: t.mustChangePassword ?? true,
        status: t.status ?? "active", firstLoginAt: null, lastLoginAt: null, problemId: null, assignedAt: null, assignedBy: null,
        submissionStatus: "none", toolkitViewedAt: null, challengeViewedAt: null, isDemo: t.isDemo ?? false, createdAt: ts, updatedAt: ts,
      };
      try { await (await teams()).insertOne(doc); } catch (e) {
        if (e instanceof MongoServerError && e.code === 11000) throw new DuplicateError("Team code or email already exists");
        throw e;
      }
      return strip<Team>(doc)!;
    },
    async updateTeam(id, patch) {
      const { id: _ignore, ...p } = patch;
      return strip<Team>(await (await teams()).findOneAndUpdate({ _id: id }, { $set: { ...p, updatedAt: now() } }, { returnDocument: "after" }));
    },
    async assignmentCounts() {
      const rows = await (await teams()).aggregate<{ _id: string; n: number }>([
        { $match: { problemId: { $ne: null } } }, { $group: { _id: "$problemId", n: { $sum: 1 } } },
      ]).toArray();
      return Object.fromEntries(rows.map((r) => [r._id, r.n]));
    },
    async assignProblemAtomic(teamId, choose, by, force) {
      const current = await this.getTeam(teamId);
      if (!current || (current.problemId && !force)) return null;
      const counts = await this.assignmentCounts();
      if (current.problemId) counts[current.problemId] = Math.max(0, (counts[current.problemId] ?? 1) - 1);
      const pid = choose(counts);
      if (!pid || !getProblem(pid)) return null;
      const ts = now();
      // Conditional update: only succeeds if problemId is still what we read (prevents double-draw races).
      const updated = await (await teams()).findOneAndUpdate(
        { _id: teamId, problemId: current.problemId },
        { $set: { problemId: pid, assignedAt: ts, assignedBy: by, updatedAt: ts } },
        { returnDocument: "after" },
      );
      if (!updated) return null;
      await (await col<Record<string, unknown>>("teamAssignments")).updateOne(
        { teamId }, { $set: { teamId, problemId: pid, assignedAt: ts, assignedBy: by }, $setOnInsert: { _id: crypto.randomUUID() } }, { upsert: true },
      );
      return strip<Team>(updated);
    },

    async getSubmission(teamId) { const d = await (await col<Submission>("submissions")).findOne({ teamId }); return d ? (({ _id, ...r }) => r)(d) : null; },
    async listSubmissions() { return (await (await col<Submission>("submissions")).find().toArray()).map(({ _id, ...r }) => r); },
    async beginSubmission(teamId, patch) {
      const c = await col<Submission>("submissions");
      try {
        const d = await c.findOneAndUpdate(
          { teamId, status: { $ne: "submitted" } },
          {
            $set: { driveFolderId: null, driveFileId: null, driveFileName: null, driveFileSize: null, driveWebViewLink: null, mimeType: null, uploadCompletedAt: null, ...patch, status: "uploading", uploadStartedAt: now() },
            $inc: { attempts: 1 }, $setOnInsert: { _id: crypto.randomUUID(), teamId },
          },
          { upsert: true, returnDocument: "after" },
        );
        return d ? (({ _id, ...r }) => r)(d) : null;
      } catch (e) {
        if (e instanceof MongoServerError && e.code === 11000) return null; // already submitted (unique teamId)
        throw e;
      }
    },
    async updateSubmission(teamId, patch) {
      const d = await (await col<Submission>("submissions")).findOneAndUpdate({ teamId }, { $set: patch }, { returnDocument: "after" });
      return d ? (({ _id, ...r }) => r)(d) : null;
    },

    async listTools(all) {
      return (await (await col<Omit<AiTool, "id">>("aiTools")).find(all ? {} : { enabled: true }).sort({ order: 1 }).toArray()).map((d) => strip<AiTool>(d)!);
    },
    async upsertTool(tool) {
      const { id, ...rest } = tool;
      await (await col<Omit<AiTool, "id">>("aiTools")).updateOne({ _id: id }, { $set: rest }, { upsert: true });
      return tool;
    },

    async getDeclaration(teamId) { const d = await (await col<AiDeclaration>("aiDeclarations")).findOne({ teamId }); return d ? (({ _id, ...r }) => r)(d) : null; },
    async saveDeclaration(d) {
      await (await col<AiDeclaration>("aiDeclarations")).updateOne({ teamId: d.teamId }, { $set: d, $setOnInsert: { _id: crypto.randomUUID() } }, { upsert: true });
    },

    async getSettings() {
      const c = await col<Settings>("eventSettings");
      const d = await c.findOne({ _id: "current" });
      if (d) { const { _id, ...s } = d; return s; }
      const s = settingsFromEnv(process.env);
      await c.updateOne({ _id: "current" }, { $setOnInsert: s }, { upsert: true });
      return s;
    },
    async updateSettings(patch) {
      await this.getSettings();
      const d = await (await col<Settings>("eventSettings")).findOneAndUpdate({ _id: "current" }, { $set: patch }, { returnDocument: "after" });
      const { _id, ...s } = d!; return s;
    },

    async findAdmin(q) {
      const or = [q.email ? { email: q.email.toLowerCase() } : null, q.googleSub ? { googleSub: q.googleSub } : null].filter(Boolean) as object[];
      if (!or.length) return null;
      return strip<Admin>(await (await col<Omit<Admin, "id">>("admins")).findOne({ $or: or }));
    },
    async listAdmins() { return (await (await col<Omit<Admin, "id">>("admins")).find().toArray()).map((d) => strip<Admin>(d)!); },
    async upsertAdmin(a) {
      const ts = now();
      const d = await (await col<Omit<Admin, "id">>("admins")).findOneAndUpdate(
        { email: a.email.toLowerCase() },
        { $set: { role: a.role, status: a.status, ...(a.name !== undefined && { name: a.name }), updatedAt: ts },
          $setOnInsert: { _id: crypto.randomUUID(), email: a.email.toLowerCase(), googleSub: a.googleSub ?? null, lastLoginAt: null, createdAt: ts, ...(a.name === undefined && { name: null }) } },
        { upsert: true, returnDocument: "after" },
      );
      return strip<Admin>(d)!;
    },
    async recordAdminLogin(email, googleSub, name) {
      // Only an existing ACTIVE record may log in. Binds googleSub on first login; rejects a mismatched sub.
      const d = await (await col<Omit<Admin, "id">>("admins")).findOneAndUpdate(
        { email: email.toLowerCase(), status: "active", $or: [{ googleSub: null }, { googleSub }] },
        { $set: { googleSub, name, lastLoginAt: now(), updatedAt: now() } },
        { returnDocument: "after" },
      );
      return strip<Admin>(d);
    },

    async log(e) { await (await col<Omit<AuditLog, "id">>("auditLogs")).insertOne({ _id: crypto.randomUUID(), at: now(), ...e }); },
    async listLogs(limit) { return (await (await col<Omit<AuditLog, "id">>("auditLogs")).find().sort({ at: -1 }).limit(limit).toArray()).map((d) => strip<AuditLog>(d)!); },

    async saveResetToken(t) {
      await (await col<ResetToken & { expiresAtDate: Date }>("passwordResetTokens")).insertOne({ _id: crypto.randomUUID(), ...t, expiresAtDate: new Date(t.expiresAt) });
    },
    async consumeResetToken(h) {
      const d = await (await col<ResetToken>("passwordResetTokens")).findOneAndUpdate(
        { tokenHash: h, usedAt: null, expiresAt: { $gt: now() } }, { $set: { usedAt: now() } }, { returnDocument: "after" },
      );
      return d ? { tokenHash: d.tokenHash, teamId: d.teamId, expiresAt: d.expiresAt, usedAt: d.usedAt } : null;
    },

    async hitRateLimit(key, max, windowMs) {
      const c = await col<{ key: string; at: Date }>("rateLimits");
      const at = new Date();
      await c.insertOne({ _id: crypto.randomUUID(), key, at });
      return (await c.countDocuments({ key, at: { $gt: new Date(at.getTime() - windowMs) } })) <= max;
    },
  };
}
