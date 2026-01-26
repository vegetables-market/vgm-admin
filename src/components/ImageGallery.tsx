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

  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      alert("コピーに失敗しました");
    }
  };

  const generateEmbedCode = (url: string, alt: string) => ({
    url: url,
    html: `<img src="${url}" alt="${alt}" />`,
    markdown: `![${alt}](${url})`,
    htmlIcon: `<img src="${url}" alt="${alt}" class="w-10 h-10 rounded-full object-cover" />`,
    htmlProduct: `<img src="${url}" alt="${alt}" class="w-full max-w-md rounded-lg object-cover" />`,
  });

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
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 space-y-4">
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">サイズ:</span>
                  <span className="ml-2 text-zinc-900 dark:text-zinc-100">{formatFileSize(selectedImage.size)}</span>
                </div>
                <div>
                  <span className="text-zinc-500">更新日時:</span>
                  <span className="ml-2 text-zinc-900 dark:text-zinc-100">{formatDate(selectedImage.lastModified)}</span>
                </div>
              </div>

              {(() => {
                const embed = generateEmbedCode(selectedImage.url, getFileName(selectedImage.key));
                return (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">埋め込みコード</p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => copyToClipboard(embed.url, "url")}
                        className={`p-2 text-xs rounded-lg border transition-colors ${
                          copiedType === "url"
                            ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 hover:border-blue-500"
                        }`}
                      >
                        <span className="block font-medium mb-1">URL</span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {copiedType === "url" ? "コピーしました!" : "クリックでコピー"}
                        </span>
                      </button>

                      <button
                        onClick={() => copyToClipboard(embed.markdown, "markdown")}
                        className={`p-2 text-xs rounded-lg border transition-colors ${
                          copiedType === "markdown"
                            ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 hover:border-blue-500"
                        }`}
                      >
                        <span className="block font-medium mb-1">Markdown</span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {copiedType === "markdown" ? "コピーしました!" : "クリックでコピー"}
                        </span>
                      </button>

                      <button
                        onClick={() => copyToClipboard(embed.htmlIcon, "icon")}
                        className={`p-2 text-xs rounded-lg border transition-colors ${
                          copiedType === "icon"
                            ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 hover:border-blue-500"
                        }`}
                      >
                        <span className="block font-medium mb-1">アイコン用HTML</span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {copiedType === "icon" ? "コピーしました!" : "丸型・40px"}
                        </span>
                      </button>

                      <button
                        onClick={() => copyToClipboard(embed.htmlProduct, "product")}
                        className={`p-2 text-xs rounded-lg border transition-colors ${
                          copiedType === "product"
                            ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 hover:border-blue-500"
                        }`}
                      >
                        <span className="block font-medium mb-1">商品用HTML</span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {copiedType === "product" ? "コピーしました!" : "角丸・レスポンシブ"}
                        </span>
                      </button>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500 mb-1">プレビュー</p>
                      <div className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <div>
                          <p className="text-xs text-zinc-400 mb-1">アイコン</p>
                          <img
                            src={selectedImage.url}
                            alt="icon preview"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400 mb-1">商品</p>
                          <img
                            src={selectedImage.url}
                            alt="product preview"
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex gap-2">
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
