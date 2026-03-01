import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { WeekTable } from "@/components/personal-tasks/tables/WeekTable";
import { CreateSwimlaneDialog } from "@/components/personal-tasks/dialogs/CreateSwimlaneDialog";
import {
  EditSwimlaneDialog,
  type SwimlaneToEdit,
} from "@/components/personal-tasks/dialogs/EditSwimlaneDialog";
import { TaskDialog } from "@/components/personal-tasks/dialogs/TaskDialog";
import { DeleteSwimlaneDialog } from "@/components/personal-tasks/dialogs/DeleteSwimlaneDialog";
import { DeleteTaskDialog } from "@/components/personal-tasks/dialogs/DeleteTaskDialog";
import { TaskDetailDialog } from "@/components/personal-tasks/dialogs/TaskDetailDialog";
import { TaskSummaryTables } from "@/components/personal-tasks/task-summary/TaskSummaryTables";
import type { SwimlaneEditPayload } from "@/components/personal-tasks/tables/WeekTable";
import type { Task } from "@/components/personal-tasks/shared/types";
import { Link2, CopyPlus, Loader2, ArrowRight, Link2Off } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface TableData {
  tableId: string;
  week: number;
  startDate: string;
  description?: string;
  followUpTableId?: string;
  swimlanes: Array<{
    swimlaneId: string;
    tableId: string;
    content: string;
    startTime?: string;
    duration?: number;
    tasks: Task[];
  }>;
}

