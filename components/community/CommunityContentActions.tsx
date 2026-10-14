"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  type: "topic" | "post";
  topicId: string;
  itemId: string;
  initialTitle?: string;
  initialBody: string;
};

export default function CommunityContentActions({ type, topicId, itemId, initialTitle, initialBody }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState("");
  const endpoint = type === "topic" ? `/api/forums/${itemId}` : `/api/forums/${topicId}/posts/${itemId}`;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(type === "topic" ? { title, body } : { body }),
    });
    if (!response.ok) {
      setError("Please check your text and try again.");
      return;
    }
    setEditing(false);
    router.refresh();
  };

  const remove = async () => {
    if (!window.confirm(`Delete this ${type === "topic" ? "topic" : "reply"}?`)) return;
    const response = await fetch(endpoint, { method: "DELETE" });
    if (response.ok) {
      if (type === "topic") router.push("/community");
      else router.refresh();
    } else {
      setError("Unable to delete this item.");
    }
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="mt-4 space-y-2">
        {type === "topic" && <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />}
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white">Save</button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-4 flex gap-3 text-xs">
      <button type="button" onClick={() => setEditing(true)} className="text-primary hover:underline">Edit</button>
      <button type="button" onClick={remove} className="text-red-500 hover:underline">Delete</button>
      {error && <span className="text-red-500">{error}</span>}
    </div>
  );
}
