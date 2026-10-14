import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { z } from "zod";

const legacyUserSchema = z.object({
  id: z.string(),
  clerk_id: z.string(),
  username: z.string(),
  avatar_url: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  created_at: z.string(),
});

const legacyProjectSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  category: z.enum(["3D", "Image", "Audio", "PDF"]),
  file_url: z.string(),
  thumbnail_url: z.string().nullable().optional(),
  likes_count: z.number().int().nonnegative().default(0),
  views_count: z.number().int().nonnegative().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

const legacyLikeSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  project_id: z.string(),
  created_at: z.string(),
});

const legacyStoreSchema = z.object({
  users: z.array(legacyUserSchema).default([]),
  projects: z.array(legacyProjectSchema).default([]),
  likes: z.array(legacyLikeSchema).default([]),
});

const categories = ["3D", "Image", "Audio", "PDF"] as const;

async function main() {
  const storePath = path.join(process.cwd(), "data", "store.json");
  const source = legacyStoreSchema.parse(JSON.parse(await readFile(storePath, "utf8")));

  for (const name of categories) {
    await db.category.upsert({
      where: { slug: name },
      update: { name },
      create: { slug: name, name },
    });
  }

  for (const user of source.users) {
    await db.user.upsert({
      where: { id: user.id },
      update: {
        clerkId: user.clerk_id,
        username: user.username,
        avatarUrl: user.avatar_url ?? null,
        bio: user.bio ?? null,
        createdAt: new Date(user.created_at),
      },
      create: {
        id: user.id,
        clerkId: user.clerk_id,
        username: user.username,
        avatarUrl: user.avatar_url ?? null,
        bio: user.bio ?? null,
        createdAt: new Date(user.created_at),
      },
    });
  }

  for (const project of source.projects) {
    const category = await db.category.findUniqueOrThrow({
      where: { slug: project.category },
    });
    await db.project.upsert({
      where: { id: project.id },
      update: {
        userId: project.user_id,
        categoryId: category.id,
        title: project.title,
        description: project.description ?? null,
        mediaUrl: project.file_url,
        thumbnailUrl: project.thumbnail_url ?? null,
        likesCount: project.likes_count,
        viewsCount: project.views_count,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      },
      create: {
        id: project.id,
        userId: project.user_id,
        categoryId: category.id,
        title: project.title,
        description: project.description ?? null,
        mediaUrl: project.file_url,
        thumbnailUrl: project.thumbnail_url ?? null,
        likesCount: project.likes_count,
        viewsCount: project.views_count,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      },
    });

    if (project.views_count > 0) {
      const day = new Date(project.created_at);
      day.setUTCHours(0, 0, 0, 0);
      await db.viewDailyAggregate.upsert({
        where: { projectId_day: { projectId: project.id, day } },
        update: { viewCount: project.views_count },
        create: {
          projectId: project.id,
          day,
          viewCount: project.views_count,
        },
      });
    }
  }

  for (const like of source.likes) {
    await db.like.upsert({
      where: { userId_projectId: { userId: like.user_id, projectId: like.project_id } },
      update: { createdAt: new Date(like.created_at) },
      create: {
        id: like.id,
        userId: like.user_id,
        projectId: like.project_id,
        createdAt: new Date(like.created_at),
      },
    });
  }

  const [users, projects, likes, categoryCount, dailyViews] = await Promise.all([
    db.user.count(),
    db.project.count(),
    db.like.count(),
    db.category.count(),
    db.viewDailyAggregate.count(),
  ]);
  const expected = {
    users: source.users.length,
    projects: source.projects.length,
    likes: source.likes.length,
    categories: categories.length,
    dailyViews: source.projects.filter((project) => project.views_count > 0).length,
  };
  const actual = { users, projects, likes, categories: categoryCount, dailyViews };
  console.log(JSON.stringify({ expected, actual }, null, 2));

  if (
    users < expected.users ||
    projects < expected.projects ||
    likes < expected.likes ||
    categoryCount < expected.categories ||
    dailyViews < expected.dailyViews
  ) {
    throw new Error("Migration verification failed: destination row counts are lower than expected");
  }
}

main()
  .catch((error) => {
    console.error("JSON migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
