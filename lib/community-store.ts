import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { createNotification } from "@/lib/notifications";

const userSelect = { id: true, username: true, avatarUrl: true } as const;

function pair(userId: string, otherId: string): [string, string] {
  return userId < otherId ? [userId, otherId] : [otherId, userId];
}

export async function getConversations(userId: string) {
  const conversations = await db.conversation.findMany({
    where: { OR: [{ userOneId: userId }, { userTwoId: userId }] },
    include: {
      userOne: { select: userSelect },
      userTwo: { select: userSelect },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
  return conversations.map((conversation) => ({
    id: conversation.id,
    otherUser: conversation.userOneId === userId ? conversation.userTwo : conversation.userOne,
    lastMessage: conversation.messages[0]
      ? { body: conversation.messages[0].body, createdAt: conversation.messages[0].createdAt.toISOString() }
      : null,
  }));
}

export async function getConversation(userId: string, otherUserId: string) {
  const [userOneId, userTwoId] = pair(userId, otherUserId);
  const conversation = await db.conversation.findUnique({
    where: { userOneId_userTwoId: { userOneId, userTwoId } },
    include: {
      userOne: { select: userSelect },
      userTwo: { select: userSelect },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: userSelect } },
      },
    },
  });
  if (!conversation) {
    const otherUser = await db.user.findUnique({ where: { id: otherUserId }, select: userSelect });
    return otherUser ? { id: "", otherUser, messages: [] } : null;
  }
  await db.message.updateMany({
    where: { conversationId: conversation.id, recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  return {
    id: conversation.id,
    otherUser: conversation.userOneId === userId ? conversation.userTwo : conversation.userOne,
    messages: conversation.messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt?.toISOString() ?? null,
    })),
  };
}

export async function sendMessage(senderId: string, recipientId: string, body: string) {
  if (senderId === recipientId) throw new Error("You cannot message yourself");
  const recipient = await db.user.findUnique({ where: { id: recipientId }, select: { id: true } });
  if (!recipient) return null;
  const [userOneId, userTwoId] = pair(senderId, recipientId);
  const conversation = await db.conversation.upsert({
    where: { userOneId_userTwoId: { userOneId, userTwoId } },
    create: { id: randomUUID(), userOneId, userTwoId },
    update: { updatedAt: new Date() },
  });
  const message = await db.message.create({
    data: { id: randomUUID(), conversationId: conversation.id, senderId, recipientId, body },
  });
  await createNotification({
    recipientId,
    actorId: senderId,
    type: "MESSAGE",
  });
  return message;
}

export async function listTopics() {
  const topics = await db.forumTopic.findMany({
    include: { author: { select: userSelect }, _count: { select: { posts: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return topics.map((topic) => ({
    ...topic,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
  }));
}

export async function getTopic(id: string) {
  const topic = await db.forumTopic.findUnique({
    where: { id },
    include: {
      author: { select: userSelect },
      posts: { include: { author: { select: userSelect } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!topic) return null;
  return {
    ...topic,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
    posts: topic.posts.map((post) => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    })),
  };
}

export async function createTopic(authorId: string, title: string, body: string) {
  return db.forumTopic.create({ data: { id: randomUUID(), authorId, title, body } });
}

export async function updateTopic(id: string, authorId: string, title: string, body: string) {
  const result = await db.forumTopic.updateMany({
    where: { id, authorId },
    data: { title, body },
  });
  return result.count > 0;
}

export async function deleteTopic(id: string, authorId: string) {
  const result = await db.forumTopic.deleteMany({ where: { id, authorId } });
  return result.count > 0;
}

export async function createForumPost(topicId: string, authorId: string, body: string) {
  const topic = await db.forumTopic.findUnique({ where: { id: topicId }, select: { id: true } });
  if (!topic) return null;
  const post = await db.forumPost.create({ data: { id: randomUUID(), topicId, authorId, body } });
  const topicAuthor = await db.forumTopic.findUnique({
    where: { id: topicId },
    select: { authorId: true },
  });
  if (topicAuthor) {
    await createNotification({
      recipientId: topicAuthor.authorId,
      actorId: authorId,
      type: "FORUM_REPLY",
      topicId,
    });
  }
  return post;
}

export async function updateForumPost(id: string, authorId: string, body: string) {
  const result = await db.forumPost.updateMany({
    where: { id, authorId },
    data: { body },
  });
  return result.count > 0;
}

export async function deleteForumPost(id: string, authorId: string) {
  const result = await db.forumPost.deleteMany({ where: { id, authorId } });
  return result.count > 0;
}
