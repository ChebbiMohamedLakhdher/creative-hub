import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { savePreviewUpload, saveProjectUpload } from "@/lib/uploads";
import { MAX_FILE_SIZE, VALID_FILE_TYPES } from "@/types";
import { projectCategorySchema } from "@/lib/validations/project";

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
    const categoryResult = projectCategorySchema.safeParse(categoryValue);
    const category = categoryResult.success ? categoryResult.data : null;

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

    const previewValue = formData.get("preview");
    if (previewValue instanceof File) {
      if (category === "Image") {
        return NextResponse.json(
          { error: "Image projects use the uploaded image as their preview" },
          { status: 400 }
        );
      }

      const previewExtension = `.${previewValue.name.split(".").pop()?.toLowerCase()}`;
      const previewRules = VALID_FILE_TYPES.Image;
      if (
        previewValue.size > MAX_FILE_SIZE ||
        !previewRules.extensions.includes(previewExtension) ||
        (previewValue.type && !previewRules.mimeTypes.includes(previewValue.type))
      ) {
        return NextResponse.json(
          { error: "Invalid preview image. Please upload a valid image under 50MB." },
          { status: 400 }
        );
      }
    }

    const { file_url, thumbnail_url, file_path } = await saveProjectUpload(
      user.clerk_id,
      category,
      file
    );
    let previewUrl = thumbnail_url;
    if (previewValue instanceof File) {
      previewUrl = await savePreviewUpload(user.clerk_id, category, previewValue);
    }

    return NextResponse.json({
      file_url,
      thumbnail_url: previewUrl,
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
