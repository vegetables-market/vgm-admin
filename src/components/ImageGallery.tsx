"use client";

import { useState, useEffect } from "react";

interface ImageItem {
  key: string;
  url: string;
  size?: number;
  lastModified?: string;
}

export default function ImageGallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/images");
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }
      const data = await response.json();
      setImages(data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleString("ja-JP");
  };

  const getFileName = (key: string) => {
    return key.split("/").pop() || key;
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("URLをコピーしました");
    } catch {
      alert("コピーに失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-zinc-600 dark:text-zinc-400">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchImages}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          アップロード済み画像 ({images.length})
        </h2>
        <button
          onClick={fetchImages}
          className="px-3 py-1.5 text-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
        >
          更新
        </button>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          アップロードされた画像はありません
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.key}
              className="group relative bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => setSelectedImage(image)}
            >
              <div className="aspect-square">
                <img
                  src={image.url}
                  alt={getFileName(image.key)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition-opacity">
                  クリックで詳細
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {getFileName(selectedImage.key)}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedImage.url}
                alt={getFileName(selectedImage.key)}
                className="w-full max-h-[50vh] object-contain rounded-lg bg-zinc-100 dark:bg-zinc-800"
              />
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">サイズ:</span>
                <span className="text-zinc-900 dark:text-zinc-100">{formatFileSize(selectedImage.size)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">更新日時:</span>
                <span className="text-zinc-900 dark:text-zinc-100">{formatDate(selectedImage.lastModified)}</span>
              </div>
              <div className="pt-2">
                <p className="text-sm text-zinc-500 mb-1">URL:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedImage.url}
                    readOnly
                    className="flex-1 text-xs bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1.5 text-zinc-700 dark:text-zinc-300"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedImage.url)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    コピー
                  </button>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href={selectedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 text-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                >
                  新しいタブで開く
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
