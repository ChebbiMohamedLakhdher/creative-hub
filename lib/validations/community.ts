import { z } from "zod";

export const messageSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
});

export const topicSchema = z.object({
  title: z.string().trim().min(3).max(150),
  body: z.string().trim().min(1).max(10000),
});

export const forumPostSchema = z.object({
  body: z.string().trim().min(1).max(10000),
});
