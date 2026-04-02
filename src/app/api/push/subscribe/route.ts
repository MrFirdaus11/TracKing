import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const { endpoint, keys: { p256dh, auth: authKey } } = subscription;

    // Check if subscription already exists for this endpoint
    const existing = await db.query.pushSubscriptions.findFirst({
      where: (subs, { eq }) => eq(subs.endpoint, endpoint),
    });

    if (existing) {
      return Response.json({ success: true, message: "Already subscribed" });
    }

    // Insert new subscription
    await db.insert(pushSubscriptions).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      endpoint,
      p256dh,
      auth: authKey,
    });

    return Response.json({ success: true, message: "Subscribed successfully" });
  } catch (error) {
    console.error("Subscription Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
