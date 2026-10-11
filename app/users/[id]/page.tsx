import { notFound } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import ProjectGrid from "@/components/ui/ProjectGrid";
import EditProfileForm from "@/components/ui/EditProfileForm";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { Project } from "@/types";
import { getUserById, getUserProjects } from "@/lib/local-store";

async function getUser(id: string) {
  return getUserById(id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) return { title: "User Not Found" };

  return {
    title: `@${user.username}`,
    description: user.bio ?? `View ${user.username}'s creative portfolio on CreativeHub`,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) notFound();

  const projects = await getUserProjects(id);
  const currentUser = await getCurrentUser();
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-12 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.username}
            width={96}
            height={96}
            className="rounded-full"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-primary/20" />
        )}

        <div className="mt-4 sm:mt-0 sm:ml-6">
          <h1 className="text-3xl font-bold text-foreground">
            @{user.username}
          </h1>
          {user.bio && (
            <p className="mt-2 max-w-xl text-muted">{user.bio}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-muted sm:justify-start">
            <span>{projects.length} projects</span>
            <span>Joined {formatDate(user.created_at)}</span>
          </div>
          {isOwnProfile && (
            <EditProfileForm username={user.username} bio={user.bio} />
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-6 text-2xl font-bold text-foreground">Projects</h2>
        <ProjectGrid
          projects={projects as Project[]}
          emptyMessage={`@${user.username} hasn't uploaded any projects yet.`}
        />
      </section>
    </div>
  );
}
