import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/");
  return <AdminDashboard />;
}
