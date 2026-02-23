import React from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
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
import { Eye, Trash2, Pencil } from "lucide-react";

export interface GroupTaskForTable {
  groupTaskId: string;
  requirement?: string;
  priority: string;
  status: string;
  startDate?: string;
  endDate?: string;
  assignees?: { userId: string; email: string; nickname?: string | null; fullname?: string | null }[];
}

const priorityStyles: Record<string, string> = {
  high: "border-red-200 bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  medium: "border-amber-200 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  low: "border-slate-200 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
};

function getPriorityClassName(priority: string): string {
  return priorityStyles[priority.toLowerCase()] ?? "border-border bg-muted text-muted-foreground";
}

const statusStyles: Record<string, string> = {
  done: "border-emerald-200 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  in_progress: "border-blue-200 bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  todo: "border-slate-200 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600",
  reopen: "border-orange-200 bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
  delay: "border-red-200 bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
};

function getStatusClassName(status: string): string {
  return statusStyles[status.toLowerCase()] ?? "border-border bg-muted text-muted-foreground";
}

interface GroupTasksTableProps {
  tasks: GroupTaskForTable[];
  emptyMessage?: string;
  onView?: (task: GroupTaskForTable) => void;
  onEdit?: (task: GroupTaskForTable) => void;
  onDelete?: (task: GroupTaskForTable) => void;
  canEdit?: boolean;
}

export const GroupTasksTable: React.FC<GroupTasksTableProps> = ({
  tasks,
  emptyMessage = "No tasks yet.",
  onView,
  onEdit,
  onDelete,
  canEdit = true,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>Requirement</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignees</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.groupTaskId}>
                <TableCell className="font-medium max-w-[280px] truncate" title={task.requirement || ""}>
                  {task.requirement || "Untitled"}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {task.startDate
                    ? format(parseISO(task.startDate), "MMM d, yyyy")
                    : "–"}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {task.endDate
                    ? format(parseISO(task.endDate), "MMM d, yyyy")
                    : "–"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-medium", getPriorityClassName(task.priority))}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-medium", getStatusClassName(task.status))}>
                    {task.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[180px]">
                  {task.assignees?.length ? (
                    <span className="truncate block" title={task.assignees.map((a) => a.nickname || a.fullname || a.email).join(", ")}>
                      {task.assignees
                        .map((a) => a.nickname || a.fullname || a.email)
                        .join(", ")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/70">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(task)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    {canEdit && onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(task)}
                        className="h-8 px-2"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canEdit && onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(task)}
                        className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
