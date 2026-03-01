import { store } from "@/store/store";
import { selectAuthToken } from "@/store/authSlice";

/** Base URL for API (use VITE_API_URL in production). */
export const API_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8081";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = selectAuthToken(store.getState());

  const rawHeaders = (options.headers as Record<string, string | undefined>) || {};
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawHeaders)) {
    if (v != null && v !== "") headers[k] = String(v);
  }
  // Only set Content-Type for requests with a body so GET/HEAD don't trigger body parsing
  if (options.body !== undefined && options.body !== null) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid, logout user
    store.dispatch({ type: "auth/logout" });
    window.location.href = "/login";
  }

  return response;
}
