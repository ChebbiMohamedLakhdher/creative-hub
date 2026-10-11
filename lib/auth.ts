import { auth } from "@clerk/nextjs/server";
import { ensureCurrentUser } from "@/lib/local-store";
import { User } from "@/types";

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  return ensureCurrentUser();
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}
