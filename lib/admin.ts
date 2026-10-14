import { auth } from "@clerk/nextjs/server";

function configuredAdminIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_CLERK_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  return Boolean(userId && configuredAdminIds().has(userId));
}

export async function requireAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId || !configuredAdminIds().has(userId)) {
    throw new Error("Forbidden");
  }
  return userId;
}
