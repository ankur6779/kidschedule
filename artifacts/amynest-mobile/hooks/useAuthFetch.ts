import { useAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";
import { API_BASE_URL } from "@/constants/api";

async function safeReadBody(res: Response): Promise<string> {
  try {
    const text = await res.clone().text();
    if (!text) return "";
    try {
      const json = JSON.parse(text);
      return json?.message || json?.error || text.slice(0, 200);
    } catch {
      return text.slice(0, 200);
    }
  } catch {
    return "";
  }
}

export function useAuthFetch() {
  const { getToken, isSignedIn } = useAuth();

  const authFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const doFetch = async (forceFresh: boolean): Promise<Response> => {
        // Force a fresh token on first attempt to avoid stale-token 401s
        // after long-running flows (e.g. onboarding chat takes 2+ minutes).
        const token = await getToken(forceFresh ? { skipCache: true } : undefined).catch(() => null);
        const headers = new Headers(init.headers);
        headers.set("Content-Type", "application/json");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
      };

      let res = await doFetch(true);

      // 401 retry: refresh the Clerk token once and try again. This handles
      // the rare race where Clerk's token cache returned an expired JWT.
      if (res.status === 401 && isSignedIn) {
        res = await doFetch(true);
      }

      // Pass through expected non-2xx responses that callers handle explicitly:
      //   404 → resource missing
      //   402 → Global Paywall feature_locked (callers route to /paywall)
      if (!res.ok && res.status !== 404 && res.status !== 402) {
        const body = await safeReadBody(res);
        const detail = body ? ` — ${body}` : "";
        throw new Error(`Request failed: ${res.status}${detail}`);
      }
      return res;
    },
    [getToken, isSignedIn],
  );

  return authFetch;
}
