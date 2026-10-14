"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Eye, Flag, Search, Trash2, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Overview = {
  users: Array<{
    id: string;
    username: string;
    clerkId: string;
    createdAt: string;
    _count: { projects: number; comments: number; likes: number };
  }>;
  projects: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    visibility: string;
    likesCount: number;
    viewsCount: number;
    createdAt: string;
    user: { id: string; username: string };
  }>;
  stats: {
    users: number;
    projects: number;
    activeProjects: number;
    flaggedProjects: number;
    openReports: number;
  };
};

const buttonClass = "rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary";

export default function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin?search=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error("Unable to load admin data");
      setData(await response.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load admin data");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const act = async (body: Record<string, string>) => {
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error ?? "Action failed");
    }
    await load();
  };

  const perform = async (body: Record<string, string>, confirmation?: string) => {
    if (confirmation && !window.confirm(confirmation)) return;
    try {
      await act(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const statCards: [string, number, LucideIcon][] = data
    ? [
        ["Users", data.stats.users, Users],
        ["Projects", data.stats.projects, Eye],
        ["Active", data.stats.activeProjects, Check],
        ["Flagged", data.stats.flaggedProjects, Flag],
        ["Open reports", data.stats.openReports, AlertTriangle],
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <p className="text-sm font-medium text-primary">Administration</p>
        <h1 className="mt-1 text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted">Manage users, projects, visibility, and moderation status.</p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error"><X className="h-4 w-4" /></button>
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {statCards.map(([label, value, Icon]) => (
              <div key={String(label)} className="rounded-xl border border-border bg-card p-5">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-4 text-2xl font-bold">{String(value)}</p>
                <p className="text-sm text-muted">{String(label)}</p>
              </div>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users or projects..."
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm"
            />
          </div>

          <section className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-5">
              <h2 className="text-xl font-semibold">Projects</h2>
            </div>
            <div className="divide-y divide-border">
              {data.projects.map((project) => (
                <div key={project.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <Link href={`/projects/${project.id}`} className="font-semibold hover:text-primary">{project.title}</Link>
                    <p className="mt-1 text-sm text-muted">
                      {project.category} by @{project.user.username} · {project.likesCount} likes · {project.viewsCount} views
                    </p>
                    <p className="mt-1 text-xs text-muted">Status: {project.status} · Visibility: {project.visibility}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.status !== "ACTIVE" && <button className={buttonClass} onClick={() => perform({ action: "activate", projectId: project.id })}>Activate</button>}
                    {project.status !== "FLAGGED" && <button className={buttonClass} onClick={() => perform({ action: "flag", projectId: project.id })}>Flag</button>}
                    {project.visibility !== "PUBLIC" && <button className={buttonClass} onClick={() => perform({ action: "publish", projectId: project.id })}>Publish</button>}
                    {project.visibility === "PUBLIC" && <button className={buttonClass} onClick={() => perform({ action: "unpublish", projectId: project.id })}>Hide</button>}
                    {project.status !== "REMOVED" && <button className={`${buttonClass} text-red-600`} onClick={() => perform({ action: "remove", projectId: project.id }, "Remove this project from the platform?")}>Remove</button>}
                  </div>
                </div>
              ))}
              {data.projects.length === 0 && <p className="p-5 text-sm text-muted">No projects found.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-5">
              <h2 className="text-xl font-semibold">Users</h2>
            </div>
            <div className="divide-y divide-border">
              {data.users.map((user) => (
                <div key={user.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/users/${user.id}`} className="font-semibold hover:text-primary">@{user.username}</Link>
                    <p className="mt-1 text-sm text-muted">{user._count.projects} projects · {user._count.comments} comments · joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button className={`${buttonClass} flex items-center gap-1 text-red-600`} onClick={() => perform({ action: "delete-user", userId: user.id }, `Delete @${user.username} and all of their content?`)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete user
                  </button>
                </div>
              ))}
              {data.users.length === 0 && <p className="p-5 text-sm text-muted">No users found.</p>}
            </div>
          </section>
        </>
      )}
      {loading && !data && <p className="text-sm text-muted">Loading dashboard...</p>}
    </div>
  );
}
