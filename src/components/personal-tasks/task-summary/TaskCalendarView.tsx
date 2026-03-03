import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import type { Task, Swimlane } from "../shared/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getPriorityBadgeVariant,
  getStatusBadgeVariant,
} from "../shared/utils";
import { MonthlyPerformanceStats } from "../performance-stats";

interface TaskCalendarViewProps {
  swimlanes: Swimlane[];
  onViewTask: (task: Task) => void;
  onDeleteTask?: (taskId: string, content: string) => void;
  onAddTaskForDate?: (date: string) => void;
}

type HolidayMap = Record<string, string>;

const buildHolidayMap = (): HolidayMap => {
  const map: HolidayMap = {};

  const addRange = (start: string, end: string, name: string) => {
    let current = parseISO(start);
    const last = parseISO(end);
    while (current <= last) {
      map[format(current, "yyyy-MM-dd")] = name;
      current = addDays(current, 1);
    }
  };

  // 2025: each date has its own label
  addRange("2025-01-28", "2025-02-03", "Tết Nguyên Đán");
  map["2025-04-06"] = "Giỗ Tổ Hùng Vương";
  map["2025-04-30"] = "Giải Phóng MN";
  map["2025-05-01"] = "Quốc Tế Lao Động";
  map["2025-09-02"] = "Quốc Khánh";

  // 2026
  addRange("2026-01-17", "2026-01-23", "Tết Nguyên Đán");
  map["2026-03-30"] = "Giỗ Tổ Hùng Vương";
  map["2026-04-30"] = "Giải Phóng MN";
  map["2026-05-01"] = "Quốc Tế Lao Động";
  map["2026-09-02"] = "Quốc Khánh";

  return map;
};

const HOLIDAYS = buildHolidayMap();

const getHolidayName = (date: Date): string | null => {
  const dateKey = format(date, "yyyy-MM-dd");
  if (HOLIDAYS[dateKey]) return HOLIDAYS[dateKey];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 1 && day === 1) return "Tết Dương Lịch";
  if (month === 4 && day === 30) return "Giải Phóng MN";
  if (month === 5 && day === 1) return "Quốc Tế Lao Động";
  if (month === 9 && day === 2) return "Quốc Khánh";
  return null;
};

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAY_LABELS_MOBILE = ["T", "T", "T", "T", "T", "T", "C"];

