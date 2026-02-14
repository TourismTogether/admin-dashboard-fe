import React, { useMemo, useState } from "react";
import { format, addDays, addWeeks, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export interface GroupTaskForWeek {
  groupTaskId: string;
  requirement?: string;
  priority: string;
  status: string;
  startDate?: string;
  endDate?: string;
  assignees?: { userId: string; email: string; nickname?: string | null; fullname?: string | null }[];
}

interface GroupTaskWeekTableProps {
  tasks: GroupTaskForWeek[];
  onTaskClick?: (task: GroupTaskForWeek) => void;
  getStatusStyles?: (status: string) => string;
}

const PRIORITY_ORDER = ["high", "medium", "low"];

function taskSpansDay(
  task: GroupTaskForWeek,
  dayStr: string
): boolean {
  const start = task.startDate || task.endDate;
  const end = task.endDate || task.startDate;
  if (!start && !end) return false;
  const from = start || end!;
  const to = end || start!;
  return dayStr >= from && dayStr <= to;
}

export const GroupTaskWeekTable: React.FC<GroupTaskWeekTableProps> = ({
  tasks,
  onTaskClick,
  getStatusStyles = () => "bg-gray-100 text-gray-800",
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(
    () => addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset),
    [weekOffset]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const tasksByDayByPriority = useMemo(() => {
    const map: Record<string, Record<string, GroupTaskForWeek[]>> = {};
    PRIORITY_ORDER.forEach((p) => {
      map[p] = {};
      weekDays.forEach((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        map[p][dayStr] = tasks.filter(
          (t) => t.priority.toLowerCase() === p && taskSpansDay(t, dayStr)
        );
      });
    });
    return map;
  }, [tasks, weekDays]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Week of {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((o) => o - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((o) => o + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Priority</TableHead>
              {weekDays.map((day, i) => (
                <TableHead key={i} className="text-center min-w-[140px]">
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
            {PRIORITY_ORDER.map((priority) => (
              <TableRow key={priority}>
                <TableCell className="font-medium capitalize align-top">
                  {priority}
                </TableCell>
                {weekDays.map((day, dayIndex) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const cellTasks = tasksByDayByPriority[priority]?.[dayStr] ?? [];
                  return (
                    <TableCell
                      key={dayIndex}
                      className="align-top min-w-[140px] relative group/cell"
                    >
                      <div className="space-y-2">
                        {cellTasks.map((task) => (
                          <div
                            key={task.groupTaskId}
                            className={cn(
                              "p-2 border rounded bg-card hover:bg-accent cursor-pointer group/task",
                              onTaskClick && "hover:ring-1 hover:ring-primary/30"
                            )}
                            onClick={() => onTaskClick?.(task)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div
                                  className="font-medium text-sm truncate"
                                  title={task.requirement || "Task"}
                                >
                                  {task.requirement || "Untitled"}
                                </div>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  <span
                                    className={cn(
                                      "text-xs px-1.5 py-0.5 rounded",
                                      getStatusStyles(task.status)
                                    )}
                                  >
                                    {task.status.replace(/_/g, " ")}
                                  </span>
                                </div>
                                {task.assignees?.length ? (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {task.assignees.slice(0, 2).map((a) => (
                                      <span
                                        key={a.userId}
                                        className="text-[10px] bg-muted rounded px-1.5 py-0.5 truncate max-w-[80px]"
                                        title={a.nickname || a.fullname || a.email}
                                      >
                                        {a.nickname || a.fullname || a.email}
                                      </span>
                                    ))}
                                    {task.assignees.length > 2 && (
                                      <span className="text-[10px] text-muted-foreground">
                                        +{task.assignees.length - 2}
                                      </span>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
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
