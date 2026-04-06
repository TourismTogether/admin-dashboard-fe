import React from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { Task } from "../shared/types";
import { getPriorityBadgeVariant } from "../shared/utils";

interface TaskCardProps {
  task: Task;
  swimlaneName: string;
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: string, content: string) => void;
  readOnly?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  swimlaneName,
  onViewTask,
  onDeleteTask,
  readOnly = false,
}) => {
  return (
    <div
      className={`p-3 border rounded-lg bg-card transition-colors space-y-2 ${
        readOnly ? "cursor-wait opacity-90" : "hover:bg-accent cursor-pointer"
      } ${task.isPending ? "opacity-70" : ""}`}
      onClick={() => {
        if (readOnly) return;
        onViewTask(task);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm flex-1">{task.content}</p>
        <Button
          variant="ghost"
          size="sm"
          disabled={readOnly}
          onClick={(e) => {
            e.stopPropagation();
            if (readOnly) return;
            onDeleteTask(task.taskId, task.content);
          }}
          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-xs">
          {task.priority}
        </Badge>
        <span className="text-xs text-muted-foreground">{swimlaneName}</span>
        <span className="text-xs text-muted-foreground">
          {format(parseISO(task.taskDate), "MMM d")}
        </span>
      </div>
    </div>
  );
};
