import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/components/personal-tasks/shared/types";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, content: string) => void;
}

const TaskItem: React.FC<{
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, content: string) => void;
}> = ({ task, onEdit, onDelete }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "todo":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-medium truncate">{task.content}</h4>
          <Badge className={getPriorityColor(task.priority)} variant="outline">
            {task.priority}
          </Badge>
          <Badge className={getStatusColor(task.status)} variant="outline">
            {task.status}
          </Badge>
        </div>
        {task.detail && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.detail}</p>
        )}
        
        {/* Checklist Section - Read Only */}
        {task.checklist && task.checklist.length > 0 && (
          <div className="mt-3 space-y-1">
            {task.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={item.isComplete}
                  disabled
                  className="rounded-sm"
                />
                <span
                  className={`flex-1 ${
                    item.isComplete ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item.description}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(task)}
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.taskId, task.content)}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No incomplete tasks for today.</p>
        <p className="text-sm mt-2">Add a task to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.taskId}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
