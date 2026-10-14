import { randomUUID } from "crypto";
import { db } from "@/lib/db";

export async function createNotification(input: {
  recipientId: string;
  actorId?: string;
  type: string;
  projectId?: string;
  topicId?: string;
}) {
  if (input.recipientId === input.actorId) return;
  await db.notification.create({
    data: {
      id: randomUUID(),
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      projectId: input.projectId,
      topicId: input.topicId,
    },
  });
}

export async function getNotifications(userId: string) {
  const notifications = await db.notification.findMany({
    where: { recipientId: userId },
    include: {
      actor: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return notifications.map((notification) => ({
    ...notification,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
  }));
}
