import { store } from "@/store/store";
import {
  logout,
  selectAuthToken,
  tokenRefreshed,
} from "@/store/authSlice";

/** Base URL for API (use VITE_API_URL in production). */
export const API_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8081";

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = (await response.json()) as { access_token?: string };
        if (!data.access_token) return null;
        store.dispatch(tokenRefreshed(data.access_token));
        return data.access_token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function redirectToLogin() {
  store.dispatch(logout());
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const buildHeaders = (token: string | null) => {
    const rawHeaders =
      (options.headers as Record<string, string | undefined>) || {};
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawHeaders)) {
      if (value != null && value !== "") headers[key] = String(value);
    }

    if (options.body !== undefined && options.body !== null) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const sendRequest = (token: string | null) =>
    fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: buildHeaders(token),
    });

  let response = await sendRequest(selectAuthToken(store.getState()));
  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    redirectToLogin();
    return response;
  }

  response = await sendRequest(refreshedToken);
  if (response.status === 401) {
    redirectToLogin();
  }
  return response;
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    store.dispatch(logout());
  }
}
