import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NotificationsClient from "@/components/community/NotificationsClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return <NotificationsClient />;
}
