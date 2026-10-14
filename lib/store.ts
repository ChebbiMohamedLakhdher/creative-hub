import { currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { generateUsername } from "@/lib/utils";
import type {
  CreateProjectInput,
  Project,
  ProjectsQueryParams,
  User,
} from "@/types";

type ClerkProfile = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  imageUrl?: string | null;
};

const projectInclude = {
  user: true,
  category: true,
  _count: { select: { likes: true, views: true } },
} satisfies Prisma.ProjectInclude;

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

function toUser(user: {
  id: string;
  clerkId: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
}): User {
  return {
    id: user.id,
    clerk_id: user.clerkId,
    username: user.username,
    avatar_url: user.avatarUrl,
    bio: user.bio,
    created_at: user.createdAt.toISOString(),
  };
}

function toProject(project: ProjectWithRelations, liked = false): Project {
  return {
    id: project.id,
    user_id: project.userId,
    title: project.title,
    description: project.description,
    category: project.category.slug as Project["category"],
    file_url: project.mediaUrl,
    thumbnail_url: project.thumbnailUrl,
    likes_count: project.likesCount,
    views_count: project.viewsCount,
    created_at: project.createdAt.toISOString(),
    updated_at: project.updatedAt.toISOString(),
    user: toUser(project.user),
    user_liked: liked,
  };
}

function uniqueUsername(username: string, existing?: string): string {
  return existing && existing !== username ? `${username}${Date.now().toString().slice(-4)}` : username;
}

export async function syncClerkProfile(profile: ClerkProfile): Promise<User> {
  const usernameBase = generateUsername(profile.firstName, profile.lastName, profile.email);
  const existing = await db.user.findUnique({ where: { clerkId: profile.id } });

  if (existing) {
    const updated = await db.user.update({
      where: { id: existing.id },
      data: { avatarUrl: profile.imageUrl ?? null },
    });
    return toUser(updated);
  }

  const usernameTaken = await db.user.findUnique({ where: { username: usernameBase } });
  const created = await db.user.create({
    data: {
      id: randomUUID(),
      clerkId: profile.id,
      username: uniqueUsername(usernameBase, usernameTaken?.username),
      avatarUrl: profile.imageUrl ?? null,
    },
  });
  return toUser(created);
}

export async function ensureCurrentUser(): Promise<User | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  return syncClerkProfile({
    id: clerkUser.id,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
    imageUrl: clerkUser.imageUrl ?? null,
  });
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const user = await db.user.findUnique({ where: { clerkId } });
  return user ? toUser(user) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await db.user.findUnique({ where: { id } });
  return user ? toUser(user) : null;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const projects = await db.project.findMany({
    where: { userId },
    include: projectInclude,
    orderBy: { createdAt: "desc" },
  });
  return projects.map((project) => toProject(project));
}

export async function updateUser(
  id: string,
  updates: { username?: string; bio?: string | null }
): Promise<User | null> {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return null;

  const username = updates.username
    ? (await db.user.findUnique({ where: { username: updates.username } }))
        ?.id === id
      ? updates.username
      : uniqueUsername(
          updates.username,
          (await db.user.findUnique({ where: { username: updates.username } }))?.username
        )
    : undefined;

  const updated = await db.user.update({
    where: { id },
    data: { username, bio: updates.bio },
  });
  return toUser(updated);
}

export async function deleteUserByClerkId(clerkId: string): Promise<void> {
  await db.user.deleteMany({ where: { clerkId } });
}

