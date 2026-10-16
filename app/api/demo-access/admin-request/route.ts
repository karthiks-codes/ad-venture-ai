import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getRepo } from "@/lib/db/index.server";
import { sendEmail, templates } from "@/lib/email.server";
import { sha256 } from "@/lib/session.server";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    message: z.string().trim().min(10).max(1000),
  })
  .strict();

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Complete the request form." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Check the name, email address and request." },
      { status: 400 },
    );

  try {
    const repo = getRepo();
    const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
    if (
      !(await repo.hitRateLimit(`admin-demo-request:${sha256(ip.toLowerCase())}`, 3, 60 * 60_000))
    ) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    if (!(await repo.getSettings()).emailServiceEnabled) {
      return NextResponse.json(
        { error: "Request email is temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }
    if (
      !(await repo.hitRateLimit(
        `admin-demo-email:${sha256(parsed.data.email.toLowerCase())}`,
        2,
        60 * 60_000,
      ))
    ) {
      return NextResponse.json(
        { error: "A request was already sent from this email address. Try again later." },
        { status: 429 },
      );
    }
    const owner = (await repo.listAdmins()).find(
      (admin) => admin.status === "active" && admin.role === "owner",
    );
    if (!owner) {
      return NextResponse.json(
        { error: "The platform owner is not configured to receive demo requests." },
        { status: 503 },
      );
    }
    const mail = templates.adminDemoRequest({
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
    });
    await sendEmail(repo, owner.email, mail);
    return NextResponse.json({
      ok: true,
      message: "Your request was sent to the platform owner. It does not grant admin access.",
    });
  } catch (error) {
    console.error(
      "[admin-demo-request] Service unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Your request could not be sent. Please try again later." },
      { status: 503 },
    );
  }
}