const ShareTablePage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [forkedTableId, setForkedTableId] = useState<string | null>(null);
  const [isCreateSwimlaneOpen, setIsCreateSwimlaneOpen] = useState(false);
  const [isEditSwimlaneOpen, setIsEditSwimlaneOpen] = useState(false);
  const [swimlaneToEdit, setSwimlaneToEdit] = useState<SwimlaneToEdit | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDeleteSwimlaneOpen, setIsDeleteSwimlaneOpen] = useState(false);
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [swimlaneToDelete, setSwimlaneToDelete] = useState<{ swimlaneId: string; name: string } | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{ taskId: string; content: string } | null>(null);
  const [editingTask, setEditingTask] = useState<{
    task: Task | null;
    swimlaneId: string;
    dayIndex: number;
  } | null>(null);

  // Load shared table (or forked table when we have forkedTableId)
  const { data: shareData, isLoading: isLoadingShare, error: shareError } = useQuery({
    queryKey: ["share", "table", shareId],
    queryFn: async () => {
      const res = await apiRequest(`/api/share/table/${shareId}`);
      if (!res.ok) throw new Error(res.status === 404 ? "not_found" : "Failed to load");
      return res.json();
    },
    enabled: !!shareId && !forkedTableId,
  });

  // When we have a forked table, load it from personal-tasks API
  const { data: forkedTableData } = useQuery({
    queryKey: ["personal-tasks", "table", forkedTableId],
    queryFn: async () => {
      if (!forkedTableId) return null;
      const res = await apiRequest(`/api/personal-tasks/tables/${forkedTableId}`);
      if (!res.ok) throw new Error("Failed to load table");
      return res.json();
    },
    enabled: !!forkedTableId,
  });

  const tableData: TableData | null = forkedTableId && forkedTableData?.data
    ? {
        tableId: forkedTableData.data.tableId,
        week: forkedTableData.data.week,
        startDate: forkedTableData.data.startDate,
        description: forkedTableData.data.description,
        followUpTableId: forkedTableData.data.followUpTableId ?? undefined,
        swimlanes: forkedTableData.data.swimlanes ?? [],
      }
    : shareData?.data?.table
      ? {
          ...shareData.data.table,
          tableId: shareData.data.tableId,
          followUpTableId: (shareData.data.table as { followUpTableId?: string }).followUpTableId ?? undefined,
        }
      : null;

  const isOwner = shareData?.data?.isOwner ?? false;
  const canEdit = isOwner || !!forkedTableId;
  const effectiveTableId = tableData?.tableId ?? null;

  const forkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/share/table/${shareId}/fork`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to copy table");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setForkedTableId(data.data?.tableId);
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "tables"] });
      toast.success("Table copied to your Personal Tasks. You can edit it here or there.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createSwimlaneMutation = useMutation({
    mutationFn: async (payload: { content: string; startTime?: string; duration?: number }) => {
      const res = await apiRequest("/api/personal-tasks/swimlanes", {
        method: "POST",
        body: JSON.stringify({ tableId: effectiveTableId, ...payload }),
      });
      if (!res.ok) throw new Error("Failed to create swimlane");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "table", forkedTableId ?? undefined] });
      queryClient.invalidateQueries({ queryKey: ["share", "table", shareId] });
      setIsCreateSwimlaneOpen(false);
      toast.success("Swimlane created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSwimlaneMutation = useMutation({
    mutationFn: async ({ swimlaneId, ...payload }: { swimlaneId: string; content: string; startTime?: string; duration?: number }) => {
      const res = await apiRequest(`/api/personal-tasks/swimlanes/${swimlaneId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update swimlane");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "table", forkedTableId ?? undefined] });
      queryClient.invalidateQueries({ queryKey: ["share", "table", shareId] });
      setIsEditSwimlaneOpen(false);
      setSwimlaneToEdit(null);
      toast.success("Swimlane updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSwimlaneMutation = useMutation({
    mutationFn: async (swimlaneId: string) => {
      const res = await apiRequest(`/api/personal-tasks/swimlanes/${swimlaneId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete swimlane");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "table", forkedTableId ?? undefined] });
      queryClient.invalidateQueries({ queryKey: ["share", "table", shareId] });
      setIsDeleteSwimlaneOpen(false);
      setSwimlaneToDelete(null);
      toast.success("Swimlane deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: {
      swimlaneId: string;
      content: string;
      status?: string;
      priority?: string;
      taskDate: string;
      detail?: string | null;
      checklist?: Array<{ id: string; description: string; isComplete: boolean }> | null;
    }) => {
      const res = await apiRequest("/api/personal-tasks/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "table", forkedTableId ?? undefined] });
      queryClient.invalidateQueries({ queryKey: ["share", "table", shareId] });
      setIsTaskDialogOpen(false);
      setEditingTask(null);
      toast.success("Task created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, ...payload }: Record<string, unknown>) => {
      const res = await apiRequest(`/api/personal-tasks/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "table", forkedTableId ?? undefined] });
      queryClient.invalidateQueries({ queryKey: ["share", "table", shareId] });
      setIsTaskDialogOpen(false);
      setIsTaskDetailOpen(false);
      setEditingTask(null);
      setViewingTask(null);
      toast.success("Task updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest(`/api/personal-tasks/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "table", forkedTableId ?? undefined] });
      queryClient.invalidateQueries({ queryKey: ["share", "table", shareId] });
      setIsDeleteTaskOpen(false);
      setTaskToDelete(null);
      toast.success("Task deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleAddTask = (swimlaneId: string, dayIndex: number) => {
    if (!canEdit) return;
    setEditingTask({ task: null, swimlaneId, dayIndex });
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task, swimlaneId: string, dayIndex: number) => {
    if (!canEdit) return;
    setEditingTask({ task, swimlaneId, dayIndex });
    setIsTaskDialogOpen(true);
  };

  const getTaskDate = (): string => {
    if (!editingTask || !tableData) return "";
    const startStr = tableData.startDate;
    let start: Date;
    if (startStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = startStr.split("-").map(Number);
      start = new Date(y, m - 1, d);
    } else {
      start = parseISO(startStr);
    }
    return format(addDays(start, editingTask.dayIndex), "yyyy-MM-dd");
  };

  const handleSaveTask = (
    content: string,
    status: string,
    priority: string,
    taskDate: string,
    detail?: string,
    checklist?: Array<{ id: string; description: string; isComplete: boolean }> | null
  ) => {
    if (!editingTask) return;
    const detailVal = detail?.trim() || null;
    if (editingTask.task) {
      updateTaskMutation.mutate({
        taskId: editingTask.task.taskId,
        content,
        status,
        priority,
        detail: detailVal,
        checklist: checklist ?? null,
      });
    } else {
      createTaskMutation.mutate({
        swimlaneId: editingTask.swimlaneId,
        content,
        status,
        priority,
        taskDate,
        detail: detailVal,
        checklist: checklist ?? null,
      });
    }
  };

  const handleDeleteSwimlane = (swimlaneId: string) => {
    const sl = tableData?.swimlanes?.find((s) => s.swimlaneId === swimlaneId);
    if (sl) {
      setSwimlaneToDelete({ swimlaneId, name: sl.content });
      setIsDeleteSwimlaneOpen(true);
    }
  };

  const handleEditSwimlane = (payload: SwimlaneEditPayload) => {
    setSwimlaneToEdit({
      swimlaneId: payload.swimlaneId,
      content: payload.content,
      startTime: payload.startTime,
      duration: payload.duration,
    });
    setIsEditSwimlaneOpen(true);
  };

  const handleUpdateSwimlane = (
    swimlaneId: string,
    data: { content: string; startTime?: string; duration?: number }
  ) => {
    updateSwimlaneMutation.mutate({ swimlaneId, ...data });
  };

  const handleDeleteTask = (taskId: string, content: string) => {
    setTaskToDelete({ taskId, content });
    setIsDeleteTaskOpen(true);
  };

  const handleConfirmDeleteTask = () => {
    if (taskToDelete) deleteTaskMutation.mutate(taskToDelete.taskId);
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleSaveTaskDetail = (
    taskId: string,
    content: string,
    status: string,
    priority: string,
    detail?: string,
    checklist?: Array<{ id: string; description: string; isComplete: boolean }> | null
  ) => {
    updateTaskMutation.mutate({
      taskId,
      content,
      status,
      priority,
      detail: detail?.trim() || null,
      checklist: checklist ?? null,
    });
  };

  const handleMoveTask = (taskId: string, newTaskDate: string, newSwimlaneId?: string) => {
    updateTaskMutation.mutate({ taskId, taskDate: newTaskDate, swimlaneId: newSwimlaneId } as Record<string, unknown>);
  };

  const handleCopyTask = (task: Task) => {
    createTaskMutation.mutate({
      swimlaneId: task.swimlaneId,
      content: `${task.content} (Copy)`,
      status: task.status,
      priority: task.priority,
      taskDate: task.taskDate,
      detail: task.detail ?? null,
      checklist: task.checklist ?? null,
    });
  };

  if (!shareId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md border-muted-foreground/20 bg-card/95 shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Link2Off className="h-7 w-7 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">Invalid link</CardTitle>
            <CardDescription>
              This share link is missing or incomplete. Open your Personal Tasks to get started.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pt-2">
            <Button onClick={() => navigate("/personal-tasks")}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Open Personal Tasks
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoadingShare && !forkedTableId) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (shareError || (!shareData && !forkedTableId)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md border-muted-foreground/20 bg-card/95 shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Link2Off className="h-7 w-7 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">Link unavailable</CardTitle>
            <CardDescription>
              This table is no longer shared or the link may be incorrect. You can open your own tables below.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-center text-sm text-muted-foreground">
              The owner may have turned off sharing, or the link was copied incorrectly.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-2 pt-2">
            <Button onClick={() => navigate("/personal-tasks")}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Open Personal Tasks
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Shared Table</h1>
        <div className="flex items-center gap-2">
          {!canEdit && (
            <Button
              onClick={() => forkMutation.mutate()}
              disabled={forkMutation.isPending}
            >
              {forkMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CopyPlus className="h-4 w-4 mr-2" />
              )}
              Copy to my tables
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => navigate("/personal-tasks")}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Open in Personal Tasks
            </Button>
          )}
        </div>
      </div>

      {tableData.followUpTableId && (
        <section className="rounded-lg border bg-muted/30 p-4">
          <h2 className="text-sm font-medium flex items-center gap-2 mb-2">
            <Link2 className="h-4 w-4" />
            Follow-up relationship
          </h2>
          <p className="text-sm text-muted-foreground">
            This table is a copy of a shared table (Week {tableData.week}, starting {tableData.startDate}).
            Edits here do not change the original.
          </p>
        </section>
      )}

      <WeekTable
        startDate={tableData.startDate}
        week={tableData.week}
        swimlanes={tableData.swimlanes}
        onAddSwimlane={canEdit ? () => setIsCreateSwimlaneOpen(true) : () => {}}
        onDeleteSwimlane={canEdit ? handleDeleteSwimlane : () => {}}
        onEditSwimlane={canEdit ? handleEditSwimlane : undefined}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onMoveTask={canEdit ? handleMoveTask : undefined}
        onCopyTask={canEdit ? handleCopyTask : undefined}
      />

      <TaskSummaryTables
        swimlanes={tableData.swimlanes}
        onViewTask={handleViewTask}
        onDeleteTask={handleDeleteTask}
      />

      <CreateSwimlaneDialog
        open={isCreateSwimlaneOpen}
        onOpenChange={setIsCreateSwimlaneOpen}
        onCreate={(data) => createSwimlaneMutation.mutate(data)}
        isLoading={createSwimlaneMutation.isPending}
      />

      <EditSwimlaneDialog
        open={isEditSwimlaneOpen}
        onOpenChange={setIsEditSwimlaneOpen}
        swimlane={swimlaneToEdit}
        onUpdate={handleUpdateSwimlane}
        isLoading={updateSwimlaneMutation.isPending}
      />

      <DeleteSwimlaneDialog
        open={isDeleteSwimlaneOpen}
        onOpenChange={setIsDeleteSwimlaneOpen}
        onConfirm={() => swimlaneToDelete && deleteSwimlaneMutation.mutate(swimlaneToDelete.swimlaneId)}
        isLoading={deleteSwimlaneMutation.isPending}
        swimlaneName={swimlaneToDelete?.name}
      />

      <TaskDialog
        task={editingTask?.task ?? null}
        taskDate={getTaskDate()}
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSave={handleSaveTask}
      />

      <DeleteTaskDialog
        open={isDeleteTaskOpen}
        onOpenChange={setIsDeleteTaskOpen}
        onConfirm={handleConfirmDeleteTask}
        isLoading={deleteTaskMutation.isPending}
        taskContent={taskToDelete?.content}
      />

      <TaskDetailDialog
        task={viewingTask}
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
        onSave={handleSaveTaskDetail}
        isLoading={updateTaskMutation.isPending}
      />
    </div>
  );
};

export default ShareTablePage;
