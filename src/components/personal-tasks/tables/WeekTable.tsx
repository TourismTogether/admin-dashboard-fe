import React, { useState } from "react";
import { format, addDays, parseISO } from "date-fns";
import { Plus, Trash2, X, Copy, Pencil } from "lucide-react";
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
import type { Task, Swimlane as BaseSwimlane, TaskDifficulty } from "../shared/types";
import { isOptimisticTaskId } from "../shared/utils";

const DIFFICULTY_LABEL: Record<TaskDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

function getDifficultyStyles(difficulty: TaskDifficulty) {
  switch (difficulty) {
    case "easy":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    case "medium":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    case "hard":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getDifficultyBorderClass(difficulty: TaskDifficulty) {
  switch (difficulty) {
    case "easy":
      return "border-l-4 border-l-emerald-500 dark:border-l-emerald-400";
    case "medium":
      return "border-l-4 border-l-amber-500 dark:border-l-amber-400";
    case "hard":
      return "border-l-4 border-l-red-500 dark:border-l-red-400";
    default:
      return "";
  }
}

/** Format swimlane start (HH:MM or HH:MM:SS) + duration (minutes) as "start - end" (HH:MM - HH:MM) */
function formatSwimlaneTimeRange(
  startTime?: string,
  duration?: number
): string | null {
  if (!startTime) return null;
  const parts = startTime.trim().split(":").map(Number);
  if (parts.length < 2) return null;
  const startM = (parts[0] || 0) * 60 + (parts[1] || 0);
  if (duration == null || duration <= 0)
    return parts[0] != null
      ? `${String(parts[0]).padStart(2, "0")}:${String(parts[1] || 0).padStart(
          2,
          "0"
        )}`
      : null;
  const endM = (startM + duration) % (24 * 60);
  const endH = Math.floor(endM / 60);
  const endMin = endM % 60;
  return `${String(parts[0]).padStart(2, "0")}:${String(parts[1] || 0).padStart(
    2,
    "0"
  )} - ${String(endH).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
}

interface Swimlane extends BaseSwimlane {
  tableId: string;
  startTime?: string;
  duration?: number;
}

/** Minimal swimlane shape for edit callback (avoids type conflicts with page Swimlane) */
export type SwimlaneEditPayload = {
  swimlaneId: string;
  content: string;
  startTime?: string;
  duration?: number;
};

interface WeekTableProps {
  startDate: string;
  week: number;
  swimlanes: Swimlane[];
  onAddSwimlane: () => void;
  onDeleteSwimlane: (swimlaneId: string) => void;
  onEditSwimlane?: (swimlane: SwimlaneEditPayload) => void;
  onAddTask: (swimlaneId: string, dayIndex: number) => void;
  onEditTask: (task: Task, swimlaneId: string, dayIndex: number) => void;
  onDeleteTask: (taskId: string, taskContent: string) => void;
  onMoveTask?: (
    taskId: string,
    newTaskDate: string,
    newSwimlaneId?: string
  ) => void;
  onCopyTask?: (task: Task) => void;
  /** When true, task/swimlane editing is disabled (e.g. while a task mutation is in flight). */
  readOnly?: boolean;
}

export const WeekTable: React.FC<WeekTableProps> = ({
  startDate,
  week,
  swimlanes,
  onAddSwimlane,
  onDeleteSwimlane,
  onEditSwimlane,
  onEditTask,
  onAddTask,
  onDeleteTask,
  onMoveTask,
  onCopyTask,
  readOnly = false,
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDayIndex, setDragOverDayIndex] = useState<number | null>(null);
  const [dragOverSwimlaneId, setDragOverSwimlaneId] = useState<string | null>(
    null
  );
  // Parse startDate without timezone issues
  // startDate should be in YYYY-MM-DD format from database
  let startDateParsed: Date;
  if (typeof startDate === "string" && startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // It's already in YYYY-MM-DD format, create date in local timezone
    const [year, month, day] = startDate.split("-").map(Number);
    startDateParsed = new Date(year, month - 1, day);
  } else {
    // Parse ISO string and use local date
    try {
      const parsed = parseISO(startDate);
      startDateParsed = new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );
    } catch (error) {
      // Fallback: try to parse as is
      startDateParsed = new Date(startDate);
    }
  }

  // Validate date
  if (isNaN(startDateParsed.getTime())) {
    console.error("Invalid startDate:", startDate);
    return <div className="text-red-500">Invalid start date format</div>;
  }

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startDateParsed, i)
  );

  return (
    <div className={cn("space-y-4", readOnly && "relative")}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            Week {week} - {format(startDateParsed, "MMM d")} to{" "}
            {format(addDays(startDateParsed, 6), "MMM d, yyyy")}
          </h2>
        </div>
        <Button variant="outline" onClick={onAddSwimlane} disabled={readOnly}>
          <Plus className="h-4 w-4 mr-2" />
          Add Swimlane
        </Button>
      </div>

      <div className={cn("w-full overflow-x-auto rounded-lg border", readOnly && "opacity-90")}>
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px] sm:w-[200px]">Swimlane</TableHead>
              {weekDays.map((day, index) => (
                <TableHead key={index} className="min-w-[100px] text-center sm:min-w-[120px]">
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
            {swimlanes.map((swimlane) => {
              const isDragOverSwimlane =
                dragOverSwimlaneId === swimlane.swimlaneId;

              const handleSwimlaneDragOver = (e: React.DragEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (draggedTask) {
                  setDragOverSwimlaneId(swimlane.swimlaneId);
                }
              };

              const handleSwimlaneDragLeave = (e: React.DragEvent) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;
                if (
                  x < rect.left ||
                  x > rect.right ||
                  y < rect.top ||
                  y > rect.bottom
                ) {
                  setDragOverSwimlaneId(null);
                }
              };

              return (
                <TableRow
                  key={swimlane.swimlaneId}
                  onDragOver={handleSwimlaneDragOver}
                  onDragLeave={handleSwimlaneDragLeave}
                >
                  <TableCell
                    className={cn(
                      "font-medium",
                      isDragOverSwimlane && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span>{swimlane.content}</span>
                        {formatSwimlaneTimeRange(
                          swimlane.startTime,
                          swimlane.duration
                        ) && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatSwimlaneTimeRange(
                              swimlane.startTime,
                              swimlane.duration
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {onEditSwimlane && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditSwimlane(swimlane)}
                            disabled={readOnly}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            onDeleteSwimlane(swimlane.swimlaneId);
                          }}
                          disabled={readOnly}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  {weekDays.map((day, dayIndex) => {
                    const dayStr = format(day, "yyyy-MM-dd");
                    const isDragOver = dragOverDayIndex === dayIndex;
                    const tasksForDay =
                      swimlane.tasks?.filter((task) => {
                        const taskDate = task.taskDate;
                        if (!taskDate) {
                          console.warn("Task missing taskDate:", task);
                          return false;
                        }

                        // Convert taskDate to string format YYYY-MM-DD
                        let taskDateStr: string;

                        if (typeof taskDate === "string") {
                          // If it's already in YYYY-MM-DD format, use it directly
                          if (taskDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            taskDateStr = taskDate;
                          } else {
                            // Parse ISO string and format to YYYY-MM-DD
                            try {
                              const parsed = parseISO(taskDate);
                              taskDateStr = format(parsed, "yyyy-MM-dd");
                            } catch (error) {
                              console.error(
                                "Error parsing taskDate:",
                                taskDate,
                                error
                              );
                              return false;
                            }
                          }
                        } else {
                          // Fallback: try to convert to string
                          try {
                            const dateObj = new Date(taskDate as any);
                            if (isNaN(dateObj.getTime())) {
                              console.error("Invalid taskDate:", taskDate);
                              return false;
                            }
                            taskDateStr = format(dateObj, "yyyy-MM-dd");
                          } catch (error) {
                            console.error(
                              "Error converting taskDate:",
                              taskDate,
                              error
                            );
                            return false;
                          }
                        }

                        const matches = taskDateStr === dayStr;
                        if (
                          !matches &&
                          process.env.NODE_ENV === "development"
                        ) {
                          console.debug(
                            `Task date mismatch: taskDate=${taskDateStr}, dayStr=${dayStr}, taskId=${task.taskId}, taskDateRaw=${taskDate}`
                          );
                        }
                        return matches;
                      }) || [];

                    const handleDragOver = (e: React.DragEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggedTask) {
                        setDragOverDayIndex(dayIndex);
                      }
                    };

                    const handleDragLeave = (e: React.DragEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Only clear if we're actually leaving the cell
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX;
                      const y = e.clientY;
                      if (
                        x < rect.left ||
                        x > rect.right ||
                        y < rect.top ||
                        y > rect.bottom
                      ) {
                        setDragOverDayIndex(null);
                      }
                    };

                    const handleDrop = (e: React.DragEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverDayIndex(null);
                      setDragOverSwimlaneId(null);
                      if (readOnly) {
                        setDraggedTask(null);
                        return;
                      }
                      if (
                        draggedTask &&
                        isOptimisticTaskId(draggedTask.taskId)
                      ) {
                        setDraggedTask(null);
                        return;
                      }

                      if (draggedTask && onMoveTask) {
                        const newTaskDate = format(day, "yyyy-MM-dd");
                        const newSwimlaneId = swimlane.swimlaneId;
                        // Only move if it's a different day or different swimlane
                        if (
                          draggedTask.taskDate !== newTaskDate ||
                          draggedTask.swimlaneId !== newSwimlaneId
                        ) {
                          onMoveTask(
                            draggedTask.taskId,
                            newTaskDate,
                            newSwimlaneId
                          );
                        }
                      }
                      setDraggedTask(null);
                    };

                    return (
                      <TableCell
                        key={dayIndex}
                        className={cn(
                          "align-top min-w-[150px] relative group/cell",
                          isDragOver &&
                            "bg-primary/10 border-2 border-primary border-dashed"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="space-y-2 max-h-[280px] overflow-y-auto">
                          {tasksForDay.map((task) => {
                            const taskLocked =
                              readOnly || isOptimisticTaskId(task.taskId);
                            return (
                            <div
                              key={task.taskId}
                              draggable={!!onMoveTask && !taskLocked}
                              onDragStart={(e) => {
                                if (taskLocked) return;
                                setDraggedTask(task);
                                e.dataTransfer.effectAllowed = "move";
                                // Add visual feedback
                                if (e.dataTransfer) {
                                  e.dataTransfer.setData(
                                    "text/plain",
                                    task.taskId
                                  );
                                }
                              }}
                              onDragEnd={() => {
                                setDraggedTask(null);
                                setDragOverDayIndex(null);
                                setDragOverSwimlaneId(null);
                              }}
                              className={cn(
                                "p-2 border rounded bg-card group/task transition-opacity",
                                taskLocked
                                  ? "cursor-wait opacity-95"
                                  : "hover:bg-accent cursor-pointer",
                                getDifficultyBorderClass((task.difficulty ?? "medium") as TaskDifficulty),
                                draggedTask?.taskId === task.taskId &&
                                  "opacity-50",
                                task.isPending && "opacity-70"
                              )}
                              onClick={() => {
                                if (taskLocked) return;
                                onEditTask(task, swimlane.swimlaneId, dayIndex);
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div
                                    className="font-medium text-sm truncate"
                                    title={task.content}
                                  >
                                    {task.content}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <span
                                      className={cn(
                                        "text-xs px-1.5 py-0.5 rounded border",
                                        getDifficultyStyles((task.difficulty ?? "medium") as TaskDifficulty)
                                      )}
                                    >
                                      {DIFFICULTY_LABEL[(task.difficulty ?? "medium") as TaskDifficulty]}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-xs px-1.5 py-0.5 rounded",
                                        task.status === "done"
                                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                          : task.status === "in_progress"
                                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                      )}
                                    >
                                      {task.status}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-xs px-1.5 py-0.5 rounded",
                                        task.priority === "high"
                                          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                          : task.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                      )}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/task:opacity-100">
                                  {onCopyTask && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      disabled={taskLocked}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (taskLocked) return;
                                        onCopyTask(task);
                                      }}
                                      title="Copy task"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    disabled={taskLocked}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (taskLocked) return;
                                      onDeleteTask(task.taskId, task.content);
                                    }}
                                    title="Delete task"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            );
                          })}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover/cell:opacity-100 h-6 w-6 rounded-full hover:bg-primary/10"
                            disabled={readOnly}
                            onClick={() => {
                              if (readOnly) return;
                              onAddTask(swimlane.swimlaneId, dayIndex);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
