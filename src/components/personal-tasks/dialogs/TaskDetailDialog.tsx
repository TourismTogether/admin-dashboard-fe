import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task, ChecklistItem } from "../shared/types";

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, content: string, status: string, priority: string, detail?: string, checklist?: ChecklistItem[] | null) => void;
  isLoading?: boolean;
}

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  task,
  open,
  onOpenChange,
  onSave,
  isLoading = false,
}) => {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [detail, setDetail] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Generate unique ID for checklist items
  const generateChecklistId = () => {
    return `checklist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Ensure all checklist items have IDs (for backward compatibility)
  const ensureChecklistIds = (items: ChecklistItem[]): ChecklistItem[] => {
    return items.map((item) => ({
      ...item,
      id: item.id || generateChecklistId(),
    }));
  };

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setContent("");
      setStatus("todo");
      setPriority("medium");
      setDetail("");
      setChecklist([]);
      return;
    }

    // Load task data when dialog opens
    if (task) {
      setContent(task.content);
      setStatus(task.status);
      setPriority(task.priority);
      setDetail(task.detail || "");
      const loadedChecklist = task.checklist ? [...task.checklist] : [];
      setChecklist(ensureChecklistIds(loadedChecklist));
    } else {
      setContent("");
      setStatus("todo");
      setPriority("medium");
      setDetail("");
      setChecklist([]);
    }
  }, [task, open]);

  const handleAddChecklistItem = () => {
    setChecklist((prev) => [...prev, { id: generateChecklistId(), description: "", isComplete: false }]);
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleChecklistItemChange = (id: string, field: keyof ChecklistItem, value: string | boolean) => {
    setChecklist((prev) => {
      return prev.map((item) => (item.id === id ? { ...item, [field]: value } : item));
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !task) return;
    const validChecklist = checklist.filter(item => item.description.trim());
    const detailValue = detail.trim() ? detail.trim() : null;
    const checklistValue = validChecklist.length > 0 ? validChecklist : null;
    onSave(task.taskId, content, status, priority, detailValue || undefined, checklistValue);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
          <DialogDescription>
            View and edit task details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-date">Date</Label>
              <Input
                id="task-date"
                value={format(parseISO(task.taskDate), "MMM d, yyyy")}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-created">Created</Label>
              <Input
                id="task-created"
                value={format(parseISO(task.createdAt), "MMM d, yyyy HH:mm")}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-detail">Detail</Label>
            <Textarea
              id="task-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Enter task details..."
              rows={6}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Checklist (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddChecklistItem}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2 border rounded-md p-3">
              {checklist.length > 0 ? (
                checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={item.isComplete}
                      onCheckedChange={(checked: boolean) =>
                        handleChecklistItemChange(item.id, "isComplete", checked)
                      }
                    />
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        handleChecklistItemChange(item.id, "description", e.target.value)
                      }
                      placeholder="Checklist item..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No checklist items. Click "Add Item" to create one.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Close
            </Button>
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
