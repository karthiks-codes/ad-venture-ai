// Usage: bun run admin:bootstrap -- --email you@bvrithyderabad.edu.in [--role owner|admin|viewer] [--disable]
// The ONLY way to create the first admin. Google login never auto-promotes anyone.
import { mongoRepoFromEnv } from "./_mongo";

const arg = (k: string) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : undefined; };
const email = arg("--email")?.trim().toLowerCase();
const role = (arg("--role") ?? "owner") as "owner" | "admin" | "viewer";
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Pass --email <google account email>");
if (!["owner", "admin", "viewer"].includes(role)) throw new Error("Invalid --role");

const { repo } = await mongoRepoFromEnv();
const a = await repo.upsertAdmin({ email, role, status: process.argv.includes("--disable") ? "disabled" : "active" });
await repo.log({ actor: "bootstrap-script", action: "admin.bootstrap", meta: { email, role: a.role, status: a.status } });
console.log(`Admin record ready: ${a.email} role=${a.role} status=${a.status}`);
process.exit(0);
