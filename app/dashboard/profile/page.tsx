import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTeam } from "@/lib/auth.server";

export const runtime = "nodejs";

export default async function TeamProfilePage() {
  const current = await getCurrentTeam();
  if (!current) {
    const needsPasswordChange = await getCurrentTeam({ allowPasswordChange: true });
    redirect(needsPasswordChange ? "/change-password" : "/login");
  }
  const { team } = current;
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link className="text-sm font-semibold text-primary" href="/dashboard">
        ← Team workspace
      </Link>
      <section className="panel mt-6 p-7">
        <h1 className="text-3xl font-bold">Team profile</h1>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Team code
            </dt>
            <dd className="mt-1 font-semibold">{team.teamCode}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Team name
            </dt>
            <dd className="mt-1 font-semibold">{team.teamName}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Member 1
            </dt>
            <dd className="mt-1 font-semibold">{team.member1Name}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Member 2
            </dt>
            <dd className="mt-1 font-semibold">{team.member2Name}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Team email
            </dt>
            <dd className="mt-1 font-semibold">{team.email}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
