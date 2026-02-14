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

function getPriorityVariant(priority: string): "destructive" | "secondary" | "outline" {
  switch (priority.toLowerCase()) {
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "done":
      return "default";
    case "in_progress":
      return "secondary";
    case "delay":
      return "destructive";
    default:
      return "outline";
  }
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
    <div className="border rounded-lg overflow-hidden">
      <Table>
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
                  <Badge variant={getPriorityVariant(task.priority)}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(task.status)}>
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
