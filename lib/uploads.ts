import { promises as fs } from "fs";
import path from "path";
import type { ProjectCategory } from "@/types";
import {
  getSupabaseAdmin,
  hasSupabaseStorage,
  supabaseStorageBucket,
} from "@/lib/supabase";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

function shouldUseSupabaseStorage() {
  if (hasSupabaseStorage()) return true;
  if (process.env.VERCEL) {
    throw new Error(
      "Vercel cannot write to the local filesystem. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, and create a public Storage bucket named uploads."
    );
  }
  return false;
}

export async function saveProjectUpload(
  clerkId: string,
  category: ProjectCategory,
  file: File
): Promise<{ file_url: string; thumbnail_url: string | null; file_path: string }> {
  const upload = await saveUploadFile(clerkId, category, file);

  return {
    ...upload,
    thumbnail_url: category === "Image" ? upload.file_url : null,
  };
}

export async function savePreviewUpload(
  clerkId: string,
  category: ProjectCategory,
  file: File
): Promise<string> {
  const upload = await saveUploadFile(clerkId, category, file, "previews");
  return upload.file_url;
}

async function saveUploadFile(
  clerkId: string,
  category: ProjectCategory,
  file: File,
  directory: string = category
): Promise<{ file_url: string; file_path: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const relativePath = `${clerkId}/${directory}/${timestamp}-${safeName}`;

  if (shouldUseSupabaseStorage()) {
    const supabase = getSupabaseAdmin();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(supabaseStorageBucket)
      .upload(relativePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
    }

    const { data } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(relativePath);
    return {
      file_url: data.publicUrl,
      file_path: relativePath,
    };
  }

  const absolutePath = path.join(uploadsDir, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return {
    file_url: `/uploads/${relativePath}`,
    file_path: relativePath,
  };
}

function supabaseObjectPath(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    const marker = `/storage/v1/object/public/${supabaseStorageBucket}/`;
    const index = url.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export async function removeProjectFile(fileUrl: string | null | undefined) {
  if (!fileUrl) return;

  const storagePath = supabaseObjectPath(fileUrl);
  if (storagePath && hasSupabaseStorage()) {
    const { error } = await getSupabaseAdmin()
      .storage.from(supabaseStorageBucket)
      .remove([storagePath]);
    if (error && !error.message.toLowerCase().includes("not found")) {
      throw error;
    }
    return;
  }

  if (!fileUrl.startsWith("/uploads/")) return;

  const relativePath = fileUrl.slice("/uploads/".length).split("/").join(path.sep);
  const absolutePath = path.join(uploadsDir, relativePath);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
