import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ProjectCategory, VALID_FILE_TYPES } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function getCategoryColor(category: ProjectCategory): string {
  const colors: Record<ProjectCategory, string> = {
    "3D": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Image: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Audio: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    PDF: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };
  return colors[category];
}

export function validateFileType(
  file: File,
  category: ProjectCategory
): boolean {
  const config = VALID_FILE_TYPES[category];
  const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
  return (
    config.extensions.includes(extension) ||
    config.mimeTypes.includes(file.type)
  );
}

export function generateUsername(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
): string {
  if (firstName && lastName) {
    return `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(
      /[^a-z0-9]/g,
      ""
    );
  }
  if (firstName) return firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (email) return email.split("@")[0].replace(/[^a-z0-9]/g, "");
  return `user${Date.now()}`;
}

export function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/object/public/projects/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}
