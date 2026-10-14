import { notFound } from "next/navigation";
import { getTopic } from "@/lib/community-store";
import CommunityReplyForm from "@/components/community/CommunityReplyForm";
import CommunityContentActions from "@/components/community/CommunityContentActions";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const topic = await getTopic((await params).id);
  if (!topic) notFound();
  const user = await getCurrentUser();
  return <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
    <article className="rounded-xl border border-border bg-card p-6"><p className="text-sm text-muted">@{topic.author.username}</p><h1 className="mt-2 text-3xl font-bold">{topic.title}</h1><p className="mt-5 whitespace-pre-wrap text-foreground">{topic.body}</p>{user?.id === topic.authorId && <CommunityContentActions type="topic" topicId={topic.id} itemId={topic.id} initialTitle={topic.title} initialBody={topic.body} />}</article>
    <div className="space-y-3"><h2 className="text-xl font-semibold">{topic.posts.length} replies</h2>{topic.posts.map((post) => <article key={post.id} className="rounded-xl border border-border bg-card p-5"><p className="text-sm font-medium">@{post.author.username}</p><p className="mt-3 whitespace-pre-wrap text-sm">{post.body}</p>{user?.id === post.authorId && <CommunityContentActions type="post" topicId={topic.id} itemId={post.id} initialBody={post.body} />}</article>)}</div>
    <CommunityReplyForm topicId={topic.id} />
  </div>;
}
