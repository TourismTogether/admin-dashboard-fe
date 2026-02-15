import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, MessageSquare, ShieldAlert, Eye } from "lucide-react";

interface AdminFeedbackItem {
  feedbackId: string;
  name: string;
  reason: string;
  userId: string;
  userEmail: string;
  adminResponse: string | null;
  adminUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

const AdminFeedbackPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<AdminFeedbackItem | null>(null);
  const [adminResponseText, setAdminResponseText] = useState("");
  const [viewFeedback, setViewFeedback] = useState<AdminFeedbackItem | null>(null);

  const {
    data: feedbackData,
    isLoading,
    isError,
    error,
  } = useQuery<{ data: AdminFeedbackItem[] }>({
    queryKey: ["admin", "feedback"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/feedback");
      if (res.status === 403) {
        throw new Error("FORBIDDEN");
      }
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    retry: false,
  });

  const respondMutation = useMutation({
    mutationFn: async ({
      feedbackId,
      adminResponse,
    }: {
      feedbackId: string;
      adminResponse: string;
    }) => {
      const res = await apiRequest(`/api/admin/feedback/${feedbackId}`, {
        method: "PATCH",
        body: JSON.stringify({ adminResponse }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] });
      toast.success("Response saved");
      setRespondDialogOpen(false);
      setSelectedFeedback(null);
      setAdminResponseText("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpenRespond = (item: AdminFeedbackItem) => {
    setSelectedFeedback(item);
    setAdminResponseText(item.adminResponse ?? "");
    setRespondDialogOpen(true);
  };

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;
    respondMutation.mutate({
      feedbackId: selectedFeedback.feedbackId,
      adminResponse: adminResponseText.trim(),
    });
  };

  if (isError && (error as Error).message === "FORBIDDEN") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <ShieldAlert className="h-12 w-12 text-amber-500" />
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Only admins can view and respond to bug reports.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  const list = feedbackData?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          Bug Reports (Admin)
        </h1>
        <p className="text-muted-foreground mt-1">
          View all user feedback and add responses.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading...
        </div>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">No feedback yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Your response</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((item) => (
                <TableRow key={item.feedbackId}>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {item.userEmail}
                  </TableCell>
                  <TableCell className="font-medium max-w-[160px] truncate" title={item.name}>
                    {item.name}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate" title={item.reason}>
                    {item.reason}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground" title={item.adminResponse ?? ""}>
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
                      <Button variant="outline" size="sm" onClick={() => handleOpenRespond(item)}>
                        Respond
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View feedback dialog */}
      <Dialog open={!!viewFeedback} onOpenChange={(open) => !open && setViewFeedback(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback details</DialogTitle>
            <DialogDescription>
              {viewFeedback && (
                <span className="text-muted-foreground">{viewFeedback.userEmail}</span>
              )}
            </DialogDescription>
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
                <Button
                  onClick={() => {
                    setViewFeedback(null);
                    handleOpenRespond(viewFeedback);
                  }}
                >
                  Respond
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to feedback</DialogTitle>
            <DialogDescription>
              {selectedFeedback && (
                <>
                  <span className="font-medium">{selectedFeedback.userEmail}</span>: {selectedFeedback.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <div>
                <Label>Your response (visible to user)</Label>
                <Textarea
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  placeholder="Type your response..."
                  rows={4}
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRespondDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={respondMutation.isPending}>
                  {respondMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save response
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFeedbackPage;
