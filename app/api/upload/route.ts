import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveProjectUpload } from "@/lib/local-store";
import { MAX_FILE_SIZE, ProjectCategory, VALID_FILE_TYPES } from "@/types";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");
    const file = fileValue instanceof File ? fileValue : null;
    const categoryValue = formData.get("category");
    const category =
      typeof categoryValue === "string" &&
      Object.prototype.hasOwnProperty.call(VALID_FILE_TYPES, categoryValue)
        ? (categoryValue as ProjectCategory)
        : null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!category || !VALID_FILE_TYPES[category]) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const fileRules = VALID_FILE_TYPES[category];
    const validExtensions = fileRules.extensions;
    if (!validExtensions.includes(extension)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${validExtensions.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.type && !fileRules.mimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "The file MIME type does not match the selected category" },
        { status: 400 }
      );
    }

    const { file_url, thumbnail_url, file_path } = await saveProjectUpload(
      user.clerk_id,
      category,
      file
    );

    return NextResponse.json({
      file_url,
      thumbnail_url,
      file_path,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
