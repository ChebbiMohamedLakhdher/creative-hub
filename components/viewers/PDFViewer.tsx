"use client";

import { Download, ExternalLink } from "lucide-react";

interface PDFViewerProps {
  src: string;
  title?: string;
}

export default function PDFViewer({ src, title }: PDFViewerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {title && (
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        )}
        <div className="flex gap-2">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:bg-card hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </a>
          <a
            href={src}
            download
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <iframe
          src={`${src}#toolbar=1`}
          className="h-[600px] w-full"
          title={title ?? "PDF Document"}
        />
      </div>
    </div>
  );
}
