import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { phoneNumber } = body;

  if (!phoneNumber) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ phoneNumber })
    .where(eq(users.id, session.user.id));

  return Response.json({ success: true });
}
