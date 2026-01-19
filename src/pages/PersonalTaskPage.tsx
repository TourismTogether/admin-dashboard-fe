import React, { useState } from "react";
import { format, addDays, parseISO } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreateTableDialog } from "@/components/personal-tasks/CreateTableDialog";
import { CreateSwimlaneDialog } from "@/components/personal-tasks/CreateSwimlaneDialog";
import { TaskDialog } from "@/components/personal-tasks/TaskDialog";
import { TablesList } from "@/components/personal-tasks/TablesList";
import { WeekTable } from "@/components/personal-tasks/WeekTable";

const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8081";

interface TableWeek {
  tableId: string;
  userId: string;
  week: number;
  startDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface Swimlane {
  swimlaneId: string;
  tableId: string;
  content: string;
  startTime?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

interface Task {
  taskId: string;
  swimlaneId: string;
  content: string;
  status: string;
  priority: string;
  detail?: string;
  taskDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface TableWithSwimlanes extends TableWeek {
  swimlanes: Swimlane[];
}

const PersonalTaskPage: React.FC = () => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [isCreateSwimlaneOpen, setIsCreateSwimlaneOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{
    task: Task | null;
    swimlaneId: string;
    dayIndex: number;
  } | null>(null);

  const queryClient = useQueryClient();

  // Fetch all tables
  const { data: tablesData } = useQuery<{ data: TableWeek[] }>({
    queryKey: ["personal-tasks", "tables"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/personal-tasks/tables`);
      if (!response.ok) throw new Error("Failed to fetch tables");
      return response.json();
    },
  });

  // Fetch selected table with swimlanes and tasks
  const { data: tableData } = useQuery<{ data: TableWithSwimlanes }>({
    queryKey: ["personal-tasks", "table", selectedTableId],
    queryFn: async () => {
      if (!selectedTableId) return null;
      const response = await fetch(
        `${API_URL}/api/personal-tasks/tables/${selectedTableId}`
      );
      if (!response.ok) throw new Error("Failed to fetch table");
      return response.json();
    },
    enabled: !!selectedTableId,
  });

  // Create table mutation
  const createTableMutation = useMutation({
    mutationFn: async (data: { startDate: string; week: number }) => {
      const response = await fetch(`${API_URL}/api/personal-tasks/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create table");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "tables"] });
      setIsCreateTableOpen(false);
      if (data.data?.tableId) {
        setSelectedTableId(data.data.tableId);
      }
      toast.success("Table created successfully with 3 default swimlanes!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create table: ${error.message}`);
    },
  });

  // Create swimlane mutation
  const createSwimlaneMutation = useMutation({
    mutationFn: async (data: { tableId: string; content: string }) => {
      const response = await fetch(`${API_URL}/api/personal-tasks/swimlanes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create swimlane");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "table", selectedTableId],
      });
      setIsCreateSwimlaneOpen(false);
      toast.success("Swimlane created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create swimlane: ${error.message}`);
    },
  });

  // Delete swimlane mutation
  const deleteSwimlaneMutation = useMutation({
    mutationFn: async (swimlaneId: string) => {
      const response = await fetch(
        `${API_URL}/api/personal-tasks/swimlanes/${swimlaneId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete swimlane");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "table", selectedTableId],
      });
      toast.success("Swimlane deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete swimlane: ${error.message}`);
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: {
      swimlaneId: string;
      content: string;
      status?: string;
      priority?: string;
      taskDate: string;
    }) => {
      const response = await fetch(`${API_URL}/api/personal-tasks/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "table", selectedTableId],
      });
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
    }) => {
      const response = await fetch(`${API_URL}/api/personal-tasks/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "table", selectedTableId],
      });
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
      const response = await fetch(`${API_URL}/api/personal-tasks/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "table", selectedTableId],
      });
      toast.success("Task deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  const handleCreateTable = (startDate: string, week: number) => {
    createTableMutation.mutate({ startDate, week });
  };

  const handleCreateSwimlane = (content: string) => {
    if (!selectedTableId) return;
    createSwimlaneMutation.mutate({ tableId: selectedTableId, content });
  };

  const handleAddTask = (swimlaneId: string, dayIndex: number) => {
    setEditingTask({ task: null, swimlaneId, dayIndex });
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task, swimlaneId: string, dayIndex: number) => {
    setEditingTask({ task, swimlaneId, dayIndex });
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = (
    content: string,
    status: string,
    priority: string,
    taskDate: string
  ) => {
    if (!editingTask) return;

    if (editingTask.task) {
      updateTaskMutation.mutate({
        taskId: editingTask.task.taskId,
        content,
        status,
        priority,
      });
    } else {
      createTaskMutation.mutate({
        swimlaneId: editingTask.swimlaneId,
        content,
        status,
        priority,
        taskDate,
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  // Get task date for dialog
  const getTaskDate = (): string => {
    if (!editingTask || !tableData?.data) return "";
    const weekDays = Array.from({ length: 7 }, (_, i) =>
      addDays(parseISO(tableData.data.startDate), i)
    );
    return format(weekDays[editingTask.dayIndex], "yyyy-MM-dd");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Personal Tasks</h1>
        <Button onClick={() => setIsCreateTableOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Table
        </Button>
      </div>

      <CreateTableDialog
        open={isCreateTableOpen}
        onOpenChange={setIsCreateTableOpen}
        onCreate={handleCreateTable}
        isLoading={createTableMutation.isPending}
      />

      <TablesList
        tables={tablesData?.data || []}
        selectedTableId={selectedTableId}
        onSelectTable={setSelectedTableId}
      />

      {tableData?.data && (
        <>
          <WeekTable
            startDate={tableData.data.startDate}
            week={tableData.data.week}
            swimlanes={tableData.data.swimlanes}
            onAddSwimlane={() => setIsCreateSwimlaneOpen(true)}
            onDeleteSwimlane={(swimlaneId) =>
              deleteSwimlaneMutation.mutate(swimlaneId)
            }
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />

          <CreateSwimlaneDialog
            open={isCreateSwimlaneOpen}
            onOpenChange={setIsCreateSwimlaneOpen}
            onCreate={handleCreateSwimlane}
            isLoading={createSwimlaneMutation.isPending}
          />
        </>
      )}

      <TaskDialog
        task={editingTask?.task || null}
        taskDate={getTaskDate()}
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSave={handleSaveTask}
      />
    </div>
  );
};

export default PersonalTaskPage;
