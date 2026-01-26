"use client";

import { useState, useCallback, useRef } from "react";

interface UploadedFile {
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  url?: string;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function ImageUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Allowed: JPEG, PNG, GIF, WebP";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 10MB limit";
    }
    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const uploadedFiles: UploadedFile[] = fileArray.map((file) => {
      const error = validateFile(file);
      return {
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: error ? "error" : "pending",
        error: error || undefined,
      };
    });
    setFiles((prev) => [...prev, ...uploadedFiles]);
  }, []);

  const uploadFile = async (uploadedFile: UploadedFile, index: number) => {
    if (uploadedFile.status === "error") return;

    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: "uploading", progress: 0 } : f))
    );

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile.file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, progress } : f))
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setFiles((prev) =>
            prev.map((f, i) =>
              i === index
                ? { ...f, status: "completed", progress: 100, url: response.fileUrl }
                : f
            )
          );
        } else {
          const errorData = JSON.parse(xhr.responseText);
          setFiles((prev) =>
            prev.map((f, i) =>
              i === index
                ? { ...f, status: "error", error: errorData.error || "Upload failed" }
                : f
            )
          );
        }
      };

      xhr.onerror = () => {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: "error", error: "Upload failed" } : f
          )
        );
      };

      xhr.send(formData);
    } catch (error) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
    }
  };

  const uploadAllFiles = () => {
    files.forEach((file, index) => {
      if (file.status === "pending") {
        uploadFile(file, index);
      }
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const pendingFiles = files.filter((f) => f.status === "pending");

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-12 h-12 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
            Drop images here or click to select
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            JPEG, PNG, GIF, WebP up to 10MB
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Files ({files.length})
            </h3>
            {pendingFiles.length > 0 && (
              <button
                onClick={uploadAllFiles}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload All ({pendingFiles.length})
              </button>
            )}
          </div>

          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
              >
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {file.status === "uploading" && (
                    <div className="mt-2">
                      <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {file.progress}%
                      </p>
                    </div>
                  )}

                  {file.status === "completed" && file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 block truncate"
                    >
                      {file.url}
                    </a>
                  )}

                  {file.status === "error" && (
                    <p className="text-xs text-red-500 mt-1">{file.error}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {file.status === "pending" && (
                    <span className="text-xs text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded">
                      Pending
                    </span>
                  )}
                  {file.status === "uploading" && (
                    <span className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                      Uploading
                    </span>
                  )}
                  {file.status === "completed" && (
                    <span className="text-xs text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                      Completed
                    </span>
                  )}
                  {file.status === "error" && (
                    <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                      Error
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="p-1 text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
