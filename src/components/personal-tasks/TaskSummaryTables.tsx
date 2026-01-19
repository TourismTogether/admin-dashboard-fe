import React, { useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Task {
  taskId: string;
  swimlaneId: string;
  content: string;
  status: string;
  priority: string;
  detail?: string;
  taskDate: string;
  createdAt: string;
  updatedAt: string;
}

interface Swimlane {
  swimlaneId: string;
  content: string;
  tasks?: Task[];
}

interface TaskSummaryTablesProps {
  swimlanes: Swimlane[];
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: string, content: string) => void;
}

export const TaskSummaryTables: React.FC<TaskSummaryTablesProps> = ({
  swimlanes,
  onViewTask,
  onDeleteTask,
}) => {
  // Get all tasks from all swimlanes
  const allTasks = useMemo(() => {
    return swimlanes.flatMap((swimlane) => swimlane.tasks || []);
  }, [swimlanes]);

  // Separate tasks into done and incomplete
  const doneTasks = useMemo(() => {
    return allTasks.filter((task) => task.status === "done");
  }, [allTasks]);

  const incompleteTasks = useMemo(() => {
    return allTasks.filter((task) => task.status !== "done");
  }, [allTasks]);

  // Get swimlane name by ID
  const getSwimlaneName = (swimlaneId: string): string => {
    const swimlane = swimlanes.find((s) => s.swimlaneId === swimlaneId);
    return swimlane?.content || "Unknown";
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "done":
        return "default";
      case "in_progress":
        return "secondary";
      case "reopen":
        return "outline";
      case "delay":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Done Tasks Table */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Completed Tasks ({doneTasks.length})</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Swimlane</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doneTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No completed tasks yet.
                  </TableCell>
                </TableRow>
              ) : (
                doneTasks.map((task) => (
                  <TableRow key={task.taskId}>
                    <TableCell className="font-medium max-w-[300px] truncate" title={task.content}>
                      {task.content}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getSwimlaneName(task.swimlaneId)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(task.taskDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewTask(task)}
                          className="h-8 px-2"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteTask(task.taskId, task.content)}
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Incomplete Tasks Table */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Incomplete Tasks ({incompleteTasks.length})</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Swimlane</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incompleteTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No incomplete tasks.
                  </TableCell>
                </TableRow>
              ) : (
                incompleteTasks.map((task) => (
                  <TableRow key={task.taskId}>
                    <TableCell className="font-medium max-w-[300px] truncate" title={task.content}>
                      {task.content}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getSwimlaneName(task.swimlaneId)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(task.taskDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewTask(task)}
                          className="h-8 px-2"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteTask(task.taskId, task.content)}
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
