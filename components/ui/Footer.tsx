import Link from "next/link";
import { Palette } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Palette className="h-4 w-4 text-primary" />
          <span>CreativeHub &copy; {new Date().getFullYear()}</span>
        </div>
        <p className="text-sm text-muted">
          Showcase and discover creative projects
        </p>
        <div className="flex gap-4 text-sm text-muted">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/upload" className="hover:text-primary transition-colors">
            Upload
          </Link>
        </div>
      </div>
    </footer>
  );
}
