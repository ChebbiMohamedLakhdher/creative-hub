import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createTopic, listTopics } from "@/lib/community-store";
import { topicSchema } from "@/lib/validations/community";

export async function GET() {
  return NextResponse.json({ topics: await listTopics() });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = topicSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
  const topic = await createTopic(user.id, parsed.data.title, parsed.data.body);
  return NextResponse.json(topic, { status: 201 });
}
