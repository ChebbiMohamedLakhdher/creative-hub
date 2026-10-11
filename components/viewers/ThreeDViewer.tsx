"use client";

import { useEffect, useRef } from "react";

interface ThreeDViewerProps {
  src: string;
  alt?: string;
}

export default function ThreeDViewer({ src, alt = "3D Model" }: ThreeDViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = "model-viewer-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "module";
      script.src =
        "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div ref={containerRef} className="h-[500px] w-full rounded-xl bg-gray-100 dark:bg-gray-800">
      <model-viewer
        src={src}
        alt={alt}
        auto-rotate
        camera-controls
        shadow-intensity="1"
        exposure="1"
        loading="lazy"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