function getPriorityDotColor(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-amber-500";
    default:
      return "bg-gray-400";
  }
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  swimlanes,
  onViewTask,
  onDeleteTask,
  onAddTaskForDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [mobileSheetDate, setMobileSheetDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "incomplete" | "done">(
    "incomplete",
  );
  const allTabRef = useRef<HTMLButtonElement>(null);
  const incompleteTabRef = useRef<HTMLButtonElement>(null);
  const doneTabRef = useRef<HTMLButtonElement>(null);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
  const today = useMemo(() => new Date(), []);

  const allTasks = useMemo(
    () => swimlanes.flatMap((s) => s.tasks || []),
    [swimlanes]
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);

  const { tasksByDate, incompleteCount, doneCount } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const map: Record<string, Task[]> = {};
    let incomplete = 0;
    let done = 0;
    allTasks.forEach((task) => {
      try {
        const d = parseISO(task.taskDate);
        if (!isWithinInterval(d, { start, end })) return;
        const isDone = task.status === "done";
        if (isDone) {
          done += 1;
        } else {
          incomplete += 1;
        }

        if (activeTab === "incomplete" && isDone) return;
        if (activeTab === "done" && !isDone) return;
        const key = format(d, "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(task);
      } catch {
        // ignore
      }
    });
    return { tasksByDate: map, incompleteCount: incomplete, doneCount: done };
  }, [allTasks, currentMonth, activeTab]);

  useEffect(() => {
    const update = () => {
      const ref =
        activeTab === "all"
          ? allTabRef
          : activeTab === "incomplete"
          ? incompleteTabRef
          : doneTabRef;
      if (ref.current) {
        const { offsetLeft, offsetWidth } = ref.current;
        setTabIndicator({ left: offsetLeft, width: offsetWidth });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeTab, incompleteCount, doneCount]);

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const handlePrevMonth = () =>
    setCurrentMonth((prev) => addDays(startOfMonth(prev), -1));
  const handleNextMonth = () =>
    setCurrentMonth((prev) => addDays(endOfMonth(prev), 1));
  const handleToday = () => setCurrentMonth(new Date());

  const dayTasksForSheet = mobileSheetDate
    ? tasksByDate[mobileSheetDate] || []
    : [];

  return (
    <div className="w-full space-y-4">
      {/* Header: < | Month Year | > + Today */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[160px] text-center text-sm font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="shrink-0"
        >
          Today
        </Button>
      </div>

      {/* Tabs: All | Incomplete | Done (giống table view, theo tháng) */}
      <div className="border-b relative">
        <div className="flex gap-2 relative">
          <div
            className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-in-out rounded-full"
            style={{ left: tabIndicator.left, width: tabIndicator.width }}
          />
          <button
            ref={allTabRef}
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out",
              "border-b-2 border-transparent",
              activeTab === "all"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All ({incompleteCount + doneCount})
          </button>
          <button
            ref={incompleteTabRef}
            type="button"
            onClick={() => setActiveTab("incomplete")}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out",
              "border-b-2 border-transparent",
              activeTab === "incomplete"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Incomplete ({incompleteCount})
          </button>
          <button
            ref={doneTabRef}
            type="button"
            onClick={() => setActiveTab("done")}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out",
              "border-b-2 border-transparent",
              activeTab === "done"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Done ({doneCount})
          </button>
        </div>
      </div>

      {/* Grid: 100% width, 7 equal columns */}
      <div className="w-full overflow-x-auto">
        <div className="w-full min-w-0 grid grid-cols-7 gap-0 border border-gray-100 rounded-lg overflow-hidden">
          {/* Day headers: full label on sm+, single letter on mobile */}
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label + i}
              className={cn(
                "bg-muted/50 px-0.5 py-2 text-center text-xs font-medium text-muted-foreground border-b border-gray-100",
                i >= 5 && "bg-gray-50"
              )}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{WEEKDAY_LABELS_MOBILE[i]}</span>
            </div>
          ))}

          {weeks.map((week, weekIndex) =>
            week.map((date, dayIndex) => {
              const dateKey = format(date, "yyyy-MM-dd");
              const dayTasks = tasksByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(date, monthStart);
              const isToday = isSameDay(date, today);
              const holidayName = isCurrentMonth ? getHolidayName(date) : null;
              const isWeekend = dayIndex >= 5;

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={cn(
                    "flex flex-col min-w-0 border border-gray-100",
                    "h-16 min-h-16 max-h-16 md:h-[110px] md:min-h-[110px] md:max-h-[110px] lg:h-[140px] lg:min-h-[140px] lg:max-h-[140px]",
                    isToday && "bg-green-100",
                    isWeekend && "bg-gray-50/80"
                  )}
                >
                  <div className="flex flex-col flex-1 min-h-0 p-1 group/cell h-full">
                    {/* Top: date + holiday (always visible), + button (current month only) */}
                    <div className="flex items-start justify-between gap-0.5 shrink-0">
                      <span
                        className={cn(
                          "tabular-nums font-medium",
                          "text-[11px] sm:text-sm",
                          isToday && "font-bold text-green-700",
                          isCurrentMonth && !isToday && "text-foreground",
                          !isCurrentMonth && "text-gray-300"
                        )}
                      >
                        {format(date, "d")}
                      </span>
                      {isCurrentMonth && onAddTaskForDate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddTaskForDate(dateKey);
                          }}
                          className={cn(
                            "w-5 h-5 shrink-0 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 transition-opacity",
                            "opacity-100 sm:opacity-0 sm:group-hover/cell:opacity-100"
                          )}
                          title="Add task"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {isCurrentMonth && holidayName && (
                      <div
                        className="text-[10px] text-red-500 font-medium truncate shrink-0"
                        title={holidayName}
                      >
                        {holidayName}
                      </div>
                    )}

                    {/* Task area: remaining height, overflow hidden */}
                    <div
                      className={cn(
                        "flex-1 min-h-0 overflow-hidden mt-0.5",
                        "cursor-pointer"
                      )}
                      onClick={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (!isCurrentMonth) return;
                        if (window.innerWidth < 640) {
                          setMobileSheetDate(dateKey);
                        } else if (onAddTaskForDate) {
                          onAddTaskForDate(dateKey);
                        }
                      }}
                    >
                      <div className="h-full overflow-hidden flex flex-col gap-0.5">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.taskId}
                            className={cn(
                              "flex items-center gap-0.5 shrink-0 group/task transition-opacity",
                              task.isPending && "opacity-70"
                            )}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewTask(task);
                              }}
                              className="flex-1 min-w-0 text-left"
                            >
                              <span className="sm:hidden flex items-center justify-center">
                                <span
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    getPriorityDotColor(task.priority),
                                    task.status === "done" && "opacity-50"
                                  )}
                                  title={task.content}
                                />
                              </span>
                              <Badge
                                variant={getPriorityBadgeVariant(task.priority)}
                                className={cn(
                                  "hidden sm:inline-flex w-full justify-start truncate max-w-full font-normal text-[10px] px-1.5 py-0",
                                  task.status === "done" && "opacity-75 line-through"
                                )}
                              >
                                <span className="truncate">{task.content}</span>
                              </Badge>
                            </button>
                            {onDeleteTask && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTask(task.taskId, task.content);
                                }}
                                className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/task:opacity-100 sm:opacity-70"
                                title="Xóa task"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.innerWidth < 640) {
                                    setMobileSheetDate(dateKey);
                                  }
                                }}
                                className="text-[10px] text-muted-foreground hover:text-foreground text-left w-full shrink-0 px-1.5 py-0.5 rounded-full inline-flex items-center justify-center"
                              >
                                +{dayTasks.length - 3} more
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="w-64 p-2 max-h-64 overflow-y-auto"
                            >
                              <div className="space-y-1">
                                {dayTasks.map((task) => (
                                  <div
                                    key={task.taskId}
                                    className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent group/task"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => onViewTask(task)}
                                      className="flex-1 min-w-0 text-left flex items-center gap-2"
                                    >
                                      <Badge
                                        variant={getStatusBadgeVariant(
                                          task.status
                                        )}
                                        className="text-[10px] shrink-0"
                                      >
                                        {task.status}
                                      </Badge>
                                      <Badge
                                        variant={getPriorityBadgeVariant(
                                          task.priority
                                        )}
                                        className="text-[10px] shrink-0"
                                      >
                                        {task.priority}
                                      </Badge>
                                      <span
                                      className={cn(
                                        "truncate flex-1",
                                        task.status === "done" &&
                                          "line-through text-muted-foreground"
                                      )}
                                    >
                                      {task.content}
                                    </span>
                                    </button>
                                    {onDeleteTask && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteTask(task.taskId, task.content);
                                        }}
                                        className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        title="Xóa task"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {onAddTaskForDate && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={() => onAddTaskForDate(dateKey)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Task
                                </Button>
                              )}
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Monthly performance statistics for the same month as calendar */}
      <MonthlyPerformanceStats swimlanes={swimlanes} monthDate={currentMonth} />

      {/* Mobile bottom sheet: task list for selected day + Add Task */}
      {mobileSheetDate && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 sm:hidden"
            onClick={() => setMobileSheetDate(null)}
            aria-hidden
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-lg border border-gray-100 bg-background shadow-lg sm:hidden">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-background px-4 py-3">
              <span className="text-sm font-medium">
                {format(parseISO(mobileSheetDate), "EEE, MMM d, yyyy")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMobileSheetDate(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-2">
              {dayTasksForSheet.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No tasks this day
                </p>
              ) : (
                dayTasksForSheet.map((task) => (
                  <div
                    key={task.taskId}
                    className="flex items-center gap-2 rounded-lg border border-gray-100 p-3 hover:bg-accent"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onViewTask(task);
                        setMobileSheetDate(null);
                      }}
                      className="flex-1 min-w-0 text-left flex items-center gap-2"
                    >
                      <Badge
                        variant={getStatusBadgeVariant(task.status)}
                        className="shrink-0"
                      >
                        {task.status}
                      </Badge>
                      <Badge
                        variant={getPriorityBadgeVariant(task.priority)}
                        className="shrink-0"
                      >
                        {task.priority}
                      </Badge>
                      <span
                        className={cn(
                          "truncate flex-1",
                          task.status === "done" &&
                            "line-through text-muted-foreground"
                        )}
                      >
                        {task.content}
                      </span>
                    </button>
                    {onDeleteTask && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          onDeleteTask(task.taskId, task.content);
                          setMobileSheetDate(null);
                        }}
                        title="Xóa task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
              {onAddTaskForDate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onAddTaskForDate(mobileSheetDate);
                    setMobileSheetDate(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
