import { SpinnerIcon, XIcon } from "@phosphor-icons/react";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProtected } from "#/features/auth/hooks/fetch-protected";
import { useTheme } from "#/shared/hooks/use-theme";

interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string; thumb: string; raw: string };
  alt_description: string | null;
  user: { name: string; username: string };
  links: { html: string };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

interface UnsplashPickerProps {
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

const searchUnsplash = async (
  q: string,
  page: string,
  signal?: AbortSignal,
): Promise<UnsplashPhoto[]> => {
  const params = new URLSearchParams({ page, per_page: "20", q });
  const data = await fetchProtected<UnsplashSearchResponse>(
    `/api/console/unsplash/search?${params.toString()}`,
    { signal },
  );
  return data.results ?? [];
};

export const UnsplashPicker = ({ onClose, onSelect }: UnsplashPickerProps) => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string, p: string, append: boolean) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const isLoadMore = append;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError("");
    try {
      const results = await searchUnsplash(q, p, controller.signal);
      setPhotos((prev) => (append ? [...prev, ...results] : results));
      setHasMore(results.length === 20);
      // oxlint-disable-next-line unicorn/catch-error-name
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("failed to search unsplash");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const debouncedSearch = useDebouncedCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setPhotos([]);
        setPage(1);
        setHasMore(false);
        return;
      }
      setPage(1);
      doSearch(trimmed, "1", false);
    },
    { wait: 600 },
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    doSearch(query.trim() || "nature", String(nextPage), true);
  };

  // Load default images on mount, focus input
  useEffect(() => {
    doSearch("nature", "1", false);
    inputRef.current?.focus();
    return () => abortRef.current?.abort();
  }, [doSearch]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <SpinnerIcon
            className={`animate-spin ${t("text-text-dark/30", "text-text-light/30")}`}
            size={20}
          />
        </div>
      );
    }
    if (photos.length === 0) {
      return (
        <p
          className={`text-center py-12 text-[11px] ${t("text-text-dark/20", "text-text-light/20")}`}
        >
          {query ? "no results" : "search for a photo"}
        </p>
      );
    }
    return (
      <>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <button
              className={`relative overflow-hidden border cursor-pointer group ${t("border-border-dark hover:border-white/20", "border-border-light hover:border-black/20")}`}
              key={photo.id}
              onClick={() => onSelect(photo.urls.regular)}
              type="button"
            >
              <img
                alt={photo.alt_description ?? "unsplash photo"}
                className="w-full aspect-video object-cover"
                loading="lazy"
                src={photo.urls.small}
              />
              <div
                className={`absolute inset-0 flex items-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${t("bg-linear-to-t from-black/60 to-transparent", "bg-linear-to-t from-black/40 to-transparent")}`}
              >
                <span
                  className={`text-[9px] lowercase truncate ${t("text-white/80", "text-white/80")}`}
                >
                  {photo.user.name}
                </span>
              </div>
            </button>
          ))}
        </div>
        {hasMore && (
          <div className="flex justify-center mt-3">
            <button
              className={`text-[11px] lowercase px-3 py-1.5 border ${loadingMore ? t("text-text-dark/20 border-border-dark", "text-text-light/20 border-border-light") : t("text-text-dark/40 border-border-dark hover:text-text-dark hover:bg-white/5", "text-text-light/40 border-border-light hover:text-text-light hover:bg-black/3")}`}
              disabled={loadingMore}
              onClick={handleLoadMore}
              type="button"
            >
              {loadingMore ? "loading..." : "load more"}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="unsplash search"
    >
      <button
        aria-label="close picker"
        className={`absolute inset-0 w-full ${t("bg-black/60", "bg-black/40")}`}
        onClick={onClose}
        type="button"
      />
      <div
        className={`relative z-10 mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col border p-4 ${t("border-border-dark bg-text-light", "border-border-light bg-white")}`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[11px] lowercase ${t("text-text-dark/60", "text-text-light/60")}`}>
            unsplash search
          </span>
          <button
            aria-label="close"
            className={t(
              "text-text-dark/30 hover:text-text-dark/60",
              "text-text-light/30 hover:text-text-light/60",
            )}
            onClick={onClose}
            type="button"
          >
            <XIcon size={14} />
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            className={`flex-1 bg-transparent border px-2 py-1.5 text-[11px] lowercase outline-none ${t("border-border-dark placeholder:text-text-dark/20 text-text-dark", "border-border-light placeholder:text-text-light/20 text-text-light")}`}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="search unsplash..."
            value={query}
          />
        </div>

        {error && (
          <p className={`text-center text-[11px] mb-2 ${t("text-red-400", "text-red-500")}`}>
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">{renderContent()}</div>
      </div>
    </div>
  );
};
