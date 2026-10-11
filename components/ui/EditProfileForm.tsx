"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface EditProfileFormProps {
  username: string;
  bio: string | null;
}

export default function EditProfileForm({ username, bio }: EditProfileFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nextUsername, setNextUsername] = useState(username);
  const [nextBio, setNextBio] = useState(bio ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: nextUsername,
          bio: nextBio,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update profile");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
      >
        Edit profile
      </button>
    );
  }

  return (
    <form onSubmit={save} className="mt-4 w-full max-w-md space-y-3 text-left">
      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          value={nextUsername}
          onChange={(e) => setNextUsername(e.target.value)}
          maxLength={24}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          value={nextBio}
          onChange={(e) => setNextBio(e.target.value)}
          maxLength={280}
          rows={3}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          placeholder="Tell people about your work"
        />
        <p className="mt-1 text-xs text-muted">{nextBio.length}/280</p>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
