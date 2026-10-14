"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Send } from "lucide-react";

type Conversation = {
  id: string;
  otherUser: { id: string; username: string; avatarUrl: string | null };
  lastMessage: { body: string; createdAt: string } | null;
};
type Chat = Conversation & {
  messages: Array<{ id: string; body: string; senderId: string; createdAt: string }>;
};

export default function MessagesClient({ currentUserId }: { currentUserId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    const response = await fetch("/api/messages");
    if (!response.ok) throw new Error("Unable to load messages");
    setConversations((await response.json()).conversations);
  };
  const openChat = async (userId: string) => {
    const response = await fetch(`/api/messages?userId=${userId}`);
    if (!response.ok) throw new Error("Unable to open conversation");
    const result = await response.json();
    if (result) setChat({ ...result, id: result.id, otherUser: result.otherUser, lastMessage: null });
  };
  useEffect(() => {
    loadConversations().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const userId = new URLSearchParams(window.location.search).get("userId");
    if (userId) openChat(userId).catch((err) => setError(err.message));
  }, []);
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!chat || !body.trim()) return;
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: chat.otherUser.id, body: body.trim() }),
    });
    if (!response.ok) { setError("Unable to send message"); return; }
    setBody("");
    await openChat(chat.otherUser.id);
    await loadConversations();
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <p className="text-sm font-medium text-primary">Private conversations</p>
        <h1 className="mt-1 text-3xl font-bold">Messages</h1>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <div className="grid min-h-[500px] overflow-hidden rounded-xl border border-border bg-card md:grid-cols-[280px_1fr]">
        <aside className="border-b border-border md:border-b-0 md:border-r">
          <div className="border-b border-border p-4 font-semibold">Conversations</div>
          {loading ? <p className="p-4 text-sm text-muted">Loading...</p> : conversations.map((conversation) => (
            <button key={conversation.id} onClick={() => openChat(conversation.otherUser.id)} className="w-full border-b border-border p-4 text-left hover:bg-background">
              <p className="font-medium">@{conversation.otherUser.username}</p>
              <p className="mt-1 truncate text-xs text-muted">{conversation.lastMessage?.body ?? "Start a conversation"}</p>
            </button>
          ))}
          {!loading && conversations.length === 0 && <p className="p-4 text-sm text-muted">Visit a user profile to start a conversation.</p>}
        </aside>
        <section className="flex flex-col">
          {chat ? (
            <>
              <div className="border-b border-border p-4">
                <Link href={`/users/${chat.otherUser.id}`} className="font-semibold hover:text-primary">@{chat.otherUser.username}</Link>
              </div>
              <div className="flex-1 space-y-3 p-4">
                {chat.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
                    <p className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${message.senderId === currentUserId ? "bg-primary text-white" : "bg-background"}`}>{message.body}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-border p-4">
                <input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message..." className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" maxLength={5000} />
                <button className="rounded-lg bg-primary px-4 text-white" aria-label="Send message"><Send className="h-4 w-4" /></button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted">
              <MessageCircle className="h-12 w-12 opacity-40" />
              <p className="mt-3">Select a conversation to start chatting.</p>
            </div>
          )}
        </section>
      </div>
      {loading && <Loader2 className="mx-auto h-5 w-5 animate-spin" />}
    </div>
  );
}
