import { apiRequest } from "@/lib/api";

export interface BrainstormItem {
  id: string;
  userId: string;
  name: string;
  type: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

async function getErrorMessage(res: Response): Promise<string> {
  try {
    const json = await res.json();
    return (json.message || json.error || "Request failed") as string;
  } catch {
    return res.statusText || "Request failed";
  }
}

export async function fetchBrainstorms(): Promise<BrainstormItem[]> {
  const res = await apiRequest("/api/brainstorm");
  if (!res.ok) {
    const msg = await getErrorMessage(res);
    throw new Error(msg);
  }
  const json = await res.json();
  return json.data ?? [];
}

export async function fetchBrainstorm(id: string): Promise<BrainstormItem> {
  const res = await apiRequest(`/api/brainstorm/${id}`);
  if (!res.ok) throw new Error("Failed to fetch brainstorm");
  const json = await res.json();
  return json.data;
}

export async function createBrainstorm(
  type: string,
  content: string,
  name?: string
): Promise<BrainstormItem> {
  const res = await apiRequest("/api/brainstorm", {
    method: "POST",
    body: JSON.stringify({ type, content, name: name?.trim() || undefined }),
  });
  if (!res.ok) {
    const msg = await getErrorMessage(res);
    throw new Error(msg);
  }
  const json = await res.json();
  return json.data;
}

export async function updateBrainstorm(
  id: string,
  data: { name?: string; type?: string; content?: string }
): Promise<BrainstormItem> {
  const res = await apiRequest(`/api/brainstorm/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update brainstorm");
  const json = await res.json();
  return json.data;
}

export async function deleteBrainstorm(id: string): Promise<void> {
  const res = await apiRequest(`/api/brainstorm/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete brainstorm");
}

export const BRAINSTORM_TYPES = [
  "mindmap",
  "ER",
  "Class",
  "Git",
  "Kanban",
  "Flowchart",
  "Sequence",
  "State",
  "Pie",
  "Quadrant",
] as const;
