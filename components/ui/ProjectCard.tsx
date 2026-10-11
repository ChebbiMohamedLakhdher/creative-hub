"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Eye, Box, ImageIcon, Music, FileText } from "lucide-react";
import { Project } from "@/types";
import { cn, formatCount, getCategoryColor } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

const categoryIcons = {
  "3D": Box,
  Image: ImageIcon,
  Audio: Music,
  PDF: FileText,
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const CategoryIcon = categoryIcons[project.category];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
        {project.thumbnail_url ? (
          <Image
            src={project.thumbnail_url}
            alt={project.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CategoryIcon className="h-16 w-16 text-muted opacity-50" />
          </div>
        )}
        <span
          className={cn(
            "absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-medium",
            getCategoryColor(project.category)
          )}
        >
          {project.category}
        </span>
      </div>

      <div className="p-4">
        <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
          {project.title}
        </h3>

        {project.user && (
          <div className="mt-2 flex items-center gap-2">
            {project.user.avatar_url ? (
              <Image
                src={project.user.avatar_url}
                alt={project.user.username}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-primary/20" />
            )}
            <span className="text-sm text-muted">@{project.user.username}</span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-4 text-sm text-muted">
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {formatCount(project.likes_count)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {formatCount(project.views_count)}
          </span>
        </div>
      </div>
    </Link>
  );
}
