"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn, formatCount } from "@/lib/utils";

interface LikeButtonProps {
  projectId: string;
  initialLiked: boolean;
  initialCount: number;
  disabled?: boolean;
}

export default function LikeButton({
  projectId,
  initialLiked,
  initialCount,
  disabled = false,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (disabled || loading) return;

    setLoading(true);
    const wasLiked = liked;

    setLiked(!wasLiked);
    setCount((c) => (wasLiked ? c - 1 : c + 1));

    try {
      const res = await fetch(`/api/projects/${projectId}/like`, {
        method: "POST",
      });

      if (!res.ok) {
        setLiked(wasLiked);
        setCount((c) => (wasLiked ? c + 1 : c - 1));
      } else {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.likes_count);
      }
    } catch {
      setLiked(wasLiked);
      setCount((c) => (wasLiked ? c + 1 : c - 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={disabled || loading}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors",
        liked
          ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
          : "border-border bg-card text-muted hover:border-red-200 hover:text-red-600",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <Heart className={cn("h-5 w-5", liked && "fill-current")} />
      <span className="font-medium">{formatCount(count)}</span>
    </button>
  );
}
