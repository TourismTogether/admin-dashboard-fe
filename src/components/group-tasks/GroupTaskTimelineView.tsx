import React from "react";
import { 
  format, 
  parseISO, 
  addDays, 
  startOfDay, 
  startOfMonth, 
  endOfMonth, 
  differenceInDays, 
  eachMonthOfInterval 
} from "date-fns";

interface GroupMember {
  userId: string;
  email: string;
  nickname?: string | null;
  fullname?: string | null;
}

interface GroupTask {
  groupTaskId: string;
  groupId: string;
  priority: string;
  status: string;
  startDate?: string;
  endDate?: string;
  requirement?: string;
  delivery?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  assignees?: GroupMember[];
}

interface GroupTaskTimelineViewProps {
  tasks: GroupTask[];
}

export const GroupTaskTimelineView: React.FC<GroupTaskTimelineViewProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No tasks to display in timeline</p>
      </div>
    );
  }

  const taskDates = tasks
    .map((task) => {
      const start = task.startDate ? parseISO(task.startDate) : parseISO(task.createdAt);
      const end = task.endDate ? parseISO(task.endDate) : start;
      return { start, end };
    });

  if (taskDates.length === 0) return null;

  const today = new Date();
  const earliestDate = taskDates.reduce((acc, curr) => curr.start < acc ? curr.start : acc, taskDates[0].start);
  const latestDate = taskDates.reduce((acc, curr) => curr.end > acc ? curr.end : acc, taskDates[0].end);

  const timelineStart = startOfDay(earliestDate < today ? earliestDate : today);
  const timelineEnd = startOfDay(latestDate);
  const months = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
  const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
  const dayWidth = 40;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold">Timeline View</h3>
        <p className="text-xs text-muted-foreground sm:text-sm">Task timeline - Each column = 1 day</p>
      </div>
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="flex min-w-max">
          <div className="w-[120px] sm:w-[200px] flex-shrink-0 border-r">
            {/* Task names column */}
            <div className="border-b h-[40px] flex items-center px-2 sm:px-3">
              <span className="text-xs font-semibold text-foreground sm:text-sm">Tasks</span>
            </div>
            <div className="h-[40px] border-b bg-muted/40" />
            <div className="relative">
              {tasks.map((task) => (
                <div key={task.groupTaskId} className="h-[40px] flex items-center px-2 sm:px-3 border-b">
                  <p className="truncate text-xs font-medium text-foreground sm:text-sm">
                    {task.requirement || "Untitled task"}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-max">
              {/* Header with months */}
              <div className="flex items-center border-b h-[40px]">
                {months.map((month, idx) => {
                  const monthStart = month < timelineStart ? timelineStart : startOfMonth(month);
                  const monthEnd = endOfMonth(month) > timelineEnd ? timelineEnd : endOfMonth(month);
                  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
                  const width = daysInMonth * dayWidth;
                  
                  return (
                    <div
                      key={idx}
                      className="flex h-full items-center border-r border-border px-2 text-sm font-semibold text-foreground"
                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                    >
                      {format(month, "MMM")}
                    </div>
                  );
                })}
              </div>

              {/* Day numbers row */}
              <div className="flex h-[40px] items-center overflow-visible border-b bg-muted/40">
                {Array.from({ length: totalDays }).map((_, idx) => {
                  const currentDate = addDays(timelineStart, idx);
                  const isToday = format(currentDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                  return (
                    <div
                      key={idx}
                      className={`flex h-full flex-shrink-0 items-center justify-center border-r border-border text-center text-xs ${isToday ? "bg-secondary/50 font-bold text-secondary-foreground" : "text-muted-foreground"}`}
                      style={{ width: `${dayWidth}px` }}
                    >
                      {format(currentDate, 'd')}
                    </div>
                  );
                })}
              </div>

              {/* Grid lines */}
              <div className="relative">
                <div className="absolute inset-0 flex" style={{ width: `${totalDays * dayWidth}px` }}>
                  {Array.from({ length: totalDays }).map((_, idx) => {
                    const currentDate = addDays(timelineStart, idx);
                    const isToday = format(currentDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                    return (
                      <div
                        key={idx}
                        className={`border-r ${isToday ? "border-primary/50 bg-primary/10" : "border-border"}`}
                        style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
                      />
                    );
                  })}
                </div>

                {/* Tasks */}
                <div className="relative">
                  {tasks.map((task) => {
                    const taskStart = startOfDay(task.startDate ? parseISO(task.startDate) : parseISO(task.createdAt));
                    const taskEnd = startOfDay(task.endDate ? parseISO(task.endDate) : taskStart);
                    const timelineStartDay = startOfDay(timelineStart);
                    
                    const offsetDays = differenceInDays(taskStart, timelineStartDay);
                    const durationDays = differenceInDays(taskEnd, taskStart) + 1;
                    
                    const left = offsetDays * dayWidth;
                    const width = durationDays * dayWidth;

                    const statusColor = task.status === "done" ? "bg-green-500" :
                      task.status === "in_progress" ? "bg-blue-500" :
                    task.status === "delay" ? "bg-red-500" :
                    task.status === "reopen" ? "bg-orange-500" :
                    "bg-muted-foreground/50";

                    return (
                      <div key={task.groupTaskId} className="relative flex items-center h-[40px] border-b">
                        <div className="absolute rounded" style={{
                          left: `${left}px`,
                          width: `${Math.max(width, dayWidth)}px`,
                          height: '32px',
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}>
                          <div
                            className={`${statusColor} h-full rounded flex items-center px-2 shadow-sm`}
                          >
                            <span className="text-xs font-medium text-white truncate">
                              {task.status.replace(/_/g, " ")}
                            </span>
                            {task.assignees && task.assignees.length > 0 && (
                              <div className="ml-auto flex gap-0.5">
                                {task.assignees.slice(0, 2).map((assignee) => (
                                  <div
                                    key={assignee.userId}
                                    className="w-5 h-5 rounded-full bg-white/30 text-white text-[9px] flex items-center justify-center font-semibold"
                                    title={assignee.nickname || assignee.fullname || assignee.email}
                                  >
                                    {(assignee.nickname || assignee.fullname || assignee.email)
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                ))}
                                {task.assignees.length > 2 && (
                                  <div className="w-5 h-5 rounded-full bg-white/30 text-white text-[9px] flex items-center justify-center font-semibold">
                                    +{task.assignees.length - 2}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
