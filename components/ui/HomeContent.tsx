"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import { Project, ProjectCategory, ProjectSuggestion } from "@/types";
import CategoryFilter from "./CategoryFilter";
import SearchBar from "./SearchBar";
import ProjectGrid from "./ProjectGrid";

interface HomeContentProps {
  initialProjects: Project[];
  trendingProjects: Project[];
}

const PAGE_SIZE = 12;

export default function HomeContent({
  initialProjects,
  trendingProjects,
}: HomeContentProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [category, setCategory] = useState<ProjectCategory | "All">("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProjects.length >= PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const skipNextFetch = useRef(true);
  const [discoveryPrompt, setDiscoveryPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<ProjectSuggestion[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchProjects = useCallback(
    async (pageNum: number, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: PAGE_SIZE.toString(),
        });
        if (category !== "All") params.set("category", category);
        if (search) params.set("search", search);

        const res = await fetch(`/api/projects?${params}`);
        const data = await res.json();
        const nextProjects: Project[] = data.projects ?? [];

        if (append) {
          setProjects((prev) => [...prev, ...nextProjects]);
        } else {
          setProjects(nextProjects);
        }
        setHasMore(nextProjects.length >= PAGE_SIZE);
      } catch {
        // keep existing projects on error
      } finally {
        setLoading(false);
      }
    },
    [category, search]
  );

  useEffect(() => {
    if (skipNextFetch.current && category === "All" && !search) {
      skipNextFetch.current = false;
      return;
    }
    skipNextFetch.current = false;
    setPage(1);
    fetchProjects(1, false);
  }, [category, search, fetchProjects]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProjects(nextPage, true);
  };

  const discover = async () => {
    const prompt = discoveryPrompt.trim();
    if (prompt.length < 3) {
      setDiscoveryError("Describe what you want to make or find.");
      return;
    }
    setDiscoveryLoading(true);
    setDiscoveryError("");
    try {
      const response = await fetch(`/api/discover?q=${encodeURIComponent(prompt)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Search failed");
      setSuggestions(data.suggestions ?? []);
    } catch (error) {
      setDiscoveryError(error instanceof Error ? error.message : "Search failed");
      setSuggestions([]);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <div className="w-full">
            <h2 className="text-xl font-bold text-foreground">Find inspiration for your next project</h2>
            <p className="mt-1 text-sm text-muted">
              Describe what you want to make, and we&apos;ll suggest useful work from the community.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={discoveryPrompt}
                onChange={(event) => setDiscoveryPrompt(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") void discover(); }}
                maxLength={300}
                placeholder="e.g. I need an ambient soundtrack for a short film"
                className="min-h-11 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => void discover()}
                disabled={discoveryLoading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {discoveryLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {discoveryLoading ? "Finding..." : "Suggest work"}
              </button>
            </div>
            {discoveryError && <p className="mt-2 text-sm text-red-500">{discoveryError}</p>}
            {suggestions.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 text-sm font-medium text-foreground">Suggested for you</p>
                <ProjectGrid projects={suggestions.map(({ project }) => project)} />
                <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
                  {suggestions.map(({ project, reason }) => (
                    <p key={project.id}><span className="font-medium text-foreground">{project.title}:</span> {reason}</p>
                  ))}
                </div>
              </div>
            )}
            {!discoveryLoading && discoveryPrompt.trim().length >= 3 && suggestions.length === 0 && !discoveryError && (
              <p className="mt-4 text-sm text-muted">No close matches yet. Try adding a medium, style, or goal.</p>
            )}
          </div>
        </div>
      </section>
      {trendingProjects.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-bold text-foreground">
            Trending
          </h2>
          <ProjectGrid projects={trendingProjects} />
        </section>
      )}

      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            Latest Projects
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-64">
              <SearchBar value={searchInput} onChange={setSearchInput} />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>

        <ProjectGrid
          projects={projects}
          emptyMessage={
            loading
              ? "Loading projects..."
              : search
                ? `No projects found for "${search}"`
                : "No projects yet. Be the first to upload!"
          }
        />

        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
