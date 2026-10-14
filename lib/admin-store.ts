import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const adminUserSelect = {
  id: true,
  clerkId: true,
  username: true,
  avatarUrl: true,
  bio: true,
  createdAt: true,
  _count: { select: { projects: true, comments: true, likes: true } },
} satisfies Prisma.UserSelect;

const adminProjectInclude = {
  user: { select: { id: true, username: true } },
  category: { select: { slug: true } },
} satisfies Prisma.ProjectInclude;

export async function getAdminOverview(search = "") {
  const query = search.trim();
  const userWhere: Prisma.UserWhereInput = query
    ? {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { clerkId: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};
  const projectWhere: Prisma.ProjectWhereInput = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { user: { username: { contains: query, mode: "insensitive" } } },
        ],
      }
    : {};

  const [users, projects, counts, openReports] = await Promise.all([
    db.user.findMany({
      where: userWhere,
      select: adminUserSelect,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.project.findMany({
      where: projectWhere,
      include: adminProjectInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    Promise.all([
      db.user.count(),
      db.project.count(),
      db.project.count({ where: { status: "ACTIVE" } }),
      db.project.count({ where: { status: "FLAGGED" } }),
    ]),
    db.report.count({ where: { status: "OPEN" } }),
  ]);

  return {
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      category: project.category.slug,
      status: project.status,
      visibility: project.visibility,
      likesCount: project.likesCount,
      viewsCount: project.viewsCount,
      createdAt: project.createdAt.toISOString(),
      user: project.user,
    })),
    stats: {
      users: counts[0],
      projects: counts[1],
      activeProjects: counts[2],
      flaggedProjects: counts[3],
      openReports,
    },
  };
}

export async function updateAdminProject(
  projectId: string,
  action: "activate" | "flag" | "remove" | "publish" | "unpublish"
) {
  const data: Prisma.ProjectUpdateInput =
    action === "activate"
      ? { status: "ACTIVE" }
      : action === "flag"
        ? { status: "FLAGGED" }
        : action === "remove"
          ? { status: "REMOVED" }
          : action === "publish"
            ? { visibility: "PUBLIC" }
            : { visibility: "PRIVATE" };

  return db.project.update({ where: { id: projectId }, data });
}

export async function deleteAdminUser(userId: string, currentClerkId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { clerkId: true } });
  if (!user) return false;
  if (user.clerkId === currentClerkId) {
    throw new Error("You cannot delete your own admin account");
  }
  await db.user.delete({ where: { id: userId } });
  return true;
}
