import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getConversation, getConversations, sendMessage } from "@/lib/community-store";
import { messageSchema } from "@/lib/validations/community";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const otherUserId = new URL(request.url).searchParams.get("userId");
  if (otherUserId) return NextResponse.json(await getConversation(user.id, otherUserId));
  return NextResponse.json({ conversations: await getConversations(user.id) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  try {
    const message = await sendMessage(user.id, parsed.data.recipientId, parsed.data.body);
    if (!message) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to send message" }, { status: 400 });
  }
}
