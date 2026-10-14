import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteProject,
  getCurrentUserLike,
  getProjectById,
  incrementProjectViews,
  updateProject,
} from "@/lib/store";
import { removeProjectFile } from "@/lib/uploads";
import { updateProjectSchema } from "@/lib/validations/project";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const initialProject = await getProjectById(id, currentUser?.id);

  if (!initialProject) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await incrementProjectViews(id);
  const project = await getProjectById(id, currentUser?.id);

  return NextResponse.json({
    ...project,
    user_liked: currentUser ? await getCurrentUserLike(id, currentUser.id) : false,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project input" }, { status: 400 });
  }

  const project = await updateProject(id, currentUser.id, parsed.data);

  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(project);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await getProjectById(id);

  if (!existing || existing.user_id !== currentUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const removed = await deleteProject(id, currentUser.id);

  if (!removed) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await removeProjectFile(removed.file_url);
  await removeProjectFile(removed.thumbnail_url);

  return NextResponse.json({ success: true });
}
