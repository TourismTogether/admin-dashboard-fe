import React, { useState, useEffect } from "react";
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

/** Parse "HH:MM" or "HH:MM:SS" to minutes since midnight */
function timeToMinutes(t: string): number {
  const parts = t.trim().split(":").map(Number);
  if (parts.length < 2) return 0;
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

/** Format minutes since midnight to "HH:MM" */
function minutesToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export interface SwimlaneToEdit {
  swimlaneId: string;
  content: string;
  startTime?: string;
  duration?: number;
}

interface EditSwimlaneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  swimlane: SwimlaneToEdit | null;
  onUpdate: (
    swimlaneId: string,
    data: { content: string; startTime?: string; duration?: number }
  ) => void;
  isLoading?: boolean;
}

export const EditSwimlaneDialog: React.FC<EditSwimlaneDialogProps> = ({
  open,
  onOpenChange,
  swimlane,
  onUpdate,
  isLoading = false,
}) => {
  const [content, setContent] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (swimlane) {
      setContent(swimlane.content);
      const start = swimlane.startTime?.trim() ?? "";
      setStartTime(start.split(":").slice(0, 2).join(":") || "");
      if (start && swimlane.duration != null && swimlane.duration > 0) {
        const startM = timeToMinutes(start);
        const endM = (startM + swimlane.duration) % (24 * 60);
        setEndTime(minutesToTime(endM));
      } else {
        setEndTime("");
      }
    }
  }, [swimlane, open]);

  const handleSave = () => {
    if (!swimlane || !content.trim()) return;
    const start = startTime.trim();
    const end = endTime.trim();
    let duration: number | undefined;
    if (start && end) {
      const startM = timeToMinutes(start);
      const endM = timeToMinutes(end);
      duration = endM > startM ? endM - startM : 24 * 60 - startM + endM;
    }
    const startTimeValue = start
      ? start.split(":").length === 2
        ? `${start}:00`
        : start
      : undefined;
    onUpdate(swimlane.swimlaneId, {
      content,
      startTime: startTimeValue,
      duration,
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!swimlane) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Swimlane</DialogTitle>
          <DialogDescription>
            Update swimlane name and time range.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-swimlane-content">Content *</Label>
            <Input
              id="edit-swimlane-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Morning, Afternoon, Evening"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-swimlane-start-time">Start Time</Label>
              <Input
                id="edit-swimlane-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-swimlane-end-time">End Time</Label>
              <Input
                id="edit-swimlane-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !content.trim()}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
