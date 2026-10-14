"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle, MessageSquare } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  actor: { id: string; username: string } | null;
  projectId: string | null;
  topicId: string | null;
  readAt: string | null;
  createdAt: string;
};

function notificationText(notification: Notification) {
  const actor = notification.actor ? `@${notification.actor.username}` : "Someone";
  if (notification.type === "LIKE") return `${actor} liked your project`;
  if (notification.type === "MESSAGE") return `${actor} sent you a message`;
  if (notification.type === "FORUM_REPLY") return `${actor} replied to your forum discussion`;
  return "You have a new notification";
}

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const response = await fetch("/api/notifications");
    if (response.ok) setNotifications((await response.json()).notifications);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    setNotifications((items) => items.map((item) => ({ ...item, readAt: new Date().toISOString() })));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-medium text-primary">Activity</p><h1 className="mt-1 text-3xl font-bold">Notifications</h1></div>
        <button onClick={markAllRead} className="text-sm font-medium text-primary hover:underline">Mark all read</button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading && <p className="p-6 text-sm text-muted">Loading notifications...</p>}
        {!loading && notifications.length === 0 && <div className="p-10 text-center text-muted"><Bell className="mx-auto h-10 w-10 opacity-40" /><p className="mt-3">You&apos;re all caught up.</p></div>}
        {notifications.map((notification) => {
          const href = notification.type === "LIKE" && notification.projectId
            ? `/projects/${notification.projectId}`
            : notification.type === "FORUM_REPLY" && notification.topicId
              ? `/community/${notification.topicId}`
              : notification.type === "MESSAGE" && notification.actor
                ? `/messages?userId=${notification.actor.id}`
                : "/notifications";
          const Icon = notification.type === "LIKE" ? Heart : notification.type === "MESSAGE" ? MessageCircle : MessageSquare;
          return <Link key={notification.id} href={href} onClick={() => !notification.readAt && fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: notification.id }) })} className={`flex items-center gap-4 border-b border-border p-5 last:border-b-0 hover:bg-background ${!notification.readAt ? "bg-primary/5" : ""}`}>
            <Icon className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1"><p className="text-sm">{notificationText(notification)}</p><p className="mt-1 text-xs text-muted">{new Date(notification.createdAt).toLocaleString()}</p></div>
            {!notification.readAt && <span className="h-2 w-2 rounded-full bg-primary" />}
          </Link>;
        })}
      </div>
    </div>
  );
}
