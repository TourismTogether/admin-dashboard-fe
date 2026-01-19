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

interface Task {
  taskId: string;
  swimlaneId: string;
  content: string;
  status: string;
  priority: string;
  detail?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskDialogProps {
  task: Task | null;
  taskDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: string, status: string, priority: string, taskDate: string) => void;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({
  task,
  taskDate,
  open,
  onOpenChange,
  onSave,
}) => {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    if (task) {
      setContent(task.content);
      setStatus(task.status);
      setPriority(task.priority);
    } else {
      setContent("");
      setStatus("todo");
      setPriority("medium");
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSave(content, status, priority, taskDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {task
              ? "Update the task details below."
              : "Fill in the task details below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-content">Content</Label>
            <Input
              id="task-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter task content"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-status">Status</Label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="reopen">Reopen</option>
              <option value="delay">Delay</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-priority">Priority</Label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
