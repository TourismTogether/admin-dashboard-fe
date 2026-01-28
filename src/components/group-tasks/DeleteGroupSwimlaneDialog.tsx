import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface DeleteGroupSwimlaneDialogProps {
  swimlane: { swimlaneId: string; content: string } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (swimlaneId: string) => Promise<void>;
  isLoading?: boolean;
}

export const DeleteGroupSwimlaneDialog: React.FC<DeleteGroupSwimlaneDialogProps> = ({
  swimlane,
  isOpen,
  onOpenChange,
  onDelete,
  isLoading = false,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmText !== swimlane?.content) {
      setError("Swimlane name does not match");
      return;
    }

    try {
      await onDelete(swimlane!.swimlaneId);
      setConfirmText("");
      setError("");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to delete swimlane");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Swimlane</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{swimlane?.content}"? This action cannot be undone.
            All tasks in this swimlane will also be deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Type the swimlane name to confirm: <span className="font-semibold">{swimlane?.content}</span>
            </Label>
            <Input
              id="confirm-name"
              placeholder={swimlane?.content}
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmText("");
                setError("");
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || confirmText !== swimlane?.content}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isLoading ? "Deleting..." : "Delete Swimlane"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
