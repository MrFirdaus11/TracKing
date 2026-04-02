import { db } from "@/db";
import { activities, users } from "@/db/schema";
import { parseWhatsAppMessage, getCategoryLabel, getCategoryEmoji } from "@/lib/whatsapp";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { NextRequest } from "next/server";

// GET - WhatsApp webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || "trackin_verify_token";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// POST - Receive incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Meta WhatsApp Cloud API webhook format
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return Response.json({ status: "no_messages" });
    }

    for (const message of messages) {
      if (message.type !== "text") continue;

      const phoneNumber = message.from; // e.g. "6281234567890"
      const text = message.text?.body;

      if (!text) continue;

      // Find user by phone number
      const user = await db
        .select()
        .from(users)
        .where(eq(users.phoneNumber, phoneNumber))
        .limit(1);

      if (user.length === 0) {
        // Send reply: user not registered
        await sendWhatsAppReply(
          phoneNumber,
          "⚠️ Nomor kamu belum terdaftar di TracKin. Silakan daftar dulu di website ya!"
        );
        continue;
      }

      // Parse the message
      const parsed = parseWhatsAppMessage(text);

      if (!parsed) {
        await sendWhatsAppReply(
          phoneNumber,
          "❓ Saya tidak mengenali kategori. Gunakan hashtag: #olahraga, #belajar, #kesehatan, atau #produktivitas\n\nContoh: \"Lari pagi 30 menit #olahraga\""
        );
        continue;
      }

      // Save activity
      await db.insert(activities).values({
        id: uuidv4(),
        userId: user[0].id,
        description: parsed.description,
        category: parsed.category,
        dateLogged: new Date(),
      });

      const emoji = getCategoryEmoji(parsed.category);
      const label = getCategoryLabel(parsed.category);

      await sendWhatsAppReply(
        phoneNumber,
        `${emoji} Aktivitas berhasil dicatat!\n\n📝 ${parsed.description}\n🏷️ Kategori: ${label}\n📅 ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
      );
    }

    return Response.json({ status: "ok" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function sendWhatsAppReply(to: string, message: string) {
  const WA_TOKEN = process.env.WA_ACCESS_TOKEN;
  const WA_PHONE_ID = process.env.WA_PHONE_NUMBER_ID;

  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.log(`[WA Reply to ${to}]: ${message}`);
    return;
  }

  try {
    await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });
  } catch (err) {
    console.error("Failed to send WA reply:", err);
  }
}
