import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const FOLDER_ID = "1rZqwBYoSIxnDIXBO4XvIqN5b4UBnbQD3";
const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const BATCH_SIZE = 5;

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

let cachedVideoIds: DriveFile[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

const PLAYABLE_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
  "video/3gpp",
  "video/3gpp2",
  "video/mpeg",
]);

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

async function fetchAllVideos(): Promise<DriveFile[]> {
  const apiKey = process.env["GOOGLE_API_KEY"];
  if (!apiKey) throw new Error("GOOGLE_API_KEY environment variable is not set");

  const now = Date.now();
  if (cachedVideoIds.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedVideoIds;
  }

  const allFiles: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${FOLDER_ID}' in parents and mimeType contains 'video' and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType)",
      key: apiKey,
      pageSize: "1000",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${DRIVE_API}?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Drive API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as { files: DriveFile[]; nextPageToken?: string };
    const playable = (data.files || []).filter((f) => PLAYABLE_MIME_TYPES.has(f.mimeType));
    allFiles.push(...playable);
    pageToken = data.nextPageToken;
  } while (pageToken);

  shuffle(allFiles);
  cachedVideoIds = allFiles;
  cacheTimestamp = Date.now();
  logger.info({ count: allFiles.length }, "Drive video cache built");
  return allFiles;
}

router.get("/videos", async (req, res) => {
  try {
    const videos = await fetchAllVideos();
    const offset = parseInt((req.query["offset"] as string) || "0", 10);
    const batch = parseInt((req.query["batch"] as string) || String(BATCH_SIZE), 10);

    const slice = videos.slice(offset, offset + batch).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      streamUrl: `/api/reels/stream/${f.id}`,
    }));

    res.json({
      videos: slice,
      total: videos.length,
      offset,
      nextOffset: offset + slice.length < videos.length ? offset + slice.length : null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to list videos");
    res.status(500).json({ error: "Internal error. Please try again." });
  }
});

/**
 * Fetch from Google Drive using the web download URL.
 * This works for files shared as "Anyone with link can view"
 * without requiring individual file-level public access.
 */
async function fetchDriveStream(fileId: string, rangeHeader?: string): Promise<Response> {
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (compatible; VideoProxy/1.0)",
  };
  if (rangeHeader) headers["Range"] = rangeHeader;

  // Use drive.usercontent.google.com — the CDN endpoint used by Google Drive web UI
  // Works for "Anyone with link" shared files without OAuth
  const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=t`;
  const res = await fetch(url, { headers });

  // If we get HTML back (virus scan warning for large files), parse the confirm token
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    const html = await res.text();

    // Try extracting uuid token (newer Google Drive confirmation flow)
    const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);
    if (uuidMatch) {
      const confirmUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=t&uuid=${uuidMatch[1]}`;
      return fetch(confirmUrl, { headers });
    }

    // Fallback: extract any confirm token from the page
    const confirmMatch = html.match(/confirm=([^&"]+)/);
    if (confirmMatch) {
      const confirmUrl = `https://drive.google.com/uc?id=${fileId}&export=download&confirm=${confirmMatch[1]}`;
      return fetch(confirmUrl, { headers });
    }

    // Can't resolve confirmation — return a synthetic 403
    return new Response("Confirmation required", { status: 403 });
  }

  return res;
}

router.get("/stream/:fileId", async (req, res) => {
  const { fileId } = req.params;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    res.status(400).json({ error: "Invalid file ID" });
    return;
  }

  try {
    const rangeHeader = req.headers["range"];
    const driveRes = await fetchDriveStream(fileId, rangeHeader);

    if (!driveRes.ok && driveRes.status !== 206) {
      logger.warn({ fileId, status: driveRes.status }, "Drive stream failed");
      res.status(driveRes.status === 404 ? 404 : 403).json({ error: "File not accessible" });
      return;
    }

    const contentType = driveRes.headers.get("content-type") || "video/mp4";
    const contentLength = driveRes.headers.get("content-length");
    const contentRange = driveRes.headers.get("content-range");
    const acceptRanges = driveRes.headers.get("accept-ranges");

    res.status(driveRes.status);
    res.set("Content-Type", contentType);
    res.set("Accept-Ranges", acceptRanges || "bytes");
    if (contentLength) res.set("Content-Length", contentLength);
    if (contentRange) res.set("Content-Range", contentRange);
    res.set("Cache-Control", "public, max-age=3600");

    if (!driveRes.body) { res.end(); return; }

    const reader = driveRes.body.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.write(value)) {
            await new Promise((resolve) => res.once("drain", resolve));
          }
        }
        res.end();
      } catch {
        reader.cancel();
        res.destroy();
      }
    };
    pump();
  } catch (err) {
    logger.error({ err }, "Stream error");
    if (!res.headersSent) res.status(500).json({ error: "Stream failed" });
  }
});

export default router;
