import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Save, AlertTriangle } from "lucide-react";
import {
  fetchTakeNotes,
  createTakeNote,
  updateTakeNote,
  deleteTakeNote,
  type TakeNoteItem,
} from "@/lib/api/takeNoteApi";

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

const TakeNotePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<TakeNoteItem | null>(null);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [deleteConfirmItem, setDeleteConfirmItem] =
    useState<TakeNoteItem | null>(null);

  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["take-note"],
    queryFn: fetchTakeNotes,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { title?: string; content?: string }) =>
      createTakeNote(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["take-note"] });
      setSelected(data);
      setTitle(data.title);
      setContent(data.content);
      toast.success("Created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      title: t,
      content: c,
    }: {
      id: string;
      title?: string;
      content?: string;
    }) => updateTakeNote(id, { title: t, content: c }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["take-note"] });
      setSelected(data);
      setTitle(data.title);
      setContent(data.content);
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTakeNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["take-note"] });
      setDeleteConfirmItem(null);
      setSelected(null);
      setTitle("");
      setContent("");
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
      setContent("");
    }
  }, [selected]);

  const handleSave = () => {
    if (selected) {
      updateMutation.mutate({
        id: selected.id,
        title: title.trim() || "Untitled",
        content,
      });
    } else {
      createMutation.mutate({
        title: title.trim() || undefined,
        content,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (isError) {
    const msg = error?.message ?? "Unknown error";
    const isNetworkError =
      msg === "Failed to fetch" || msg.includes("NetworkError");
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Failed to load: {msg}</p>
          {isNetworkError && (
            <p className="mt-2 text-sm">
              Make sure the API server is running (e.g.{" "}
              <code className="bg-red-100 px-1 rounded">pnpm run dev</code> in{" "}
              <code className="bg-red-100 px-1 rounded">
                admin-dashboard-server
              </code>
              ) and the app is using the correct URL (default:
              http://localhost:8081).
            </p>
          )}
        </div>
      </div>
    );
  }

  const displayCreatedAt = selected?.createdAt;
  const displayUpdatedAt = selected?.updatedAt;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Take note</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelected(null);
              setTitle("");
              setContent("");
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">My notes</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No notes yet. Create one.
              </p>
            ) : (
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 ${
                        selected?.id === item.id
                          ? "bg-primary/15 font-semibold text-primary"
                          : "hover:bg-accent"
                      }`}
                    >
                      <span
                        className="truncate"
                        title={item.title || "Untitled"}
                      >
                        {item.title || "Untitled"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmItem(item);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </Button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled"
                    className="font-medium"
                  />
                </div>
                <div className="flex gap-2 pb-0.5">
                  <Button
                    onClick={handleSave}
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {selected ? "Save" : "Create"}
                  </Button>
                </div>
              </div>
              {(displayCreatedAt || displayUpdatedAt) && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 text-xs text-muted-foreground">
                  {displayCreatedAt && (
                    <span>
                      Created: {formatDateTime(displayCreatedAt)}
                    </span>
                  )}
                  {displayUpdatedAt && (
                    <span>
                      Updated: {formatDateTime(displayUpdatedAt)}
                    </span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note…"
                  className="min-h-[280px] text-sm"
                />
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
                  Delete note
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This note will be permanently
                  deleted.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {deleteConfirmItem && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm font-medium">
                {deleteConfirmItem.title || "Untitled"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
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
                deleteConfirmItem && deleteMutation.mutate(deleteConfirmItem.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>Deleting...</>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TakeNotePage;
