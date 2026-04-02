import { db } from "@/db";
import { activities } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");

  const conditions = [eq(activities.userId, session.user.id)];

  if (from) {
    conditions.push(gte(activities.dateLogged, new Date(from)));
  }
  if (to) {
    conditions.push(lte(activities.dateLogged, new Date(to)));
  }
  if (category) {
    conditions.push(eq(activities.category, category));
  }

  const result = await db
    .select()
    .from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.dateLogged));

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { description, category } = body;

  if (!description || !category) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const newActivity = {
    id: uuidv4(),
    userId: session.user.id,
    description,
    category,
    dateLogged: new Date(),
  };

  await db.insert(activities).values(newActivity);

  return Response.json(newActivity, { status: 201 });
}
