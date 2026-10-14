import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]+$/)
    .min(3)
    .max(24)
    .optional(),
  bio: z.string().trim().max(280).nullable().optional(),
});
