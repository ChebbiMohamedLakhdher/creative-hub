"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CommunityReplyForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch(`/api/forums/${topicId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    if (response.status === 401) { router.push("/sign-in"); return; }
    if (!response.ok) { setError("Please write a reply."); return; }
    setBody(""); router.refresh();
  };
  return <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Join the discussion</h2><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Share your thoughts..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />{error && <p className="text-sm text-red-500">{error}</p>}<button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Reply</button></form>;
}
