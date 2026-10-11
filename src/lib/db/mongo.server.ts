import "server-only";
// MongoDB Atlas repository — production persistence (official `mongodb` driver).
import { MongoClient, MongoServerError, type Db } from "mongodb";
import type {
  AiDeclaration,
  AiTool,
  Admin,
  AuditLog,
  NewTeam,
  Repo,
  ResetToken,
  Submission,
  Team,
  TeamLoginToken,
} from "./types";
import { DuplicateError, PersistenceUnavailableError } from "./types";
import type { Settings } from "@/lib/submission-rules";
import { getProblem } from "@/config/problems";
import { settingsFromEnv } from "./defaults";

type WithId<T> = Omit<T, "id"> & { _id: string };
const now = () => new Date().toISOString();
const strip = <T extends { id: string }>(d: WithId<T> | null): T | null => {
  if (!d) return null;
  const { _id, ...rest } = d;
  return { ...rest, id: _id } as unknown as T;
};

// Cache the client on globalThis so serverless warm invocations and dev hot reloads reuse one pool.
const g = globalThis as unknown as {
  __advMongo?: { uri: string; db: string; promise: Promise<Db> } | undefined;
};

export async function connectMongo(uri: string, dbName: string): Promise<Db> {
  if (g.__advMongo && g.__advMongo.uri === uri && g.__advMongo.db === dbName)
    return g.__advMongo.promise;
  const promise = (async () => {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      appName: "ad-venture-ads",
    });
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
    throw new PersistenceUnavailableError(
      "MongoDB connection failed. Verify the Atlas URI, database name, and network access configuration.",
    );
  }
}

export async function ensureIndexes(db: Db) {
  await Promise.all([
    db
      .collection("teams")
      .createIndexes([
        { key: { teamCode: 1 }, unique: true, name: "teamCode_unique" },
        { key: { email: 1 }, unique: true, name: "email_unique" },
        { key: { problemId: 1 } },
        { key: { submissionStatus: 1 } },
        { key: { status: 1 } },
      ]),
    db.collection("admins").createIndexes([
      { key: { email: 1 }, unique: true, name: "admin_email_unique" },
      {
        key: { googleSub: 1 },
        unique: true,
        partialFilterExpression: { googleSub: { $type: "string" } },
        name: "admin_sub_unique",
      },
    ]),
    db
      .collection("teamAssignments")
      .createIndexes([{ key: { teamId: 1 }, unique: true }, { key: { problemId: 1 } }]),
    db
      .collection("submissions")
      .createIndexes([{ key: { teamId: 1 }, unique: true }, { key: { status: 1 } }]),
    db.collection("aiDeclarations").createIndexes([{ key: { teamId: 1 }, unique: true }]),
    db.collection("aiTools").createIndexes([{ key: { order: 1 } }, { key: { enabled: 1 } }]),
    db
      .collection("auditLogs")
      .createIndexes([
        { key: { at: -1 } },
        { key: { teamCode: 1, at: -1 } },
        { key: { action: 1, at: -1 } },
      ]),
    db.collection("passwordResetTokens").createIndexes([
      { key: { tokenHash: 1 }, unique: true },
      { key: { expiresAtDate: 1 }, expireAfterSeconds: 0 },
    ]),
    db
      .collection("teamLoginTokens")
      .createIndexes([
        { key: { tokenHash: 1 }, unique: true },
        { key: { expiresAtDate: 1 }, expireAfterSeconds: 0 },
        { key: { teamId: 1 } },
      ]),
    db
      .collection("rateLimits")
      .createIndexes([{ key: { key: 1, at: 1 } }, { key: { at: 1 }, expireAfterSeconds: 3600 }]),
  ]);
  try {
    await db
      .collection<{ _id: string; revision: number }>("allocationState")
      .updateOne({ _id: "global" }, { $setOnInsert: { revision: 0 } }, { upsert: true });
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
  }
}

