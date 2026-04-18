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
      if (!res.ok && res.status !== 404) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }
      return res;
    },
    [getToken],
  );

  return authFetch;
}
