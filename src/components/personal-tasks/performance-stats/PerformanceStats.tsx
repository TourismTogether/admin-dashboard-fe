import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { format, parseISO, startOfWeek, eachDayOfInterval } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Swimlane } from "../shared/types";

interface PerformanceStatsProps {
  swimlanes: Swimlane[];
  startDate: string;
}

const COLORS = {
  done: "#22c55e", // green
  in_progress: "#3b82f6", // blue
  todo: "#94a3b8", // gray
  reopen: "#f59e0b", // amber
  delay: "#ef4444", // red
  high: "#ef4444", // red
  medium: "#f59e0b", // amber
  low: "#22c55e", // green
};

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({
  swimlanes,
  startDate,
}) => {
  // Get all tasks
  const allTasks = useMemo(() => {
    return swimlanes.flatMap((swimlane) => swimlane.tasks || []);
  }, [swimlanes]);

  // Tasks by status
  const tasksByStatus = useMemo(() => {
    const statusCount: Record<string, number> = {
      done: 0,
      in_progress: 0,
      todo: 0,
      reopen: 0,
      delay: 0,
    };

    allTasks.forEach((task) => {
      const status = task.status.toLowerCase();
      if (statusCount.hasOwnProperty(status)) {
        statusCount[status]++;
      } else {
        statusCount[status] = 1;
      }
    });

    return Object.entries(statusCount)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "),
        value,
        color: COLORS[name as keyof typeof COLORS] || "#94a3b8",
      }));
  }, [allTasks]);

  // Tasks by priority
  const tasksByPriority = useMemo(() => {
    const priorityCount: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0,
    };

    allTasks.forEach((task) => {
      const priority = task.priority.toLowerCase();
      if (priorityCount.hasOwnProperty(priority)) {
        priorityCount[priority]++;
      }
    });

    return Object.entries(priorityCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name as keyof typeof COLORS] || "#94a3b8",
    }));
  }, [allTasks]);

  // Tasks completion over time (last 7 days)
  const tasksOverTime = useMemo(() => {
    const weekStart = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });
    const days = eachDayOfInterval({
      start: weekStart,
      end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    });

    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const tasksOnDay = allTasks.filter((task) => {
        try {
          const taskDate = format(parseISO(task.taskDate), "yyyy-MM-dd");
          return taskDate === dayStr;
        } catch {
          return false;
        }
      });

      const doneOnDay = tasksOnDay.filter((t) => t.status === "done").length;
      const totalOnDay = tasksOnDay.length;

      return {
        date: format(day, "MMM d"),
        fullDate: format(day, "yyyy-MM-dd"),
        completed: doneOnDay,
        total: totalOnDay,
        completionRate: totalOnDay > 0 ? Math.round((doneOnDay / totalOnDay) * 100) : 0,
      };
    });
  }, [allTasks, startDate]);

  // Performance metrics
  const metrics = useMemo(() => {
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "done").length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Average tasks per day
    const uniqueDays = new Set(
      allTasks.map((t) => {
        try {
          return format(parseISO(t.taskDate), "yyyy-MM-dd");
        } catch {
          return "";
        }
      }).filter(Boolean)
    );
    const avgTasksPerDay = uniqueDays.size > 0 
      ? Math.round((totalTasks / uniqueDays.size) * 10) / 10 
      : 0;

    // High priority tasks completion rate
    const highPriorityTasks = allTasks.filter((t) => t.priority.toLowerCase() === "high");
    const highPriorityCompleted = highPriorityTasks.filter((t) => t.status === "done").length;
    const highPriorityRate = highPriorityTasks.length > 0
      ? Math.round((highPriorityCompleted / highPriorityTasks.length) * 100)
      : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      avgTasksPerDay,
      highPriorityRate,
      pendingTasks: totalTasks - completedTasks,
    };
  }, [allTasks]);

  if (allTasks.length === 0) {
    return (
      <div className="space-y-2 mt-8">
        <h3 className="text-lg font-semibold">Performance Statistics</h3>
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          No tasks available for statistics.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-8">
      <h3 className="text-lg font-semibold">Performance Statistics</h3>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.completedTasks} of {metrics.totalTasks} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Tasks/Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avgTasksPerDay}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasks per day this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Priority Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.highPriorityRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              High priority completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks by Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tasksByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by Priority Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tasksByPriority}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    color: "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {tasksByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Rate Over Time Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Completion Rate Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tasksOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    color: "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  labelStyle={{ color: "#1f2937", fontWeight: 600 }}
                  formatter={(value: number | undefined) => [`${value ?? 0}%`, "Completion Rate"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completionRate"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4 }}
                  name="Completion Rate (%)"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: "#22c55e", r: 4 }}
                  name="Completed Tasks"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={{ fill: "#94a3b8", r: 4 }}
                  name="Total Tasks"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
