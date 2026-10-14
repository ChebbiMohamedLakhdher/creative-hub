import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { deleteAdminUser, getAdminOverview, updateAdminProject } from "@/lib/admin-store";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const search = new URL(request.url).searchParams.get("search") ?? "";
    return NextResponse.json(await getAdminOverview(search));
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "Failed to load admin data" }, { status: 500 });
  }
}

export async function HEAD() {
  try {
    await requireAdmin();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return new NextResponse(null, { status: 403 });
    }
    console.error("Admin access check error:", error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminClerkId = await requireAdmin();
    const body = (await request.json()) as {
      action?: "activate" | "flag" | "remove" | "publish" | "unpublish" | "delete-user";
      projectId?: string;
      userId?: string;
    };

    if (body.action === "delete-user" && body.userId) {
      await deleteAdminUser(body.userId, adminClerkId);
      return NextResponse.json({ success: true });
    }
    const projectActions = ["activate", "flag", "remove", "publish", "unpublish"] as const;
    if (body.projectId && body.action && projectActions.includes(body.action as (typeof projectActions)[number])) {
      const action = body.action as (typeof projectActions)[number];
      await updateAdminProject(body.projectId, action);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Invalid admin action" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin action error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform admin action" },
      { status: 500 }
    );
  }
}
