/*
 * MongoDB Atlas repository — PRODUCTION ADAPTER (scaffold).
 *
 * TODO(mongo): install the official driver (`bun add mongodb`) and implement the
 * `Repo` interface from ./types using the patterns below, then return it from
 * getRepo() in ./index.server.ts when MONGODB_URI is set.
 *
 * Collections & indexes (create once via `scripts/` or Atlas UI):
 *   teams            { teamCode: 1 } unique, { email: 1 } unique, { problemId: 1 }, { submissionStatus: 1 }
 *   teamAssignments  { teamId: 1 } unique, { problemId: 1 }           (history kept in auditLogs)
 *   submissions      { teamId: 1 } unique, { status: 1 }
 *   aiDeclarations   { teamId: 1 } unique
 *   aiTools          { order: 1 }, { enabled: 1 }
 *   eventSettings    single doc { _id: "current" }
 *   auditLogs        { at: -1 }, { teamCode: 1, at: -1 }
 *   passwordResetTokens { tokenHash: 1 } unique, { expiresAt: 1 } TTL (expireAfterSeconds: 0)
 *   loginAttempts    { key: 1 }, { at: 1 } TTL 15 min  (rate limiting across instances)
 *
 * Concurrency-safe assignment (no duplicate draws, capacity respected):
 *   1. counts = aggregate teams by problemId
 *   2. pid = pickProblem(...)
 *   3. teams.findOneAndUpdate({ _id: teamId, problemId: null }, { $set: { problemId: pid, assignedAt } })
 *      → null means another request already assigned; return the existing assignment.
 *   For strict capacity under heavy concurrency, keep a `problemCounters` doc per problem and
 *   $inc it with filter { _id: pid, count: { $lt: capacity } } before step 3 (decrement on failure).
 *
 * One-upload enforcement:
 *   submissions.findOneAndUpdate(
 *     { teamId, status: { $ne: "submitted" } },
 *     { $set: { status: "uploading", ... }, $inc: { attempts: 1 } },
 *     { upsert: true })  — the unique index on teamId turns a racing duplicate into an E11000 error.
 *   Finalize with filter { teamId, status: "uploading" } → { status: "submitted" }.
 *
 * Runtime note: this project's preview runs on an edge runtime. On Vercel use the Node.js
 * runtime for routes touching MongoDB, and cache the MongoClient on globalThis.
 */
export {};
