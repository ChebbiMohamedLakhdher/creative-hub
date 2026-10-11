import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteProject,
  getCurrentUserLike,
  getProjectById,
  incrementProjectViews,
  removeProjectFile,
  updateProject,
} from "@/lib/local-store";

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
  const body = await request.json();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const description =
    typeof body.description === "string" ? body.description.trim() : body.description;

  if (title !== undefined && (!title || title.length > 100)) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  if (description !== undefined && description !== null && description.length > 5000) {
    return NextResponse.json(
      { error: "Description must be 5000 characters or fewer" },
      { status: 400 }
    );
  }

  const project = await updateProject(id, currentUser.id, {
    title,
    description,
  });

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
