import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/local-store";
import { CreateProjectInput, ProjectCategory } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category");
  const category =
    categoryParam && ["3D", "Image", "Audio", "PDF", "All"].includes(categoryParam)
      ? (categoryParam as ProjectCategory | "All")
      : undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "12", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 50)
      : 12;
  const userId = searchParams.get("userId") || undefined;
  const sort = searchParams.get("sort") ?? "latest";

  const currentUser = await getCurrentUser();
  const projects = await listProjects(
    {
      category,
      search,
      page,
      limit,
      userId,
      sort: sort === "trending" ? "trending" : "latest",
    },
    currentUser?.id
  );

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<CreateProjectInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : undefined;
  const category = body.category;
  const file_url = typeof body.file_url === "string" ? body.file_url.trim() : "";
  const thumbnail_url =
    typeof body.thumbnail_url === "string" ? body.thumbnail_url.trim() : undefined;

  if (!title || title.length > 100) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  if (!category || !["3D", "Image", "Audio", "PDF"].includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (!file_url || file_url.length > 2048) {
    return NextResponse.json({ error: "File URL is required" }, { status: 400 });
  }

  if (description && description.length > 5000) {
    return NextResponse.json(
      { error: "Description must be 5000 characters or fewer" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "User not found. Please try signing in again." },
      { status: 404 }
    );
  }

  try {
    const project = await createProject(user.id, {
      title,
      description: description ?? undefined,
      category,
      file_url,
      thumbnail_url: thumbnail_url ?? undefined,
    });

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
