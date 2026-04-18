import { apiRequest } from "@/lib/api";

export interface TakeNoteItem {
  id: string;
  userId: string;
  title: string;
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

export async function fetchTakeNotes(): Promise<TakeNoteItem[]> {
  const res = await apiRequest("/api/take-note");
  if (!res.ok) {
    const msg = await getErrorMessage(res);
    throw new Error(msg);
  }
  const json = await res.json();
  return json.data ?? [];
}

export async function createTakeNote(data: {
  title?: string;
  content?: string;
}): Promise<TakeNoteItem> {
  const res = await apiRequest("/api/take-note", {
    method: "POST",
    body: JSON.stringify({
      title: data.title?.trim() || undefined,
      content: data.content ?? "",
    }),
  });
  if (!res.ok) {
    const msg = await getErrorMessage(res);
    throw new Error(msg);
  }
  const json = await res.json();
  return json.data;
}

export async function updateTakeNote(
  id: string,
  data: { title?: string; content?: string },
): Promise<TakeNoteItem> {
  const res = await apiRequest(`/api/take-note/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update note");
  const json = await res.json();
  return json.data;
}

export async function deleteTakeNote(id: string): Promise<void> {
  const res = await apiRequest(`/api/take-note/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete note");
}
