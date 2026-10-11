"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Project, ProjectCategory } from "@/types";
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

  return (
    <div className="space-y-12">
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
