import { store } from "@/store/store";
import { selectAuthToken } from "@/store/authSlice";

const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8081";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = selectAuthToken(store.getState());
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

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
