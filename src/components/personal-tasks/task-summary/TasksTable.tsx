import React from "react";
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
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2 } from "lucide-react";
import type { Task, Swimlane } from "../shared/types";
import { getPriorityBadgeVariant, getStatusBadgeVariant } from "../shared/utils";

interface TasksTableProps {
  tasks: Task[];
  swimlanes: Swimlane[];
  emptyMessage: string;
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: string, content: string) => void;
}

const getSwimlaneName = (swimlaneId: string, swimlanes: Swimlane[]): string => {
  const swimlane = swimlanes.find((s) => s.swimlaneId === swimlaneId);
  return swimlane?.content || "Unknown";
};

export const TasksTable: React.FC<TasksTableProps> = ({
  tasks,
  swimlanes,
  emptyMessage,
  onViewTask,
  onDeleteTask,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border">
      <Table className="min-w-[640px]">
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
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.taskId}>
                <TableCell className="font-medium max-w-[300px] truncate" title={task.content}>
                  {task.content}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getSwimlaneName(task.swimlaneId, swimlanes)}
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
  );
};
