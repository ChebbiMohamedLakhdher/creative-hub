import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { Project, ProjectSuggestion } from "@/types";

const stopWords = new Set([
  "a", "an", "and", "for", "i", "in", "is", "it", "make", "my", "of", "or",
  "some", "that", "the", "to", "with", "work", "looking", "need", "want",
]);

const synonyms: Record<string, string[]> = {
  architecture: ["architectural", "building", "house", "space", "courtyard"],
  ambient: ["sound", "audio", "music", "field", "recording"],
  branding: ["brand", "identity", "logo", "mark"],
  generative: ["procedural", "creative", "code", "interactive"],
  minimal: ["simple", "clean", "soft"],
  photography: ["photo", "photographic", "light", "visual"],
  typography: ["type", "font", "editorial", "poster"],
  ui: ["ux", "interface", "product", "wayfinding"],
};

const categoryTerms: Record<Project["category"], string[]> = {
  "3D": ["3d", "model", "blender", "render", "sculpt", "architectural"],
  Image: ["image", "photo", "illustration", "poster", "visual", "picture"],
  Audio: ["audio", "sound", "music", "song", "ambient", "recording"],
  PDF: ["pdf", "guide", "document", "worksheet", "zine", "research"],
};

const projectInclude = {
  user: true,
  category: true,
  tags: { include: { tag: true } },
  _count: { select: { likes: true, views: true } },
} satisfies Prisma.ProjectInclude;

function normalize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1 && !stopWords.has(term));
}

function toProject(project: Prisma.ProjectGetPayload<{ include: typeof projectInclude }>): Project {
  return {
    id: project.id,
    user_id: project.userId,
    title: project.title,
    description: project.description,
    category: project.category.slug as Project["category"],
    file_url: project.mediaUrl,
    thumbnail_url: project.thumbnailUrl,
    likes_count: project.likesCount,
    views_count: project.viewsCount,
    created_at: project.createdAt.toISOString(),
    updated_at: project.updatedAt.toISOString(),
    user: {
      id: project.user.id,
      clerk_id: project.user.clerkId,
      username: project.user.username,
      avatar_url: project.user.avatarUrl,
      bio: project.user.bio,
      created_at: project.user.createdAt.toISOString(),
    },
  };
}

export async function suggestProjects(prompt: string, limit = 8): Promise<ProjectSuggestion[]> {
  const terms = normalize(prompt);
  if (terms.length === 0) return [];

  const expandedTerms = new Set(terms);
  for (const term of terms) {
    for (const related of synonyms[term] ?? []) expandedTerms.add(related);
  }

  const projects = await db.project.findMany({
    where: { status: "ACTIVE", visibility: "PUBLIC" },
    include: projectInclude,
    orderBy: [{ likesCount: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return projects
    .map((project) => {
      const category = project.category.slug as Project["category"];
      const tags = project.tags.map(({ tag }) => `${tag.slug} ${tag.name}`).join(" ");
      const fields = {
        title: normalize(project.title),
        description: normalize(project.description ?? ""),
        category: normalize(category),
        tags: normalize(tags),
      };
      let score = 0;
      const matched: string[] = [];

      for (const term of Array.from(expandedTerms)) {
        if (fields.title.includes(term)) {
          score += 8;
          matched.push(term);
        } else if (fields.tags.includes(term)) {
          score += 6;
          matched.push(term);
        } else if (fields.category.includes(term)) {
          score += 5;
          matched.push(term);
        } else if (fields.description.includes(term)) {
          score += 3;
          matched.push(term);
        }
      }

      const inferredCategory = (Object.entries(categoryTerms) as [Project["category"], string[]][])
        .find(([, categoryWords]) => terms.some((term) => categoryWords.includes(term)))?.[0];
      if (inferredCategory === category) {
        score += 10;
        matched.push(category);
      }

      if (score === 0) return null;
      const uniqueMatches = Array.from(new Set(matched)).slice(0, 4);
      return {
        project: toProject(project),
        score,
        reason: inferredCategory === category
          ? `Matches your ${category} direction${uniqueMatches.length ? ` with ${uniqueMatches.join(", ")}` : ""}.`
          : `Related through ${uniqueMatches.join(", ")}.`,
      };
    })
    .filter((suggestion): suggestion is ProjectSuggestion => suggestion !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
