import React, { useState } from "react";
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
  taskDate: string; // Required, not optional
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
  onDeleteTask: (taskId: string, taskContent: string) => void;
  onMoveTask?: (taskId: string, newTaskDate: string, newSwimlaneId?: string) => void;
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
  onMoveTask,
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDayIndex, setDragOverDayIndex] = useState<number | null>(null);
  const [dragOverSwimlaneId, setDragOverSwimlaneId] = useState<string | null>(null);
  // Parse startDate without timezone issues
  // startDate should be in YYYY-MM-DD format from database
  let startDateParsed: Date;
  if (typeof startDate === 'string' && startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // It's already in YYYY-MM-DD format, create date in local timezone
    const [year, month, day] = startDate.split('-').map(Number);
    startDateParsed = new Date(year, month - 1, day);
  } else {
    // Parse ISO string and use local date
    try {
      const parsed = parseISO(startDate);
      startDateParsed = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    } catch (error) {
      // Fallback: try to parse as is
      startDateParsed = new Date(startDate);
    }
  }
  
  // Validate date
  if (isNaN(startDateParsed.getTime())) {
    console.error('Invalid startDate:', startDate);
    return <div className="text-red-500">Invalid start date format</div>;
  }
  
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startDateParsed, i)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            Week {week} - {format(startDateParsed, "MMM d")} to{" "}
            {format(addDays(startDateParsed, 6), "MMM d, yyyy")}
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
            {swimlanes.map((swimlane) => {
              const isDragOverSwimlane = dragOverSwimlaneId === swimlane.swimlaneId;
              
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
                if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                  setDragOverSwimlaneId(null);
                }
              };

              return (
                <TableRow 
                  key={swimlane.swimlaneId}
                  onDragOver={handleSwimlaneDragOver}
                  onDragLeave={handleSwimlaneDragLeave}
                >
                  <TableCell className={cn(
                    "font-medium",
                    isDragOverSwimlane && "bg-primary/5"
                  )}>
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
                        onDeleteSwimlane(swimlane.swimlaneId);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
                {weekDays.map((day, dayIndex) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const isDragOver = dragOverDayIndex === dayIndex;
                  const tasksForDay = swimlane.tasks?.filter((task) => {
                    const taskDate = task.taskDate;
                    if (!taskDate) {
                      console.warn('Task missing taskDate:', task);
                      return false;
                    }
                    
                    // Convert taskDate to string format YYYY-MM-DD
                    let taskDateStr: string;
                    
                    if (typeof taskDate === 'string') {
                      // If it's already in YYYY-MM-DD format, use it directly
                      if (taskDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        taskDateStr = taskDate;
                      } else {
                        // Parse ISO string and format to YYYY-MM-DD
                        try {
                          const parsed = parseISO(taskDate);
                          taskDateStr = format(parsed, "yyyy-MM-dd");
                        } catch (error) {
                          console.error('Error parsing taskDate:', taskDate, error);
                          return false;
                        }
                      }
                    } else {
                      // Fallback: try to convert to string
                      try {
                        const dateObj = new Date(taskDate as any);
                        if (isNaN(dateObj.getTime())) {
                          console.error('Invalid taskDate:', taskDate);
                          return false;
                        }
                        taskDateStr = format(dateObj, "yyyy-MM-dd");
                      } catch (error) {
                        console.error('Error converting taskDate:', taskDate, error);
                        return false;
                      }
                    }
                    
                    const matches = taskDateStr === dayStr;
                    if (!matches && process.env.NODE_ENV === 'development') {
                      console.debug(`Task date mismatch: taskDate=${taskDateStr}, dayStr=${dayStr}, taskId=${task.taskId}, taskDateRaw=${taskDate}`);
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
                    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                      setDragOverDayIndex(null);
                    }
                  };

                  const handleDrop = (e: React.DragEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverDayIndex(null);
                    setDragOverSwimlaneId(null);
                    
                    if (draggedTask && onMoveTask) {
                      const newTaskDate = format(day, "yyyy-MM-dd");
                      const newSwimlaneId = swimlane.swimlaneId;
                      // Only move if it's a different day or different swimlane
                      if (draggedTask.taskDate !== newTaskDate || draggedTask.swimlaneId !== newSwimlaneId) {
                        onMoveTask(draggedTask.taskId, newTaskDate, newSwimlaneId);
                      }
                    }
                    setDraggedTask(null);
                  };

                  return (
                    <TableCell
                      key={dayIndex}
                      className={cn(
                        "align-top min-w-[150px] relative group/cell",
                        isDragOver && "bg-primary/10 border-2 border-primary border-dashed"
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="space-y-2">
                        {tasksForDay.map((task) => (
                          <div
                            key={task.taskId}
                            draggable={!!onMoveTask}
                            onDragStart={(e) => {
                              setDraggedTask(task);
                              e.dataTransfer.effectAllowed = "move";
                              // Add visual feedback
                              if (e.dataTransfer) {
                                e.dataTransfer.setData("text/plain", task.taskId);
                              }
                            }}
                            onDragEnd={() => {
                              setDraggedTask(null);
                              setDragOverDayIndex(null);
                              setDragOverSwimlaneId(null);
                            }}
                            className={cn(
                              "p-2 border rounded bg-card hover:bg-accent cursor-pointer group/task",
                              draggedTask?.taskId === task.taskId && "opacity-50"
                            )}
                            onClick={() =>
                              onEditTask(task, swimlane.swimlaneId, dayIndex)
                            }
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="font-medium text-sm truncate" title={task.content}>
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
                                className="opacity-0 group-hover/task:opacity-100 h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTask(task.taskId, task.content);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover/cell:opacity-100 h-6 w-6 rounded-full hover:bg-primary/10"
                          onClick={() => onAddTask(swimlane.swimlaneId, dayIndex)}
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
