import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { Loader2, Mail, MessageSquare, Plus, Pencil, Trash2, Eye } from "lucide-react";

interface PersonalTaskEmailSettings {
  sendPersonalTasksEmail: boolean;
  email: string | null;
}

interface FeedbackItem {
  feedbackId: string;
  name: string;
  reason: string;
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [feedbackFormOpen, setFeedbackFormOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | null>(null);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackReason, setFeedbackReason] = useState("");
  const [deleteFeedbackId, setDeleteFeedbackId] = useState<string | null>(null);
  const [viewFeedback, setViewFeedback] = useState<FeedbackItem | null>(null);

  // Fetch current settings (used for loading state; email form disabled for now)
  const { isLoading } = useQuery<{
    data: PersonalTaskEmailSettings;
  }>({
    queryKey: ["settings", "personal-tasks-email"],
    queryFn: async () => {
      const response = await apiRequest("/api/settings/personal-tasks-email");
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    },
  });

  // Feedback list
  const { data: feedbackData, isLoading: feedbackLoading } = useQuery<{ data: FeedbackItem[] }>({
    queryKey: ["feedback"],
    queryFn: async () => {
      const res = await apiRequest("/api/feedback");
      if (!res.ok) throw new Error("Failed to fetch feedback");
      return res.json();
    },
  });
  const feedbackList = feedbackData?.data ?? [];

  const createFeedbackMutation = useMutation({
    mutationFn: async (body: { name: string; reason: string }) => {
      const res = await apiRequest("/api/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Feedback submitted");
      setFeedbackFormOpen(false);
      setFeedbackName("");
      setFeedbackReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({
      feedbackId,
      name,
      reason,
    }: { feedbackId: string; name: string; reason: string }) => {
      const res = await apiRequest(`/api/feedback/${feedbackId}`, {
        method: "PUT",
        body: JSON.stringify({ name, reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Feedback updated");
      setEditingFeedback(null);
      setFeedbackName("");
      setFeedbackReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const res = await apiRequest(`/api/feedback/${feedbackId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Feedback deleted");
      setDeleteFeedbackId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpenCreateFeedback = () => {
    setEditingFeedback(null);
    setFeedbackName("");
    setFeedbackReason("");
    setFeedbackFormOpen(true);
  };

  const handleOpenEditFeedback = (item: FeedbackItem) => {
    setEditingFeedback(item);
    setFeedbackName(item.name);
    setFeedbackReason(item.reason);
    setFeedbackFormOpen(true);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName.trim() || !feedbackReason.trim()) {
      toast.error("Title and description are required");
      return;
    }
    if (editingFeedback) {
      updateFeedbackMutation.mutate({
        feedbackId: editingFeedback.feedbackId,
        name: feedbackName.trim(),
        reason: feedbackReason.trim(),
      });
    } else {
      createFeedbackMutation.mutate({ name: feedbackName.trim(), reason: feedbackReason.trim() });
    }
  };

  // handleSubmit for email settings (form currently disabled)
  // const handleSubmit = (e: React.FormEvent) => { ... };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your application preferences
        </p>
      </div>

      {/* Email feature temporarily disabled (incomplete / has bugs) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Weekly Personal Task Email
          </CardTitle>
          <CardDescription>
            This feature is temporarily disabled (incomplete). It will be re-enabled in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Receive a weekly summary of your personal tasks via email. Coming back soon.
          </p>
          {/* Original form commented out until email feature is fixed
          <form onSubmit={handleSubmit} className="space-y-6">
            ...
          </form>
          */}
        </CardContent>
      </Card>

      {/* Feedback / Bug reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Feedback & Bug Reports
          </CardTitle>
          <CardDescription>
            Report issues or suggestions. Max 10 reports per day. You can edit or delete your own feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleOpenCreateFeedback}>
            <Plus className="w-4 h-4 mr-2" />
            Add Feedback
          </Button>
          {feedbackLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          ) : feedbackList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Admin response</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[130px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackList.map((item) => (
                    <TableRow key={item.feedbackId}>
                      <TableCell className="font-medium max-w-[180px] truncate" title={item.name}>
                        {item.name}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate" title={item.reason}>
                        {item.reason}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground" title={item.adminResponse ?? ""}>
                        {item.adminResponse ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {format(new Date(item.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewFeedback(item)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditFeedback(item)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteFeedbackId(item.feedbackId)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Feedback dialog */}
      <Dialog open={!!viewFeedback} onOpenChange={(open) => !open && setViewFeedback(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback details</DialogTitle>
          </DialogHeader>
          {viewFeedback && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium mt-1">{viewFeedback.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 whitespace-pre-wrap">{viewFeedback.reason}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Admin response</Label>
                <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                  {viewFeedback.adminResponse ?? "—"}
                </p>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Created: {format(new Date(viewFeedback.createdAt), "MMM d, yyyy HH:mm")}</span>
                <span>Updated: {format(new Date(viewFeedback.updatedAt), "MMM d, yyyy HH:mm")}</span>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewFeedback(null)}>
                  Close
                </Button>
                <Button onClick={() => { setViewFeedback(null); handleOpenEditFeedback(viewFeedback); setFeedbackFormOpen(true); }}>
                  Edit
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Feedback dialog */}
      <Dialog open={feedbackFormOpen} onOpenChange={setFeedbackFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFeedback ? "Edit feedback" : "Add feedback"}</DialogTitle>
            <DialogDescription>
              Describe the bug or suggestion. Max 10 per day.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div>
              <Label htmlFor="fb-name">Title</Label>
              <Input
                id="fb-name"
                value={feedbackName}
                onChange={(e) => setFeedbackName(e.target.value)}
                placeholder="Short title"
                maxLength={500}
              />
            </div>
            <div>
              <Label htmlFor="fb-reason">Description</Label>
              <Textarea
                id="fb-reason"
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
                placeholder="Describe the issue or suggestion..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFeedbackFormOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createFeedbackMutation.isPending ||
                  updateFeedbackMutation.isPending ||
                  !feedbackName.trim() ||
                  !feedbackReason.trim()
                }
              >
                {(createFeedbackMutation.isPending || updateFeedbackMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingFeedback ? "Update" : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteFeedbackId} onOpenChange={() => setDeleteFeedbackId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete feedback</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFeedbackId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteFeedbackMutation.isPending}
              onClick={() => deleteFeedbackId && deleteFeedbackMutation.mutate(deleteFeedbackId)}
            >
              {deleteFeedbackMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
