/**
 * URL helpers for app frontends — all return relative paths (Strategy A).
 * Works via Vite proxy in dev and nginx in production.
 */

function encodeSourcePath(filePath: string): string {
  const normalized = filePath.trim() || "/";
  return encodeURIComponent(
    normalized.startsWith("/") ? normalized : `/${normalized}`,
  );
}

/** Build a streaming URL for a VFS file. Returns null if no fileSystemId. */
export function buildFileUrl(
  path: string,
  fileSystemId: string | undefined,
): string | null {
  if (!fileSystemId) return null;
  return `/api/vfs/${encodeURIComponent(fileSystemId)}/stream?path=${encodeSourcePath(path)}`;
}

/**
 * Smart poster URL resolver. Handles all path formats from DB:
 * - `/storage/{key}` → thumbnail via storage endpoint
 * - `http(s)://...` → returned as-is (external CDN)
 * - `/api/image-proxy?...` → returned as-is (relative)
 * - TMDB relative path (starts with `/`) → route through our image proxy
 */
export function posterThumbUrl(
  posterPath: string | null | undefined,
  w: number,
  format = "webp",
): string | undefined {
  if (!posterPath) return undefined;

  if (posterPath.startsWith("/storage/")) {
    const key = posterPath.slice(9);
    return `/storage/${key}?w=${w}&h=0&format=${format}`;
  }
  if (posterPath.startsWith("http")) {
    return posterPath;
  }
  if (posterPath.startsWith("/api/image-proxy")) {
    return posterPath;
  }
  if (posterPath.startsWith("/")) {
    const tmdbUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
    return `/api/image-proxy?url=${encodeURIComponent(tmdbUrl)}`;
  }
  return undefined;
}

/** Resolve a server-returned `/api/image-proxy?...` path to a URL. */
export function buildProxiedImageUrl(url: string): string {
  return url; // already relative; Strategy A: no rustUrl prefix
}

/**
 * Resolve a media image from S3 key (preferred) or fallback path.
 * @param key   S3 storage key (preferred)
 * @param path  Fallback: TMDB URL or /storage/... path
 */
export function resolveMediaImage(
  key: string | null | undefined,
  path: string | null | undefined,
): string | undefined {
  if (key) return `/storage/${key}`;
  if (path) {
    if (path.startsWith("/storage/")) return path;
    return path;
  }
  return undefined;
}

/** Build a CDN-style URL for an entity-based thumbnail. */
export function thumbUrl(type: string, id: string, w: number, h = 0): string {
  return `/api/thumb/${type}/${id}?w=${w}&h=${h}`;
}

/** Build a URL for an S3/storage key with optional resize. */
export function thumbStorageUrl(
  storageKey: string,
  w: number,
  h = 0,
  format = "webp",
): string {
  return `/storage/${storageKey}?w=${w}&h=${h}&format=${format}`;
}
