import { db } from "@/db";
import { users, activities, pushSubscriptions } from "@/db/schema";
import { eq, and, sql, gte, lt } from "drizzle-orm";
import type { NextRequest } from "next/server";
import webPush from "web-push";

// Configure Web Push with VAPID keys
webPush.setVapidDetails(
  "mailto:contact@trackin.app", // A legitimate email address is required
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export async function GET(request: NextRequest) {
  // Normally, you want to verify Vercel Cron header here to prevent unauthorized triggering
  // e.g. request.headers.get("Authorization") === `Bearer ${process.env.CRON_SECRET}`
  
  try {
    // 1. Determine "today" boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 2. Find users who have NOT logged an activity today
    // Let's get all users who HAVE logged an activity today to exclude them
    const activeUsersQuery = db
      .select({ userId: activities.userId })
      .from(activities)
      .where(
        and(
          gte(activities.dateLogged, today),
          lt(activities.dateLogged, tomorrow)
        )
      );
      
    // Get users who have a push subscription AND are not in the active list
    const unengagedUsers = await db
      .select({
        id: users.id,
        name: users.name,
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(users)
      .innerJoin(pushSubscriptions, eq(users.id, pushSubscriptions.userId))
      .where(
        sql`${users.id} NOT IN ${activeUsersQuery}`
      );

    if (unengagedUsers.length === 0) {
      return Response.json({ success: true, message: "No reminders to send." });
    }

    // 3. Send out web push notifications
    let successCount = 0;
    let failCount = 0;

    for (const sub of unengagedUsers) {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      const payload = JSON.stringify({
        title: "Waktunya Mencatat! 📝",
        body: `Hai ${sub.name.split(" ")[0]}, kamu belum mencatat aktivitas apapun hari ini. Yuk catat sekarang!`,
        url: "/dashboard",
      });

      try {
        await webPush.sendNotification(pushConfig, payload);
        successCount++;
      } catch (err) {
        console.error("Error sending push notification to", sub.name, err);
        // Depending on error code (like 410 Gone), you might want to delete the subscription from DB
        failCount++;
      }
    }

    return Response.json({
      success: true,
      message: `Sent ${successCount} reminders, failed ${failCount}.`,
    });
  } catch (error) {
    console.error("Cron Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
