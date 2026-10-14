import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteForumPost, updateForumPost } from "@/lib/community-store";
import { forumPostSchema } from "@/lib/validations/community";

type RouteContext = { params: Promise<{ id: string; postId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = forumPostSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid reply" }, { status: 400 });
  const { postId } = await params;
  const updated = await updateForumPost(postId, user.id, parsed.data.body);
  return updated ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Reply not found or forbidden" }, { status: 404 });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId } = await params;
  const deleted = await deleteForumPost(postId, user.id);
  return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Reply not found or forbidden" }, { status: 404 });
}
