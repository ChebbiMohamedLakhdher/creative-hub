"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, X } from "lucide-react";

interface ImageGalleryProps {
  src: string;
  alt: string;
}

export default function ImageGallery({ src, alt }: ImageGalleryProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <div
        className="group relative cursor-zoom-in overflow-hidden rounded-xl"
        onClick={() => setIsZoomed(true)}
      >
        <div className="relative aspect-video w-full">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>

      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            className="absolute right-4 top-4 rounded-lg p-2 text-white hover:bg-white/10"
            onClick={() => setIsZoomed(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <button
            className="absolute left-4 top-4 rounded-lg p-2 text-white hover:bg-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <ZoomOut className="h-6 w-6" />
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="max-h-[90vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
