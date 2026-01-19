import React from "react";
import { format, addDays, parseISO } from "date-fns";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Swimlane {
  swimlaneId: string;
  tableId: string;
  content: string;
  startTime?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

interface Task {
  taskId: string;
  swimlaneId: string;
  content: string;
  status: string;
  priority: string;
  detail?: string;
  taskDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface WeekTableProps {
  startDate: string;
  week: number;
  swimlanes: Swimlane[];
  onAddSwimlane: () => void;
  onDeleteSwimlane: (swimlaneId: string) => void;
  onAddTask: (swimlaneId: string, dayIndex: number) => void;
  onEditTask: (task: Task, swimlaneId: string, dayIndex: number) => void;
  onDeleteTask: (taskId: string) => void;
}

export const WeekTable: React.FC<WeekTableProps> = ({
  startDate,
  week,
  swimlanes,
  onAddSwimlane,
  onDeleteSwimlane,
  onEditTask,
  onAddTask,
  onDeleteTask,
}) => {
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(parseISO(startDate), i)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            Week {week} - {format(parseISO(startDate), "MMM d")} to{" "}
            {format(addDays(parseISO(startDate), 6), "MMM d, yyyy")}
          </h2>
        </div>
        <Button variant="outline" onClick={onAddSwimlane}>
          <Plus className="h-4 w-4 mr-2" />
          Add Swimlane
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Swimlane</TableHead>
              {weekDays.map((day, index) => (
                <TableHead key={index} className="text-center">
                  {format(day, "EEE")}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {format(day, "MMM d")}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {swimlanes.map((swimlane) => (
              <TableRow key={swimlane.swimlaneId}>
                <TableCell className="font-medium">
                  <div className="flex items-center justify-between">
                    <div>
                      <span>{swimlane.content}</span>
                      {swimlane.startTime && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {swimlane.startTime}
                          {swimlane.duration &&
                            ` (${Math.floor(swimlane.duration / 60)}h)`}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this swimlane?"
                          )
                        ) {
                          onDeleteSwimlane(swimlane.swimlaneId);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
                {weekDays.map((day, dayIndex) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const tasksForDay = swimlane.tasks?.filter((task) => {
                    const taskDate =
                      (task as any).taskDate || task.createdAt;
                    return format(parseISO(taskDate), "yyyy-MM-dd") === dayStr;
                  }) || [];

                  return (
                    <TableCell
                      key={dayIndex}
                      className="align-top min-w-[150px]"
                    >
                      <div className="space-y-2">
                        {tasksForDay.map((task) => (
                          <div
                            key={task.taskId}
                            className="p-2 border rounded bg-card hover:bg-accent cursor-pointer group"
                            onClick={() =>
                              onEditTask(task, swimlane.swimlaneId, dayIndex)
                            }
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {task.content}
                                </div>
                                <div className="flex gap-1 mt-1">
                                  <span
                                    className={cn(
                                      "text-xs px-1.5 py-0.5 rounded",
                                      task.status === "done"
                                        ? "bg-green-100 text-green-800"
                                        : task.status === "in_progress"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    )}
                                  >
                                    {task.status}
                                  </span>
                                  <span
                                    className={cn(
                                      "text-xs px-1.5 py-0.5 rounded",
                                      task.priority === "high"
                                        ? "bg-red-100 text-red-800"
                                        : task.priority === "medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    )}
                                  >
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this task?"
                                    )
                                  ) {
                                    onDeleteTask(task.taskId);
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => onAddTask(swimlane.swimlaneId, dayIndex)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Task
                        </Button>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
