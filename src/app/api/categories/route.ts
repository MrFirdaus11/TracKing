import { db } from "@/db";
import { categories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import crypto from "crypto";

const DEFAULT_CATEGORIES = [
  { name: "produktivitas", label: "Produktivitas", emoji: "💼", color: "hsl(262, 83%, 58%)" },
  { name: "kesehatan", label: "Kesehatan", emoji: "❤️", color: "hsl(0, 84%, 60%)" },
  { name: "olahraga", label: "Olahraga", emoji: "🏃", color: "hsl(142, 71%, 45%)" },
  { name: "belajar", label: "Belajar", emoji: "📚", color: "hsl(217, 91%, 60%)" },
];

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch from DB
  let userCategories = await db.query.categories.findMany({
    where: (cats, { eq }) => eq(cats.userId, session.user.id),
  });

  // Seed default categories if user has none
  if (userCategories.length === 0) {
    const toInsert = DEFAULT_CATEGORIES.map(cat => ({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name: cat.label,
      emoji: cat.emoji,
      color: cat.color,
    }));
    
    await db.insert(categories).values(toInsert);
    userCategories = await db.query.categories.findMany({
      where: (cats, { eq }) => eq(cats.userId, session.user.id),
    });
  }

  return Response.json({ data: userCategories });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, emoji, color } = body;

    if (!name || !emoji || !color) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newCat = {
      id: crypto.randomUUID(),
      userId: session.user.id,
      name,
      emoji,
      color,
    };

    await db.insert(categories).values(newCat);
    return Response.json({ success: true, data: newCat });
  } catch (error) {
    console.error("Failed to add category", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
