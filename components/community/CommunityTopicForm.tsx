"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function CommunityTopicForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/forums", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body }) });
    if (response.status === 401) { router.push("/sign-in"); return; }
    if (!response.ok) { setError("Please provide a title and message."); return; }
    const topic = await response.json();
    router.push(`/community/${topic.id}`);
  };
  if (!open) return <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> New discussion</button>;
  return <form onSubmit={create} className="space-y-2 rounded-xl border border-border bg-card p-4 sm:w-96"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Discussion title" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" /><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What would you like to discuss?" rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />{error && <p className="text-xs text-red-500">{error}</p>}<div className="flex gap-2"><button className="rounded-lg bg-primary px-3 py-2 text-sm text-white">Post</button><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border px-3 py-2 text-sm">Cancel</button></div></form>;
}
