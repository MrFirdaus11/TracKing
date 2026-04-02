import { db } from "@/db";
import { categories, activities } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 1. Check if category exists and belongs to user
    const categoryQuery = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.userId, session.user.id)),
    });

    if (!categoryQuery) {
      return Response.json({ error: "Category not found or unauthorized" }, { status: 404 });
    }

    // 2. We can either delete activities associated with this category, or keep them but they won't have a UI mapping.
    // Let's delete the activities related to this category for cleanup.
    await db.delete(activities).where(
      and(
        eq(activities.category, categoryQuery.name),
        eq(activities.userId, session.user.id)
      )
    );

    // 3. Delete the category
    await db.delete(categories).where(eq(categories.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
