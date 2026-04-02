import { db } from "@/db";
import { activities, categories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, gte, lte } from "drizzle-orm";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "week"; // week or month

  const now = new Date();
  let startDate: Date;

  if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    // Start of current week (Monday)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(now.getFullYear(), now.getMonth(), diff);
    startDate.setHours(0, 0, 0, 0);
  }

  // Fetch categories dynamic
  const userCategories = await db.query.categories.findMany({
    where: (cats, { eq }) => eq(cats.userId, session.user.id),
  });

  // Get activities in date range
  const userActivities = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.userId, session.user.id),
        gte(activities.dateLogged, startDate),
        lte(activities.dateLogged, now)
      )
    );

  // Category breakdown
  const categoryCount: Record<string, number> = {};
  userCategories.forEach(cat => categoryCount[cat.name] = 0);

  // Daily breakdown
  const dailyMap: Record<string, Record<string, number>> = {};

  for (const activity of userActivities) {
    // Count by category
    if (categoryCount[activity.category] !== undefined) {
      categoryCount[activity.category]++;
    }

    // Group by date
    const dateKey = new Date(activity.dateLogged).toISOString().split("T")[0];
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {};
      userCategories.forEach(cat => dailyMap[dateKey][cat.name] = 0);
    }
    
    if (dailyMap[dateKey][activity.category] !== undefined) {
      dailyMap[dateKey][activity.category]++;
    }
  }

  // Build daily data with all dates in range
  const dailyData = [];
  const current = new Date(startDate);
  while (current <= now) {
    const dateKey = current.toISOString().split("T")[0];
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    
    const dayObj: any = {
      date: dateKey,
      day: dayNames[current.getDay()],
    };
    
    userCategories.forEach(cat => {
      dayObj[cat.name] = dailyMap[dateKey]?.[cat.name] || 0;
    });

    dailyData.push(dayObj);
    current.setDate(current.getDate() + 1);
  }

  return Response.json({
    totalActivities: userActivities.length,
    categoryBreakdown: categoryCount,
    dailyData,
    period,
    categories: userCategories // Send to client for mapping colors
  });
}
