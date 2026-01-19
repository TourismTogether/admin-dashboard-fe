import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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

interface CreateSwimlaneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (content: string) => void;
  isLoading?: boolean;
}

export const CreateSwimlaneDialog: React.FC<CreateSwimlaneDialogProps> = ({
  open,
  onOpenChange,
  onCreate,
  isLoading = false,
}) => {
  const [content, setContent] = useState("");

  const handleCreate = () => {
    if (!content.trim()) return;
    onCreate(content);
    setContent("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Swimlane</DialogTitle>
          <DialogDescription>
            Add a new swimlane to organize your tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="swimlane-content">Content</Label>
            <Input
              id="swimlane-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter swimlane name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreate();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setContent("");
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading || !content.trim()}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
