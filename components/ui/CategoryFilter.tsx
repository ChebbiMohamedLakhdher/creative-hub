"use client";

import { ProjectCategory } from "@/types";
import { cn } from "@/lib/utils";

const categories: (ProjectCategory | "All")[] = [
  "All",
  "3D",
  "Image",
  "Audio",
  "PDF",
];

interface CategoryFilterProps {
  selected: ProjectCategory | "All";
  onChange: (category: ProjectCategory | "All") => void;
}

export default function CategoryFilter({
  selected,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            selected === category
              ? "bg-primary text-white"
              : "bg-card text-muted hover:bg-border hover:text-foreground"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
