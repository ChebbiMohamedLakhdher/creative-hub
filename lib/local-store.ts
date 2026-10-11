import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { currentUser } from "@clerk/nextjs/server";
import { generateUsername } from "@/lib/utils";
import type {
  CreateProjectInput,
  Like,
  Project,
  ProjectCategory,
  ProjectsQueryParams,
  User,
} from "@/types";

type StoredData = {
  users: User[];
  projects: Project[];
  likes: Like[];
};

type ClerkProfile = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  imageUrl?: string | null;
};

const emptyStore: StoredData = {
  users: [],
  projects: [],
  likes: [],
};

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");
const uploadsDir = path.join(process.cwd(), "public", "uploads");

let writeQueue: Promise<void> = Promise.resolve();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function ensureStoreFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(emptyStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<StoredData> {
  await ensureStoreFile();

  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = raw.trim() ? (JSON.parse(raw) as Partial<StoredData>) : {};

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      likes: Array.isArray(parsed.likes) ? parsed.likes : [],
    };
  } catch {
    return clone(emptyStore);
  }
}

async function writeStore(data: StoredData) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
}

async function withStoreLock<T>(fn: (store: StoredData) => Promise<T> | T): Promise<T> {
  const task = writeQueue.then(async () => {
    const store = await readStore();
    const result = await fn(store);
    await writeStore(store);
    return result;
  });

  writeQueue = task.then(
    () => undefined,
    () => undefined
  );

  return task;
}

function ensureUniqueUsername(store: StoredData, baseUsername: string, userId?: string) {
  const taken = store.users.some(
    (user) => user.username === baseUsername && user.id !== userId
  );

  if (!taken) return baseUsername;
  return `${baseUsername}${Date.now().toString().slice(-4)}`;
}

function hydrateProject(
  store: StoredData,
  project: Project,
  currentUserId?: string
): Project {
  const user = store.users.find((entry) => entry.id === project.user_id);
  const user_liked = currentUserId
    ? store.likes.some(
        (like) => like.user_id === currentUserId && like.project_id === project.id
      )
    : false;

  return {
    ...project,
    user,
    user_liked,
  };
}

export async function syncClerkProfile(profile: ClerkProfile): Promise<User | null> {
  return withStoreLock((store) => {
    const email = profile.email;
    const usernameBase = generateUsername(profile.firstName, profile.lastName, email);
    const now = new Date().toISOString();
    const existing = store.users.find((user) => user.clerk_id === profile.id);

    if (existing) {
      existing.avatar_url = profile.imageUrl ?? null;
      if (!existing.username) {
        existing.username = ensureUniqueUsername(store, usernameBase, existing.id);
      }
      return clone(existing);
    }

    const user: User = {
      id: randomUUID(),
      clerk_id: profile.id,
      username: ensureUniqueUsername(store, usernameBase),
      avatar_url: profile.imageUrl ?? null,
      bio: null,
      created_at: now,
    };

    store.users.push(user);
    return clone(user);
  });
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
  const store = await readStore();
  return store.users.find((user) => user.clerk_id === clerkId) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const store = await readStore();
  return store.users.find((user) => user.id === id) ?? null;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const store = await readStore();
  return store.projects
    .filter((project) => project.user_id === userId)
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    )
    .map((project) => hydrateProject(store, project));
}

export async function updateUser(
  id: string,
  updates: { username?: string; bio?: string | null }
): Promise<User | null> {
  return withStoreLock((store) => {
    const user = store.users.find((entry) => entry.id === id);
    if (!user) return null;

    if (typeof updates.username === "string") {
      user.username = ensureUniqueUsername(store, updates.username, id);
    }

    if (updates.bio !== undefined) {
      user.bio = updates.bio;
    }

    return clone(user);
  });
}

export async function deleteUserByClerkId(clerkId: string): Promise<void> {
  await withStoreLock((store) => {
    const user = store.users.find((entry) => entry.clerk_id === clerkId);
    if (!user) return;

    const projectIds = new Set(
      store.projects.filter((project) => project.user_id === user.id).map((project) => project.id)
    );

    store.projects = store.projects.filter((project) => project.user_id !== user.id);
    store.likes = store.likes.filter(
      (like) => like.user_id !== user.id && !projectIds.has(like.project_id)
    );
    store.users = store.users.filter((entry) => entry.clerk_id !== clerkId);
  });
}

