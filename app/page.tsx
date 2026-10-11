import HomeContent from "@/components/ui/HomeContent";
import { Project } from "@/types";
import { Sparkles } from "lucide-react";
import { listProjects } from "@/lib/local-store";

async function getProjects(): Promise<Project[]> {
  return listProjects({ limit: 12, sort: "latest" });
}

async function getTrendingProjects(): Promise<Project[]> {
  return listProjects({ limit: 4, sort: "trending" });
}

export default async function HomePage() {
  const [projects, trendingProjects] = await Promise.all([
    getProjects(),
    getTrendingProjects(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Discover Creative Work
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Welcome to CreativeHub
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Showcase your 3D models, images, audio, and PDFs. Discover amazing
          creative projects from artists around the world.
        </p>
      </section>

      <HomeContent
        initialProjects={projects}
        trendingProjects={trendingProjects}
      />
    </div>
  );
}
