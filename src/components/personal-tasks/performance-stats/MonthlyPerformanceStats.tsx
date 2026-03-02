import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Swimlane } from "../shared/types";

interface MonthlyPerformanceStatsProps {
  swimlanes: Swimlane[];
  monthDate: Date;
}

export const MonthlyPerformanceStats: React.FC<
  MonthlyPerformanceStatsProps
> = ({ swimlanes, monthDate }) => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const allTasksInMonth = useMemo(() => {
    const allTasks = swimlanes.flatMap((s) => s.tasks || []);
    return allTasks.filter((task) => {
      try {
        const d = parseISO(task.taskDate);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    });
  }, [swimlanes, monthStart, monthEnd]);

  const metrics = useMemo(() => {
    const totalTasks = allTasksInMonth.length;
    const completedTasks = allTasksInMonth.filter(
      (t) => t.status === "done",
    ).length;
    const completionRate =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      pendingTasks: totalTasks - completedTasks,
    };
  }, [allTasksInMonth]);

  const tasksPerDay = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const tasksOnDay = allTasksInMonth.filter((task) => {
        try {
          const d = format(parseISO(task.taskDate), "yyyy-MM-dd");
          return d === key;
        } catch {
          return false;
        }
      });

      const doneOnDay = tasksOnDay.filter((t) => t.status === "done").length;

      return {
        date: format(day, "d"),
        fullDate: key,
        total: tasksOnDay.length,
        completed: doneOnDay,
      };
    });
  }, [allTasksInMonth, monthStart, monthEnd]);

  if (allTasksInMonth.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-4">
      <h3 className="text-lg font-semibold">
        Performance Statistics (This Month)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.completedTasks} / {metrics.totalTasks} tasks in month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.completedTasks}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending: {metrics.pendingTasks}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In this calendar month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks per Day (Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tasksPerDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value, name) => [
                  (value ?? 0) as number,
                  name === "completed" ? "Completed" : "Total",
                ]}
              />
              <Bar dataKey="total" stackId="a" fill="#94a3b8" />
              <Bar dataKey="completed" stackId="a" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

