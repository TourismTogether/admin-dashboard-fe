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
  onCreate: (data: { content: string; startTime?: string; duration?: number }) => void;
  isLoading?: boolean;
}

export const CreateSwimlaneDialog: React.FC<CreateSwimlaneDialogProps> = ({
  open,
  onOpenChange,
  onCreate,
  isLoading = false,
}) => {
  const [content, setContent] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");

  const handleCreate = () => {
    if (!content.trim()) return;
    onCreate({
      content,
      startTime: startTime.trim() || undefined,
      duration: duration ? parseInt(duration, 10) : undefined,
    });
    setContent("");
    setStartTime("");
    setDuration("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setContent("");
    setStartTime("");
    setDuration("");
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
            <Label htmlFor="swimlane-content">Content *</Label>
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
          <div className="space-y-2">
            <Label htmlFor="swimlane-start-time">Start Time</Label>
            <Input
              id="swimlane-start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="HH:MM"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="swimlane-duration">Duration (minutes)</Label>
            <Input
              id="swimlane-duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Enter duration in minutes"
              min="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
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
