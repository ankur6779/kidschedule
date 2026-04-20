import { API_BASE_URL } from "@/constants/api";

export interface Worksheet {
  id: string;
  name: string;
  mimeType: string;
  fileType: "pdf" | "image";
  category: string;
  downloadUrl: string;
  previewUrl: string;
}

export interface ReelVideo {
  id: string;
  name: string;
  mimeType: string;
  streamUrl: string;
}

export interface ReelsBatch {
  videos: ReelVideo[];
  total: number;
  offset: number;
  nextOffset: number | null;
}

export async function fetchWorksheets(): Promise<Worksheet[]> {
  const res = await fetch(`${API_BASE_URL}/api/worksheets`);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  return data.worksheets || [];
}

export async function fetchReelsBatch(offset: number, batch = 6): Promise<ReelsBatch> {
  const res = await fetch(`${API_BASE_URL}/api/reels/videos?offset=${offset}&batch=${batch}`);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export function driveThumbnailUrl(fileId: string, width = 480): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

export function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function driveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
