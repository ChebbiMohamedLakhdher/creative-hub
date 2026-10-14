import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getNotifications } from "@/lib/notifications";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await getNotifications(user.id);
  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((notification) => !notification.readAt).length,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  await db.notification.updateMany({
    where: { recipientId: user.id, ...(body?.id ? { id: body.id } : {}) },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
