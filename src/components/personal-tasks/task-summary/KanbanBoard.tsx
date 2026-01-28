import React from "react";
import { Badge } from "@/components/ui/badge";
import type { Task, Swimlane } from "../shared/types";
import { TaskCard } from "./TaskCard";
import { formatStatusLabel } from "../shared/utils";

interface KanbanBoardProps {
  tasksByStatus: Record<string, Task[]>;
  swimlanes: Swimlane[];
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: string, content: string) => void;
}

const getSwimlaneName = (swimlaneId: string, swimlanes: Swimlane[]): string => {
  const swimlane = swimlanes.find((s) => s.swimlaneId === swimlaneId);
  return swimlane?.content || "Unknown";
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasksByStatus,
  swimlanes,
  onViewTask,
  onDeleteTask,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Kanban Board</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Object.entries(tasksByStatus)
          .filter(([status, tasks]) => tasks.length > 0 || status !== "done")
          .map(([status, tasks]) => {
            const statusLabel = formatStatusLabel(status);

            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded-t-lg">
                  <h4 className="font-semibold text-sm">{statusLabel}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {tasks.length}
                  </Badge>
                </div>
                <div className="border rounded-b-lg p-2 min-h-[200px] bg-muted/30 space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
                  ) : (
                    tasks.map((task) => (
                      <TaskCard
                        key={task.taskId}
                        task={task}
                        swimlaneName={getSwimlaneName(task.swimlaneId, swimlanes)}
                        onViewTask={onViewTask}
                        onDeleteTask={onDeleteTask}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
