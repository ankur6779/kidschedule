import { useAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";
import { API_BASE_URL } from "@/constants/api";

export function useAuthFetch() {
  const { getToken } = useAuth();

  const authFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const token = await getToken();
      const headers = new Headers(init.headers);
      headers.set("Content-Type", "application/json");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
      // Pass through expected non-2xx responses that callers handle explicitly:
      //   404 → resource missing (existing behaviour)
      //   402 → Global Paywall feature_locked (callers route to /paywall)
      if (!res.ok && res.status !== 404 && res.status !== 402) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }
      return res;
    },
    [getToken],
  );

  return authFetch;
}
