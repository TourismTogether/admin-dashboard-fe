import { apiRequest } from "@/lib/api";

export interface ResearchSource {
  title: string;
  link: string;
  snippet: string;
  position: number;
  date?: string;
}

export interface ResearchMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  sources: ResearchSource[];
  createdAt: string;
}

export interface ResearchConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ResearchMessage[];
}

async function getErrorMessage(res: Response): Promise<string> {
  try {
    const json = await res.json();
    return (json.message || json.error || "Request failed") as string;
  } catch {
    return res.statusText || "Request failed";
  }
}

export async function fetchResearchConversations(): Promise<
  ResearchConversation[]
> {
  const res = await apiRequest("/api/research");
  if (!res.ok) {
    const msg = await getErrorMessage(res);
    throw new Error(msg);
  }
  const json = await res.json();
  return json.data ?? [];
}

export async function sendResearchMessage(data: {
  conversationId?: string;
  prompt: string;
}): Promise<ResearchConversation> {
  const res = await apiRequest("/api/research/message", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await getErrorMessage(res);
    throw new Error(msg);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteResearchConversation(id: string): Promise<void> {
  const res = await apiRequest(`/api/research/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const msg = await getErrorMessage(res);
    throw new Error(msg);
  }
}