export function createMongoRepo(getDb: () => Promise<Db>): Repo {
  const col = async <T>(name: string) => (await getDb()).collection<WithId<T>>(name);
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

    async listTeams() {
      return (await (await teams()).find().sort({ teamCode: 1 }).toArray()).map((d) =>
        strip<Team>(d)!,
      );
    },
    async getTeam(id) {
      return strip<Team>(await (await teams()).findOne({ _id: id }));
    },
    async findTeamByLogin(identifier) {
      const q = identifier.trim();
      return strip<Team>(
        await (
          await teams()
        ).findOne({ $or: [{ teamCode: q.toUpperCase() }, { email: q.toLowerCase() }] }),
      );
    },
    async createTeam(t: NewTeam) {
      const ts = now();
      const doc: WithId<Omit<Team, "id">> = {
        _id: crypto.randomUUID(),
        teamCode: t.teamCode.trim().toUpperCase(),
        teamName: t.teamName.trim(),
        member1Name: t.member1Name.trim(),
        member2Name: t.member2Name.trim(),
        email: t.email.trim().toLowerCase(),
        passwordHash: t.passwordHash,
        authVersion: 0,
        mustChangePassword: t.mustChangePassword ?? true,
        status: t.status ?? "active",
        firstLoginAt: null,
        lastLoginAt: null,
        problemId: null,
        assignedAt: null,
        assignedBy: null,
        submissionStatus: "none",
        toolkitViewedAt: null,
        challengeViewedAt: null,
        isDemo: t.isDemo ?? false,
        createdAt: ts,
        updatedAt: ts,
      };
      try {
        await (await teams()).insertOne(doc);
      } catch (e) {
        if (e instanceof MongoServerError && e.code === 11000)
          throw new DuplicateError("Team code or email already exists");
        throw e;
      }
      return strip<Team>(doc)!;
    },
    async updateTeam(id, patch) {
      const { id: _ignore, ...p } = patch;
      return strip<Team>(
        await (
          await teams()
        ).findOneAndUpdate(
          { _id: id },
          { $set: { ...p, updatedAt: now() } },
          { returnDocument: "after" },
        ),
      );
    },
    async assignmentCounts() {
      const rows = await (
        await teams()
      )
        .aggregate<{ _id: string; n: number }>([
          { $match: { problemId: { $ne: null } } },
          { $group: { _id: "$problemId", n: { $sum: 1 } } },
        ])
        .toArray();
      return Object.fromEntries(rows.map((r) => [r._id, r.n]));
    },
    async assignProblemAtomic(teamId, choose, by, force) {
      const db = await getDb();
      const session = db.client.startSession();
      let assigned: Team | null = null;
      try {
        await session.withTransaction(async () => {
          assigned = null;
          await db
            .collection<{ _id: string; revision: number }>("allocationState")
            .updateOne({ _id: "global" }, { $inc: { revision: 1 } }, { upsert: true, session });

          const teamCollection = db.collection<WithId<Team>>("teams");
          const currentDocument = await teamCollection.findOne({ _id: teamId }, { session });
          const current = strip<Team>(currentDocument);
          if (!current || (current.problemId && !force)) {
            assigned = null;
            return;
          }

          const countRows = await teamCollection
            .aggregate<{ _id: string; n: number }>(
              [
                { $match: { problemId: { $ne: null } } },
                { $group: { _id: "$problemId", n: { $sum: 1 } } },
              ],
              { session },
            )
            .toArray();
          const counts = Object.fromEntries(countRows.map((row) => [row._id, row.n]));
          if (current.problemId) {
            counts[current.problemId] = Math.max(0, (counts[current.problemId] ?? 1) - 1);
          }
          const problemId = choose(counts);
          if (!problemId || !getProblem(problemId)) {
            assigned = null;
            return;
          }

          const assignedAt = now();
          const updated = await teamCollection.findOneAndUpdate(
            { _id: teamId, problemId: current.problemId },
            { $set: { problemId, assignedAt, assignedBy: by, updatedAt: assignedAt } },
            { returnDocument: "after", session },
          );
          if (!updated) {
            assigned = null;
            return;
          }
          await db.collection("teamAssignments").updateOne(
            { teamId },
            {
              $set: { teamId, problemId, assignedAt, assignedBy: by },
              $setOnInsert: { _id: crypto.randomUUID() },
            },
            { upsert: true, session },
          );
          assigned = strip<Team>(updated);
        });
      } finally {
        await session.endSession();
      }
      return assigned;
    },

    async getSubmission(teamId) {
      const d = await (await col<Submission>("submissions")).findOne({ teamId });
      return d ? (({ _id, ...r }) => r)(d) : null;
    },
    async listSubmissions() {
      return (await (await col<Submission>("submissions")).find().toArray()).map(
        ({ _id, ...r }) => r,
      );
    },
    async beginSubmission(teamId, patch) {
      const c = await col<Submission>("submissions");
      try {
        const d = await c.findOneAndUpdate(
          { teamId, status: { $in: ["none", "failed", "reopened"] } },
          {
            $set: {
              driveFolderId: null,
              driveFileId: null,
              driveFileName: null,
              driveFileSize: null,
              driveWebViewLink: null,
              mimeType: null,
              uploadSessionUrlEncrypted: null,
              uploadCompletedAt: null,
              ...patch,
              status: "uploading",
              uploadStartedAt: now(),
            },
            $inc: { attempts: 1 },
            $setOnInsert: { _id: crypto.randomUUID(), teamId },
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
      const d = await (
        await col<Submission>("submissions")
      ).findOneAndUpdate({ teamId }, { $set: patch }, { returnDocument: "after" });
      return d ? (({ _id, ...r }) => r)(d) : null;
    },
    async finalizeSubmission(teamId, patch) {
      const d = await (
        await col<Submission>("submissions")
      ).findOneAndUpdate(
        { teamId, status: "uploading" },
        {
          $set: {
            ...patch,
            status: "submitted",
            uploadCompletedAt: now(),
            uploadSessionUrlEncrypted: null,
          },
        },
        { returnDocument: "after" },
      );
      return d ? (({ _id, ...r }) => r)(d) : null;
    },
    async reopenSubmission(teamId) {
      const d = await (
        await col<Submission>("submissions")
      ).findOneAndUpdate(
        { teamId, status: "submitted" },
        { $set: { status: "reopened", uploadSessionUrlEncrypted: null } },
        { returnDocument: "after" },
      );
      return d ? (({ _id, ...r }) => r)(d) : null;
    },

    async listTools(all) {
      return (
        await (
          await col<Omit<AiTool, "id">>("aiTools")
        )
          .find(all ? {} : { enabled: true })
          .sort({ order: 1 })
          .toArray()
      ).map((d) => strip<AiTool>(d)!);
    },
    async upsertTool(tool) {
      const { id, ...rest } = tool;
      await (
        await col<Omit<AiTool, "id">>("aiTools")
      ).updateOne({ _id: id }, { $set: rest }, { upsert: true });
      return tool;
    },

    async getDeclaration(teamId) {
      const d = await (await col<AiDeclaration>("aiDeclarations")).findOne({ teamId });
      return d ? (({ _id, ...r }) => r)(d) : null;
    },
    async saveDeclaration(d) {
      await (
        await col<AiDeclaration>("aiDeclarations")
      ).updateOne(
        { teamId: d.teamId },
        { $set: d, $setOnInsert: { _id: crypto.randomUUID() } },
        { upsert: true },
      );
    },

    async getSettings() {
      const c = await col<Settings>("eventSettings");
      const d = await c.findOne({ _id: "current" });
      if (d) {
        const { _id, ...s } = d;
        return { ...settingsFromEnv(process.env), ...s };
      }
      const s = settingsFromEnv(process.env);
      await c.updateOne({ _id: "current" }, { $setOnInsert: s }, { upsert: true });
      return s;
    },
    async updateSettings(patch) {
      await this.getSettings();
      const d = await (
        await col<Settings>("eventSettings")
      ).findOneAndUpdate({ _id: "current" }, { $set: patch }, { returnDocument: "after" });
      const { _id, ...s } = d!;
      return s;
    },

    async findAdmin(q) {
      const or = [
        q.email ? { email: q.email.toLowerCase() } : null,
        q.googleSub ? { googleSub: q.googleSub } : null,
      ].filter(Boolean) as object[];
      if (!or.length) return null;
      return strip<Admin>(await (await col<Omit<Admin, "id">>("admins")).findOne({ $or: or }));
    },
    async listAdmins() {
      return (await (await col<Omit<Admin, "id">>("admins")).find().toArray()).map((d) =>
        strip<Admin>(d)!,
      );
    },
    async upsertAdmin(a) {
      const ts = now();
      const d = await (
        await col<Omit<Admin, "id">>("admins")
      ).findOneAndUpdate(
        { email: a.email.toLowerCase() },
        {
          $set: {
            role: a.role,
            status: a.status,
            ...(a.name !== undefined && { name: a.name }),
            updatedAt: ts,
          },
          $setOnInsert: {
            _id: crypto.randomUUID(),
            email: a.email.toLowerCase(),
            googleSub: a.googleSub ?? null,
            lastLoginAt: null,
            createdAt: ts,
            ...(a.name === undefined && { name: null }),
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      return strip<Admin>(d)!;
    },
    async recordAdminLogin(email, googleSub, name) {
      // Only an existing ACTIVE record may log in. Binds googleSub on first login; rejects a mismatched sub.
      const d = await (
        await col<Omit<Admin, "id">>("admins")
      ).findOneAndUpdate(
        { email: email.toLowerCase(), status: "active", $or: [{ googleSub: null }, { googleSub }] },
        { $set: { googleSub, name, lastLoginAt: now(), updatedAt: now() } },
        { returnDocument: "after" },
      );
      return strip<Admin>(d);
    },

    async log(e) {
      await (
        await col<Omit<AuditLog, "id">>("auditLogs")
      ).insertOne({ _id: crypto.randomUUID(), at: now(), ...e });
    },
    async listLogs(limit) {
      return (
        await (
          await col<Omit<AuditLog, "id">>("auditLogs")
        )
          .find()
          .sort({ at: -1 })
          .limit(limit)
          .toArray()
      ).map((d) => strip<AuditLog>(d)!);
    },

    async saveResetToken(t) {
      await (
        await col<ResetToken & { expiresAtDate: Date }>("passwordResetTokens")
      ).insertOne({ _id: crypto.randomUUID(), ...t, expiresAtDate: new Date(t.expiresAt) });
    },
    async consumeResetToken(h) {
      const d = await (
        await col<ResetToken>("passwordResetTokens")
      ).findOneAndUpdate(
        { tokenHash: h, usedAt: null, expiresAt: { $gt: now() } },
        { $set: { usedAt: now() } },
        { returnDocument: "after" },
      );
      return d
        ? { tokenHash: d.tokenHash, teamId: d.teamId, expiresAt: d.expiresAt, usedAt: d.usedAt }
        : null;
    },
    async revokeResetTokens(teamId) {
      await (await col<ResetToken>("passwordResetTokens")).deleteMany({ teamId });
    },
    async saveTeamLoginToken(token) {
      await (
        await col<TeamLoginToken & { expiresAtDate: Date }>("teamLoginTokens")
      ).insertOne({
        _id: crypto.randomUUID(),
        ...token,
        expiresAtDate: new Date(token.expiresAt),
      });
    },
    async getTeamLoginToken(tokenHash) {
      const document = await (
        await col<TeamLoginToken & { expiresAtDate: Date }>("teamLoginTokens")
      ).findOne({ tokenHash, usedAt: null, expiresAtDate: { $gt: new Date() } });
      if (!document) return null;
      return {
        tokenHash: document.tokenHash,
        teamId: document.teamId,
        authVersion: document.authVersion,
        expiresAt: document.expiresAt,
        usedAt: document.usedAt,
      };
    },
    async consumeTeamLoginToken(tokenHash) {
      const document = await (
        await col<TeamLoginToken & { expiresAtDate: Date }>("teamLoginTokens")
      ).findOneAndUpdate(
        { tokenHash, usedAt: null, expiresAtDate: { $gt: new Date() } },
        { $set: { usedAt: now() } },
        { returnDocument: "after" },
      );
      if (!document) return null;
      return {
        tokenHash: document.tokenHash,
        teamId: document.teamId,
        authVersion: document.authVersion,
        expiresAt: document.expiresAt,
        usedAt: document.usedAt,
      };
    },
    async revokeTeamLoginTokens(teamId) {
      await (await col<TeamLoginToken>("teamLoginTokens")).deleteMany({ teamId });
    },

    async hitRateLimit(key, max, windowMs) {
      const c = await col<{ key: string; at: Date }>("rateLimits");
      const at = new Date();
      await c.insertOne({ _id: crypto.randomUUID(), key, at });
      return (
        (await c.countDocuments({ key, at: { $gt: new Date(at.getTime() - windowMs) } })) <= max
      );
    },
  };
}
