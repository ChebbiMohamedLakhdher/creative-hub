import { z } from "zod";

export const projectCategorySchema = z.enum(["3D", "Image", "Audio", "PDF"]);

export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(5000).optional(),
  category: projectCategorySchema,
  file_url: z.string().trim().min(1).max(2048),
  thumbnail_url: z.string().trim().max(2048).optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
});

export const projectQuerySchema = z.object({
  category: z.union([projectCategorySchema, z.literal("All")]).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  userId: z.string().uuid().optional(),
  sort: z.enum(["latest", "trending"]).default("latest"),
});
