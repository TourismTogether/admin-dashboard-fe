import React, { useMemo, useState } from "react";
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
import { Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Pagination state for completed tasks
  const [donePage, setDonePage] = useState(1);
  const donePageSize = 20;
  const doneTotalPages = Math.ceil(doneTasks.length / donePageSize);
  const doneStartIndex = (donePage - 1) * donePageSize;
  const doneEndIndex = doneStartIndex + donePageSize;
  const paginatedDoneTasks = doneTasks.slice(doneStartIndex, doneEndIndex);

  // Pagination state for incomplete tasks
  const [incompletePage, setIncompletePage] = useState(1);
  const incompletePageSize = 20;
  const incompleteTotalPages = Math.ceil(incompleteTasks.length / incompletePageSize);
  const incompleteStartIndex = (incompletePage - 1) * incompletePageSize;
  const incompleteEndIndex = incompleteStartIndex + incompletePageSize;
  const paginatedIncompleteTasks = incompleteTasks.slice(incompleteStartIndex, incompleteEndIndex);

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
                paginatedDoneTasks.map((task) => (
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
        
        {/* Pagination for Completed Tasks */}
        {doneTasks.length > donePageSize && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {doneStartIndex + 1} to {Math.min(doneEndIndex, doneTasks.length)} of {doneTasks.length} tasks
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDonePage((p) => Math.max(1, p - 1))}
                disabled={donePage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm">
                Page {donePage} of {doneTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDonePage((p) => Math.min(doneTotalPages, p + 1))}
                disabled={donePage >= doneTotalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
                paginatedIncompleteTasks.map((task) => (
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
        
        {/* Pagination for Incomplete Tasks */}
        {incompleteTasks.length > incompletePageSize && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {incompleteStartIndex + 1} to {Math.min(incompleteEndIndex, incompleteTasks.length)} of {incompleteTasks.length} tasks
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIncompletePage((p) => Math.max(1, p - 1))}
                disabled={incompletePage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm">
                Page {incompletePage} of {incompleteTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIncompletePage((p) => Math.min(incompleteTotalPages, p + 1))}
                disabled={incompletePage >= incompleteTotalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