export async function listProjects(
  params: ProjectsQueryParams = {},
  currentUserId?: string
): Promise<Project[]> {
  const store = await readStore();
  const page = params.page ?? 1;
  const limit = params.limit ?? 12;

  let projects = store.projects.slice();

  if (params.category && params.category !== "All") {
    projects = projects.filter((project) => project.category === params.category);
  }

  if (params.search) {
    const search = params.search.trim().toLowerCase();
    if (search) {
      projects = projects.filter((project) => {
        const title = project.title.toLowerCase();
        const description = project.description?.toLowerCase() ?? "";
        return title.includes(search) || description.includes(search);
      });
    }
  }

  if (params.userId) {
    projects = projects.filter((project) => project.user_id === params.userId);
  }

  if (params.sort === "trending") {
    projects.sort((left, right) => {
      if (right.likes_count !== left.likes_count) {
        return right.likes_count - left.likes_count;
      }
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
  } else {
    projects.sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    );
  }

  const offset = (page - 1) * limit;
  return projects
    .slice(offset, offset + limit)
    .map((project) => hydrateProject(store, project, currentUserId));
}

export async function getProjectById(
  id: string,
  currentUserId?: string
): Promise<Project | null> {
  const store = await readStore();
  const project = store.projects.find((entry) => entry.id === id);
  if (!project) return null;

  return hydrateProject(store, project, currentUserId);
}

export async function createProject(
  userId: string,
  input: CreateProjectInput
): Promise<Project> {
  return withStoreLock((store) => {
    const user = store.users.find((entry) => entry.id === userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date().toISOString();
    const project: Project = {
      id: randomUUID(),
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      file_url: input.file_url,
      thumbnail_url: input.thumbnail_url ?? null,
      likes_count: 0,
      views_count: 0,
      created_at: now,
      updated_at: now,
      user,
      user_liked: false,
    };

    store.projects.push(project);
    return clone(project);
  });
}

export async function updateProject(
  id: string,
  userId: string,
  updates: { title?: string; description?: string | null }
): Promise<Project | null> {
  return withStoreLock((store) => {
    const project = store.projects.find((entry) => entry.id === id);
    if (!project || project.user_id !== userId) return null;

    if (typeof updates.title === "string") {
      project.title = updates.title;
    }

    if (updates.description !== undefined) {
      project.description = updates.description;
    }

    project.updated_at = new Date().toISOString();
    return clone(hydrateProject(store, project));
  });
}

export async function deleteProject(
  id: string,
  userId: string
): Promise<Project | null> {
  return withStoreLock((store) => {
    const project = store.projects.find((entry) => entry.id === id);
    if (!project || project.user_id !== userId) return null;

    store.projects = store.projects.filter((entry) => entry.id !== id);
    store.likes = store.likes.filter((like) => like.project_id !== id);
    return clone(project);
  });
}

export async function incrementProjectViews(id: string): Promise<number | null> {
  return withStoreLock((store) => {
    const project = store.projects.find((entry) => entry.id === id);
    if (!project) return null;

    project.views_count += 1;
    project.updated_at = new Date().toISOString();
    return project.views_count;
  });
}

export async function toggleProjectLike(
  userId: string,
  projectId: string
): Promise<{ liked: boolean; likes_count: number } | null> {
  return withStoreLock((store) => {
    const project = store.projects.find((entry) => entry.id === projectId);
    if (!project) return null;

    const existingLikeIndex = store.likes.findIndex(
      (like) => like.user_id === userId && like.project_id === projectId
    );

    if (existingLikeIndex >= 0) {
      store.likes.splice(existingLikeIndex, 1);
      project.likes_count = Math.max(project.likes_count - 1, 0);
      project.updated_at = new Date().toISOString();
      return { liked: false, likes_count: project.likes_count };
    }

    store.likes.push({
      id: randomUUID(),
      user_id: userId,
      project_id: projectId,
      created_at: new Date().toISOString(),
    });
    project.likes_count += 1;
    project.updated_at = new Date().toISOString();
    return { liked: true, likes_count: project.likes_count };
  });
}

export async function getCurrentUserLike(projectId: string, userId: string): Promise<boolean> {
  const store = await readStore();
  return store.likes.some(
    (like) => like.user_id === userId && like.project_id === projectId
  );
}

export async function saveProjectUpload(
  clerkId: string,
  category: ProjectCategory,
  file: File
): Promise<{ file_url: string; thumbnail_url: string | null; file_path: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const relativePath = path.join(clerkId, category, `${timestamp}-${safeName}`);
  const absolutePath = path.join(uploadsDir, relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  const relativeUrl = relativePath.split(path.sep).join("/");
  return {
    file_url: `/uploads/${relativeUrl}`,
    thumbnail_url: category === "Image" ? `/uploads/${relativeUrl}` : null,
    file_path: relativeUrl,
  };
}

export async function removeProjectFile(fileUrl: string | null | undefined) {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;

  const relativePath = fileUrl.slice("/uploads/".length).split("/").join(path.sep);
  const absolutePath = path.join(uploadsDir, relativePath);

  try {
    await fs.unlink(absolutePath);
  } catch {
    // Ignore missing files.
  }
}
