import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MessagesClient from "@/components/community/MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return <MessagesClient currentUserId={user.id} />;
}
