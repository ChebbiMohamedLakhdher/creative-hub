"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileIcon } from "lucide-react";
import { ProjectCategory, MAX_FILE_SIZE, VALID_FILE_TYPES } from "@/types";
import { cn, validateFileType } from "@/lib/utils";

interface FileUploadProps {
  category: ProjectCategory;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export default function FileUpload({
  category,
  onFileSelect,
  selectedFile,
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        setError("File too large. Maximum size is 50MB.");
        return;
      }

      if (!validateFileType(file, category)) {
        const extensions = VALID_FILE_TYPES[category].extensions.join(", ");
        setError(`Invalid file type. Allowed: ${extensions}`);
        return;
      }

      onFileSelect(file);
    },
    [category, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: MAX_FILE_SIZE,
  });

  const removeFile = () => {
    onFileSelect(null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      {selectedFile ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <FileIcon className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="rounded-lg p-2 text-muted hover:bg-border hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-card"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-4 font-medium text-foreground">
            {isDragActive ? "Drop your file here" : "Drag & drop your file here"}
          </p>
          <p className="mt-1 text-sm text-muted">or click to browse</p>
          <p className="mt-2 text-xs text-muted">
            Max 50MB &middot;{" "}
            {VALID_FILE_TYPES[category].extensions.join(", ")}
          </p>
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
