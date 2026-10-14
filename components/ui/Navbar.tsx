"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { Moon, Sun, Upload, Palette, Menu, X, MessageCircle, Bell } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload" },
  { href: "/community", label: "Community" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/admin", { method: "HEAD" })
      .then((response) => {
        if (active) setIsAdmin(response.ok);
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/notifications")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (active && data) setUnreadNotifications(data.unreadCount);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Palette className="h-6 w-6 text-primary" />
          <span>CreativeHub</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith("/admin") ? "text-primary" : "text-muted"
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-card hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <SignedIn>
            <Link href="/notifications" className="relative hidden rounded-lg p-2 text-muted hover:bg-card hover:text-primary sm:flex" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
            </Link>
            <Link href="/messages" className="hidden rounded-lg p-2 text-muted hover:bg-card hover:text-primary sm:flex" aria-label="Messages">
              <MessageCircle className="h-5 w-5" />
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary sm:flex"
              >
                Admin
              </Link>
            )}
            <Link
              href="/upload"
              className="hidden items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:flex"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Link>
            <UserButton afterSignOutUrl="/">
              <UserButton.MenuItems>
                <UserButton.Link
                  label="My profile"
                  labelIcon={<Palette className="h-4 w-4" />}
                  href="/me"
                />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <button
            className="rounded-lg p-2 text-muted hover:bg-card hover:text-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium",
                pathname === link.href ? "text-primary" : "text-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
          <SignedIn>
            <Link href="/notifications" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted">
              <Bell className="h-4 w-4" /> Notifications {unreadNotifications > 0 && `(${unreadNotifications})`}
            </Link>
            <Link href="/messages" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted">
              <MessageCircle className="h-4 w-4" /> Messages
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-muted"
              >
                Admin dashboard
              </Link>
            )}
            <Link
              href="/me"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-muted"
            >
              My profile
            </Link>
          </SignedIn>
        </nav>
      )}
    </header>
  );
}
