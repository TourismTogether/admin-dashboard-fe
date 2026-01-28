import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus } from "lucide-react";
import { format } from "date-fns";

interface CreateGroupTaskDialogProps {
  swimlaneId: string;
  onSuccess: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: {
    content: string;
    status?: string;
    priority?: string;
    detail?: string;
    taskDate: string;
  }) => Promise<void>;
}

export const CreateGroupTaskDialog: React.FC<CreateGroupTaskDialogProps> = ({
  swimlaneId: _swimlaneId,
  onSuccess,
  isOpen,
  onOpenChange,
  onSubmit,
}) => {
  const [taskName, setTaskName] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [detail, setDetail] = useState("");
  const [taskDate, setTaskDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!taskName.trim()) {
      setError("Task name is required");
      return;
    }

    if (!taskDate) {
      setError("Task date is required");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        content: taskName,
        status,
        priority,
        detail,
        taskDate,
      });
      resetForm();
      onSuccess();
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTaskName("");
    setStatus("todo");
    setPriority("medium");
    setDetail("");
    setTaskDate(format(new Date(), "yyyy-MM-dd"));
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to this swimlane.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-name">Task Name *</Label>
            <Input
              id="task-name"
              placeholder="e.g., Implement API endpoint"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-date">Date *</Label>
              <Input
                id="task-date"
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="task-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="delay">Delayed</SelectItem>
                <SelectItem value="reopen">Reopened</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-detail">Details</Label>
            <Textarea
              id="task-detail"
              placeholder="Add more details about this task..."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                if (onOpenChange) onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