export async function listProjects(
  params: ProjectsQueryParams = {},
  currentUserId?: string
): Promise<Project[]> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 12, 1), 50);
  const where: Prisma.ProjectWhereInput = {
    status: "ACTIVE",
    visibility: "PUBLIC",
    ...(params.category && params.category !== "All"
      ? { category: { slug: params.category } }
      : {}),
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search.trim(), mode: "insensitive" } },
            { description: { contains: params.search.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const projects = await db.project.findMany({
    where,
    include: projectInclude,
    orderBy:
      params.sort === "trending"
        ? [{ likesCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    skip: (page - 1) * limit,
    take: limit,
  });

  const likedIds = currentUserId
    ? new Set(
        (
          await db.like.findMany({
            where: { userId: currentUserId, projectId: { in: projects.map((p) => p.id) } },
            select: { projectId: true },
          })
        ).map((like) => like.projectId)
      )
    : new Set<string>();

  return projects.map((project) => toProject(project, likedIds.has(project.id)));
}

export async function getProjectById(
  id: string,
  currentUserId?: string
): Promise<Project | null> {
  const project = await db.project.findUnique({ where: { id }, include: projectInclude });
  if (!project) return null;
  const liked = currentUserId
    ? Boolean(await db.like.findUnique({ where: { userId_projectId: { userId: currentUserId, projectId: id } } }))
    : false;
  return toProject(project, liked);
}

export async function createProject(userId: string, input: CreateProjectInput): Promise<Project> {
  const category = await db.category.upsert({
    where: { slug: input.category },
    create: { id: randomUUID(), slug: input.category, name: input.category },
    update: {},
  });

  const project = await db.project.create({
    data: {
      id: randomUUID(),
      userId,
      categoryId: category.id,
      title: input.title,
      description: input.description ?? null,
      mediaUrl: input.file_url,
      thumbnailUrl: input.thumbnail_url ?? null,
    },
    include: projectInclude,
  });
  return toProject(project);
}

export async function updateProject(
  id: string,
  userId: string,
  updates: { title?: string; description?: string | null }
): Promise<Project | null> {
  const result = await db.project.updateMany({
    where: { id, userId },
    data: { title: updates.title, description: updates.description },
  });
  if (result.count === 0) return null;
  const project = await db.project.findUnique({ where: { id }, include: projectInclude });
  return project ? toProject(project) : null;
}

export async function deleteProject(id: string, userId: string): Promise<Project | null> {
  const project = await db.project.findFirst({ where: { id, userId }, include: projectInclude });
  if (!project) return null;
  await db.project.delete({ where: { id } });
  return toProject(project);
}

export async function incrementProjectViews(
  id: string,
  viewerId?: string,
  ipHash?: string
): Promise<number | null> {
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  const updated = await db.$transaction(async (tx) => {
    const project = await tx.project.updateMany({
      where: { id, status: "ACTIVE" },
      data: { viewsCount: { increment: 1 } },
    });
    if (project.count === 0) return null;

    await tx.view.create({ data: { projectId: id, viewerId, ipHash: ipHash ?? "" } });
    await tx.viewDailyAggregate.upsert({
      where: { projectId_day: { projectId: id, day } },
      create: { projectId: id, day, viewCount: 1 },
      update: { viewCount: { increment: 1 } },
    });
    const current = await tx.project.findUnique({ where: { id }, select: { viewsCount: true } });
    return current?.viewsCount ?? null;
  });
  return updated;
}

export async function toggleProjectLike(
  userId: string,
  projectId: string
): Promise<{ liked: boolean; likes_count: number } | null> {
  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) return null;

  return db.$transaction(async (tx) => {
    const existing = await tx.like.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (existing) {
      await tx.like.delete({ where: { id: existing.id } });
      const updated = await tx.project.update({
        where: { id: projectId },
        data: { likesCount: { decrement: 1 } },
        select: { likesCount: true },
      });
      return { liked: false, likes_count: Math.max(updated.likesCount, 0) };
    }

    await tx.like.create({ data: { userId, projectId } });
    const projectOwner = await tx.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });
    if (projectOwner && projectOwner.userId !== userId) {
      await tx.notification.create({
        data: {
          id: randomUUID(),
          recipientId: projectOwner.userId,
          actorId: userId,
          type: "LIKE",
          projectId,
        },
      });
    }
    const updated = await tx.project.update({
      where: { id: projectId },
      data: { likesCount: { increment: 1 } },
      select: { likesCount: true },
    });
    return { liked: true, likes_count: updated.likesCount };
  });
}

export async function getCurrentUserLike(projectId: string, userId: string): Promise<boolean> {
  return Boolean(
    await db.like.findUnique({ where: { userId_projectId: { userId, projectId } } })
  );
}
