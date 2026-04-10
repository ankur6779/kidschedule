/**
 * Returns a full API URL for the given path.
 * Relative paths like /api/... work because Replit's proxy
 * routes them to the API server artifact.
 */
export function getApiUrl(path: string): string {
  return path;
}
