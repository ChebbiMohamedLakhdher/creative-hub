import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createForumPost, deleteTopic, getTopic, updateTopic } from "@/lib/community-store";
import { forumPostSchema, topicSchema } from "@/lib/validations/community";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const topic = await getTopic((await params).id);
  return topic ? NextResponse.json(topic) : NextResponse.json({ error: "Topic not found" }, { status: 404 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = forumPostSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid reply" }, { status: 400 });
  const post = await createForumPost((await params).id, user.id, parsed.data.body);
  return post ? NextResponse.json(post, { status: 201 }) : NextResponse.json({ error: "Topic not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = topicSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
  const updated = await updateTopic((await params).id, user.id, parsed.data.title, parsed.data.body);
  return updated ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Topic not found or forbidden" }, { status: 404 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const deleted = await deleteTopic((await params).id, user.id);
  return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Topic not found or forbidden" }, { status: 404 });
}
