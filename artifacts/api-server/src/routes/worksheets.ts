import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const ROOT_FOLDER_ID = "1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr";
const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const CACHE_TTL_MS = 5 * 60 * 1000;

export type WorksheetCategory =
  | "coloring"
  | "math"
  | "tracing"
  | "alphabet"
  | "numbers"
  | "general";

interface WorksheetFile {
  id: string;
  name: string;
  mimeType: string;
  fileType: "pdf" | "image";
  category: WorksheetCategory;
  downloadUrl: string;
  previewUrl: string;
}

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

let cachedWorksheets: WorksheetFile[] = [];
let cacheTimestamp = 0;

function inferCategory(name: string, folderPath: string): WorksheetCategory {
  const text = `${name} ${folderPath}`.toLowerCase();
  if (/color|colour|colouring|coloring/.test(text)) return "coloring";
  if (/math|maths|addition|subtract|multiply|count/.test(text)) return "math";
  if (/trac|handwrit|writing/.test(text)) return "tracing";
  if (/alphabet|letter|abc|phonics/.test(text)) return "alphabet";
  if (/number|numeral|1-10|1-20/.test(text)) return "numbers";
  return "general";
}

function previewUrl(fileId: string, mimeType: string): string {
  if (mimeType === "application/pdf") {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w320`;
  }
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w320`;
}

async function listFolderContents(
  folderId: string,
  apiKey: string
): Promise<{ id: string; name: string; mimeType: string }[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "nextPageToken,files(id,name,mimeType)",
    key: apiKey,
    pageSize: "1000",
  });

  const all: { id: string; name: string; mimeType: string }[] = [];
  let pageToken: string | undefined;

  do {
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`${DRIVE_API}?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Drive API error ${res.status}: ${text}`);
    }
    const data = (await res.json()) as {
      files: { id: string; name: string; mimeType: string }[];
      nextPageToken?: string;
    };
    all.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return all;
}

async function collectFilesRecursive(
  folderId: string,
  apiKey: string,
  folderPath = "",
  depth = 0
): Promise<WorksheetFile[]> {
  if (depth > 8) return [];

  const items = await listFolderContents(folderId, apiKey);
  const results: WorksheetFile[] = [];

  const folderItems = items.filter(
    (i) => i.mimeType === "application/vnd.google-apps.folder"
  );
  const fileItems = items.filter((i) => ALLOWED_MIME.has(i.mimeType));

  for (const file of fileItems) {
    results.push({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      fileType: file.mimeType === "application/pdf" ? "pdf" : "image",
      category: inferCategory(file.name, folderPath),
      downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
      previewUrl: previewUrl(file.id, file.mimeType),
    });
  }

  const subResults = await Promise.all(
    folderItems.map((f) =>
      collectFilesRecursive(f.id, apiKey, `${folderPath} ${f.name}`.trim(), depth + 1)
    )
  );
  for (const sub of subResults) results.push(...sub);

  return results;
}

async function getWorksheets(apiKey: string): Promise<WorksheetFile[]> {
  const now = Date.now();
  if (cachedWorksheets.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedWorksheets;
  }
  const files = await collectFilesRecursive(ROOT_FOLDER_ID, apiKey);
  // PDFs first, then images — alphabetical within each group
  files.sort((a, b) => {
    if (a.fileType !== b.fileType) return a.fileType === "pdf" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  cachedWorksheets = files;
  cacheTimestamp = Date.now();
  logger.info({ count: files.length }, "Worksheets cache rebuilt");
  return files;
}

router.get("/worksheets", async (req, res) => {
  const apiKey = process.env["GOOGLE_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "GOOGLE_API_KEY not configured" });
    return;
  }
  try {
    const worksheets = await getWorksheets(apiKey);
    res.set("Cache-Control", "public, max-age=300");
    res.json({ worksheets, total: worksheets.length });
  } catch (err) {
    logger.error({ err }, "Failed to fetch worksheets");
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
