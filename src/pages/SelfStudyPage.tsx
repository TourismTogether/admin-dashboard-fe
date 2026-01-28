import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { PomodoroTimer } from "@/components/self-study/PomodoroTimer";
import { TaskList } from "@/components/self-study/TaskList";
import { TaskDialog } from "@/components/personal-tasks/dialogs/TaskDialog";
import { DeleteTaskDialog } from "@/components/personal-tasks/dialogs/DeleteTaskDialog";
import type { Task } from "@/components/personal-tasks/shared/types";

const SelfStudyPage: React.FC = () => {
  const navigate = useNavigate();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{
    taskId: string;
    content: string;
  } | null>(null);
  const [swimlaneId, setSwimlaneId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch all tables to get swimlanes
  const { data: tablesData } = useQuery<{ data: Array<{ tableId: string }> }>({
    queryKey: ["personal-tasks", "tables"],
    queryFn: async () => {
      const response = await apiRequest("/api/personal-tasks/tables");
      if (!response.ok) throw new Error("Failed to fetch tables");
      return response.json();
    },
  });

  // Get first table's first swimlane for creating tasks
  useEffect(() => {
    if (tablesData?.data && tablesData.data.length > 0 && !swimlaneId) {
      // Fetch first table to get swimlanes
      apiRequest(`/api/personal-tasks/tables/${tablesData.data[0].tableId}`)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.data?.swimlanes && data.data.swimlanes.length > 0) {
              setSwimlaneId(data.data.swimlanes[0].swimlaneId);
            }
          }
        })
        .catch(() => {});
    }
  }, [tablesData, swimlaneId]);

  // Fetch incomplete tasks for today
  const { data: tasksData } = useQuery<{ data: Task[] }>({
    queryKey: ["self-study", "tasks", today],
    queryFn: async () => {
      // Fetch all tables and get tasks for today
      const response = await apiRequest("/api/personal-tasks/tables");
      if (!response.ok) throw new Error("Failed to fetch tables");
      const tables = await response.json();

      // Get all tasks from all tables for today
      const allTasks: Task[] = [];
      for (const table of tables.data) {
        const tableResponse = await apiRequest(
          `/api/personal-tasks/tables/${table.tableId}`
        );
        if (tableResponse.ok) {
          const tableData = await tableResponse.json();
          if (tableData.data?.swimlanes) {
            tableData.data.swimlanes.forEach((swimlane: any) => {
              if (swimlane.tasks) {
                swimlane.tasks.forEach((task: Task) => {
                  if (task.taskDate === today && task.status !== "done") {
                    allTasks.push(task);
                  }
                });
              }
            });
          }
        }
      }

      return { data: allTasks };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: {
      swimlaneId: string;
      content: string;
      status?: string;
      priority?: string;
      taskDate: string;
      detail?: string | null;
      checklist?: Array<{ id: string; description: string; isComplete: boolean }> | null;
    }) => {
      const response = await apiRequest("/api/personal-tasks/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["self-study", "tasks", today] });
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "tables"] });
      setIsTaskDialogOpen(false);
      setEditingTask(null);
      toast.success("Task created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      ...data
    }: {
      taskId: string;
      content?: string;
      status?: string;
      priority?: string;
      detail?: string | null;
      checklist?: Array<{ id: string; description: string; isComplete: boolean }> | null;
      taskDate?: string;
    }) => {
      const response = await apiRequest(`/api/personal-tasks/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["self-study", "tasks", today] });
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "tables"] });
      setIsTaskDialogOpen(false);
      setEditingTask(null);
      toast.success("Task updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest(`/api/personal-tasks/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["self-study", "tasks", today] });
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "tables"] });
      setIsDeleteTaskOpen(false);
      setTaskToDelete(null);
      toast.success("Task deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  const handleAddTask = () => {
    if (!swimlaneId) {
      toast.error("Please create a table first in Personal Tasks");
      return;
    }
    setEditingTask(null);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = (
    content: string,
    status: string,
    priority: string,
    taskDate: string,
    detail?: string,
    checklist?: Array<{ id: string; description: string; isComplete: boolean }> | null
  ) => {
    if (!swimlaneId) {
      toast.error("Swimlane not available");
      return;
    }

    const detailValue = detail && detail.trim() ? detail.trim() : null;
    const checklistValue = checklist !== undefined ? checklist : null;

    if (editingTask) {
      updateTaskMutation.mutate({
        taskId: editingTask.taskId,
        content,
        status,
        priority,
        detail: detailValue,
        checklist: checklistValue,
      });
    } else {
      const createData: {
        swimlaneId: string;
        content: string;
        status: string;
        priority: string;
        taskDate: string;
        detail: string | null;
        checklist?: Array<{ id: string; description: string; isComplete: boolean }> | null;
      } = {
        swimlaneId,
        content,
        status,
        priority,
        taskDate,
        detail: detailValue,
        checklist: checklistValue,
      };
      createTaskMutation.mutate(createData);
    }
  };

  const handleDeleteTask = (taskId: string, taskContent: string) => {
    setTaskToDelete({
      taskId,
      content: taskContent,
    });
    setIsDeleteTaskOpen(true);
  };

  const handleConfirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.taskId);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold">Self Study</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/personal-tasks")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back To Personal Task
          </Button>
          <Button onClick={handleAddTask} disabled={!swimlaneId}>
            Add Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pomodoro Timer */}
        <Card>
          <CardHeader>
            <CardTitle>Pomodoro Timer</CardTitle>
          </CardHeader>
          <CardContent>
            <PomodoroTimer />
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={tasksData?.data || []}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          </CardContent>
        </Card>
      </div>

      <TaskDialog
        task={editingTask}
        taskDate={today}
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
    </div>
  );
};

export default SelfStudyPage;
