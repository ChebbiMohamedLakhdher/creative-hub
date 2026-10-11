export type ProjectCategory = "3D" | "Image" | "Audio" | "PDF";

export interface User {
  id: string;
  clerk_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: ProjectCategory;
  file_url: string;
  thumbnail_url: string | null;
  likes_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  user_liked?: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  category: ProjectCategory;
  file_url: string;
  thumbnail_url?: string;
}

export interface ProjectsQueryParams {
  category?: ProjectCategory | "All";
  search?: string;
  page?: number;
  limit?: number;
  userId?: string;
  sort?: "latest" | "trending";
}

export const VALID_FILE_TYPES: Record<
  ProjectCategory,
  { extensions: string[]; mimeTypes: string[] }
> = {
  "3D": {
    extensions: [".glb", ".gltf"],
    mimeTypes: ["model/gltf-binary", "model/gltf+json", "application/octet-stream"],
  },
  Image: {
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"],
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/avif",
    ],
  },
  Audio: {
    extensions: [".mp3", ".wav", ".ogg", ".m4a", ".flac"],
    mimeTypes: [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/x-m4a",
      "audio/flac",
    ],
  },
  PDF: {
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
  },
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
