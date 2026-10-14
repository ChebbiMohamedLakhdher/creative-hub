import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/store";
import { createProjectSchema, projectQuerySchema } from "@/lib/validations/project";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = projectQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project query" }, { status: 400 });
  }

  const currentUser = await getCurrentUser();
  const projects = await listProjects(parsed.data, currentUser?.id);

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project input" }, { status: 400 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "User not found. Please try signing in again." },
      { status: 404 }
    );
  }

  try {
    const project = await createProject(user.id, parsed.data);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create project",
      },
      { status: 500 }
    );
  }
}
