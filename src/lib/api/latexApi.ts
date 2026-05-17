import { apiRequest } from "@/lib/api";

export interface LatexDocument {
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

export async function fetchLatexDocuments(): Promise<LatexDocument[]> {
  const res = await apiRequest("/api/latex");
  if (!res.ok) throw new Error(await getErrorMessage(res));
  const json = await res.json();
  return json.data ?? [];
}

export async function createLatexDocument(data: {
  title?: string;
  content?: string;
}): Promise<LatexDocument> {
  const res = await apiRequest("/api/latex", {
    method: "POST",
    body: JSON.stringify({
      title: data.title?.trim() || undefined,
      content: data.content ?? "",
    }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res));
  const json = await res.json();
  return json.data;
}

export async function updateLatexDocument(
  id: string,
  data: { title?: string; content?: string },
): Promise<LatexDocument> {
  const res = await apiRequest(`/api/latex/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res));
  const json = await res.json();
  return json.data;
}

export async function deleteLatexDocument(id: string): Promise<void> {
  const res = await apiRequest(`/api/latex/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await getErrorMessage(res));
}

export interface LatexCompileResult {
  pdfBase64: string;
  log: string;
  engine: string;
}

export async function compileLatexDocument(
  content: string,
): Promise<LatexCompileResult> {
  const res = await apiRequest("/api/latex/compile", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const error = new Error(
      (json?.error || json?.message || "Compilation failed") as string,
    ) as Error & { code?: string; log?: string };
    error.code = json?.error;
    error.log = json?.log;
    throw error;
  }
  const json = await res.json();
  return json.data;
}
