import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { listTopics } from "@/lib/community-store";
import CommunityTopicForm from "@/components/community/CommunityTopicForm";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const topics = await listTopics();
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-primary">CreativeHub community</p><h1 className="mt-1 text-3xl font-bold">Forums</h1><p className="mt-2 text-muted">Ask questions, share ideas, and learn from other creators.</p></div>
        <CommunityTopicForm />
      </div>
      <div className="space-y-3">
        {topics.map((topic) => (
          <Link key={topic.id} href={`/community/${topic.id}`} className="flex items-center justify-between rounded-xl border border-border bg-card p-5 hover:border-primary/50">
            <div><h2 className="font-semibold">{topic.title}</h2><p className="mt-1 text-sm text-muted">Started by @{topic.author.username} · {topic._count.posts} replies</p></div>
            <MessageSquare className="h-5 w-5 text-muted" />
          </Link>
        ))}
        {topics.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted"><Plus className="mx-auto h-8 w-8" /><p className="mt-2">Be the first to start a discussion.</p></div>}
      </div>
    </div>
  );
}
