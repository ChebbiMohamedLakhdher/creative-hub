import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import { getCurrentUser } from "@/lib/auth";
import LikeButton from "@/components/ui/LikeButton";
import ProjectActions from "@/components/ui/ProjectActions";
import ProjectGrid from "@/components/ui/ProjectGrid";
import { formatDate, formatCount, getCategoryColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Eye, Calendar } from "lucide-react";
import type { Metadata } from "next";
import { Project } from "@/types";
import {
  getCurrentUserLike,
  getProjectById,
  incrementProjectViews,
  listProjects,
} from "@/lib/store";

export const dynamic = "force-dynamic";

const ThreeDViewer = dynamicImport(
  () => import("@/components/viewers/ThreeDViewer"),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);
const AudioPlayer = dynamicImport(
  () => import("@/components/viewers/AudioPlayer"),
  { loading: () => <ViewerSkeleton /> }
);
const PDFViewer = dynamicImport(
  () => import("@/components/viewers/PDFViewer"),
  { loading: () => <ViewerSkeleton /> }
);
const ImageGallery = dynamicImport(
  () => import("@/components/viewers/ImageGallery"),
  { loading: () => <ViewerSkeleton /> }
);

function ViewerSkeleton() {
  return (
    <div className="h-[400px] animate-pulse rounded-xl bg-border" />
  );
}

async function getProject(id: string) {
  return getProjectById(id);
}

async function getRelatedProjects(userId: string, projectId: string) {
  const projects = await listProjects({ userId, limit: 4, sort: "latest" });
  return projects.filter((project) => project.id !== projectId);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return { title: "Project Not Found" };

  return {
    title: project.title,
    description: project.description ?? `View ${project.title} on CreativeHub`,
    openGraph: {
      title: project.title,
      description: project.description ?? undefined,
      images: project.thumbnail_url ? [project.thumbnail_url] : [],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) notFound();

  await incrementProjectViews(id);
  const refreshedProject = await getProject(id);

  const relatedProjects = await getRelatedProjects(project.user_id, id);
  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === refreshedProject?.user_id;
  const isSignedIn = !!currentUser;
  const user_liked = currentUser
    ? await getCurrentUserLike(id, currentUser.id)
    : false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {project.category === "3D" && (
            <ThreeDViewer src={refreshedProject?.file_url ?? project.file_url} alt={project.title} />
          )}
          {project.category === "Image" && (
            <ImageGallery src={refreshedProject?.file_url ?? project.file_url} alt={project.title} />
          )}
          {project.category === "Audio" && (
            <AudioPlayer src={refreshedProject?.file_url ?? project.file_url} title={project.title} />
          )}
          {project.category === "PDF" && (
            <PDFViewer src={refreshedProject?.file_url ?? project.file_url} title={project.title} />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <span
              className={cn(
                "inline-block rounded-full px-3 py-1 text-xs font-medium",
                getCategoryColor(project.category)
              )}
            >
              {project.category}
            </span>
            <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
              {project.title}
            </h1>
            {project.description && (
              <p className="mt-3 text-muted">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <LikeButton
              projectId={project.id}
              initialLiked={user_liked}
              initialCount={refreshedProject?.likes_count ?? project.likes_count}
              disabled={!isSignedIn}
            />
            <div className="flex items-center gap-1 text-muted">
              <Eye className="h-5 w-5" />
              <span>{formatCount(refreshedProject?.views_count ?? project.views_count)} views</span>
            </div>
          </div>

          {isOwner && (
            <ProjectActions
              projectId={project.id}
                title={refreshedProject?.title ?? project.title}
                description={refreshedProject?.description ?? project.description}
            />
          )}

          <div className="flex items-center gap-2 text-sm text-muted">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(project.created_at)}</span>
          </div>

          {project.user && (
            <Link
              href={`/users/${project.user.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              {project.user.avatar_url ? (
                <Image
                  src={project.user.avatar_url}
                  alt={project.user.username}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/20" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  @{project.user.username}
                </p>
                <p className="text-sm text-muted">View profile</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {relatedProjects.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-foreground">
            More from @{project.user?.username}
          </h2>
          <ProjectGrid projects={relatedProjects as Project[]} />
        </section>
      )}
    </div>
  );
}
