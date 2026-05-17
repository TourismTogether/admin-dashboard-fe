import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Download, Play, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createLatexDocument,
  compileLatexDocument,
  deleteLatexDocument,
  fetchLatexDocuments,
  updateLatexDocument,
  type LatexDocument,
} from "@/lib/api/latexApi";

const DEFAULT_CONTENT = String.raw`\documentclass{article}
\begin{document}
\section*{Welcome}
This is a small \LaTeX{} workspace.

Inline math: $E = mc^2$

Display math:
\[
\int_0^1 x^2\,dx = \frac{1}{3}
\]
\end{document}`;

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

const LatexPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<LatexDocument | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compileLog, setCompileLog] = useState("");
  const [compileEngine, setCompileEngine] = useState("");
  const [deleteConfirmItem, setDeleteConfirmItem] =
    useState<LatexDocument | null>(null);

  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["latex"],
    queryFn: fetchLatexDocuments,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createLatexDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["latex"] });
      setSelected(data);
      toast.success("Created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      title: nextTitle,
      content: nextContent,
    }: {
      id: string;
      title?: string;
      content?: string;
    }) => updateLatexDocument(id, { title: nextTitle, content: nextContent }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["latex"] });
      setSelected(data);
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLatexDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latex"] });
      setDeleteConfirmItem(null);
      setSelected(null);
      setTitle("");
      setContent(DEFAULT_CONTENT);
      setPdfUrl(null);
      setCompileLog("");
      setCompileEngine("");
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (selected) {
      setTitle(selected.title);
      setContent(selected.content);
    } else {
      setTitle("");
      setContent(DEFAULT_CONTENT);
    }
  }, [selected]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const compileMutation = useMutation({
    mutationFn: compileLatexDocument,
    onSuccess: (data) => {
      const binary = atob(data.pdfBase64);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const nextPdfUrl = URL.createObjectURL(blob);
      setPdfUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return nextPdfUrl;
      });
      setCompileLog(data.log);
      setCompileEngine(data.engine);
      toast.success("Compiled");
    },
    onError: (e: Error & { log?: string }) => {
      setCompileLog(e.log || e.message);
      toast.error(e.message);
    },
  });

  const handleSave = () => {
    if (selected) {
      updateMutation.mutate({
        id: selected.id,
        title: title.trim() || "Untitled",
        content,
      });
      return;
    }
    createMutation.mutate({ title: title.trim() || undefined, content });
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${(title.trim() || "document").replace(/[/\\?*:|"]/g, "_")}.pdf`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          Failed to load: {error?.message ?? "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Latex</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelected(null);
            setTitle("");
            setContent(DEFAULT_CONTENT);
            setPdfUrl(null);
            setCompileLog("");
            setCompileEngine("");
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          New
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents yet. Create one.
              </p>
            ) : (
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${
                        selected?.id === item.id
                          ? "bg-primary/15 font-semibold text-primary"
                          : "hover:bg-accent"
                      }`}
                    >
                      <span className="truncate" title={item.title}>
                        {item.title || "Untitled"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteConfirmItem(item);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[220px] flex-1 space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Untitled"
                    className="font-medium"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="mr-1 h-4 w-4" />
                  {selected ? "Save" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => compileMutation.mutate(content)}
                  disabled={compileMutation.isPending}
                >
                  <Play className="mr-1 h-4 w-4" />
                  {compileMutation.isPending ? "Compiling..." : "Compile"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={!pdfUrl}
                >
                  <Download className="mr-1 h-4 w-4" />
                  PDF
                </Button>
              </div>
              {(selected?.createdAt || selected?.updatedAt) && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 text-xs text-muted-foreground">
                  {selected?.createdAt && (
                    <span>Created: {formatDateTime(selected.createdAt)}</span>
                  )}
                  {selected?.updatedAt && (
                    <span>Updated: {formatDateTime(selected.updatedAt)}</span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    className="min-h-[520px] font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>PDF Preview</Label>
                    {compileEngine && (
                      <span className="text-xs text-muted-foreground">
                        {compileEngine}
                      </span>
                    )}
                  </div>
                  {pdfUrl ? (
                    <iframe
                      title="Compiled PDF preview"
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                      className="h-[520px] w-full rounded-md border border-border bg-white"
                    />
                  ) : (
                    <div className="flex h-[520px] items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                      Compile to generate PDF preview
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Compile log</Label>
                <pre className="max-h-56 overflow-auto rounded-md border border-border bg-muted/35 p-3 text-xs leading-5">
                  {compileLog || "No compile output yet."}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!deleteConfirmItem}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="space-y-4 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1 space-y-2 pt-1">
                <DialogTitle className="text-xl font-semibold">
                  Delete document
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This Latex document will be
                  permanently deleted.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {deleteConfirmItem && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm font-medium">{deleteConfirmItem.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(deleteConfirmItem.updatedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmItem(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmItem &&
                deleteMutation.mutate(deleteConfirmItem.id)
              }
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LatexPage;
