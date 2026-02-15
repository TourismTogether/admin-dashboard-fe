import React, { useState, useMemo } from "react";
import { format, addDays, parseISO } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, RefreshCw, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { CreateTableDialog } from "@/components/personal-tasks/dialogs/CreateTableDialog";
import { EditTableDialog } from "@/components/personal-tasks/dialogs/EditTableDialog";
import { CreateSwimlaneDialog } from "@/components/personal-tasks/dialogs/CreateSwimlaneDialog";
import {
  EditSwimlaneDialog,
  type SwimlaneToEdit,
} from "@/components/personal-tasks/dialogs/EditSwimlaneDialog";
import { TaskDialog } from "@/components/personal-tasks/dialogs/TaskDialog";
import { TablesList } from "@/components/personal-tasks/tables/TablesList";
import {
  WeekTable,
  type SwimlaneEditPayload,
} from "@/components/personal-tasks/tables/WeekTable";
import { DeleteTableDialog } from "@/components/personal-tasks/dialogs/DeleteTableDialog";
import { DeleteSwimlaneDialog } from "@/components/personal-tasks/dialogs/DeleteSwimlaneDialog";
import { DeleteTaskDialog } from "@/components/personal-tasks/dialogs/DeleteTaskDialog";
import { TaskSummaryTables } from "@/components/personal-tasks/task-summary/TaskSummaryTables";
import { TaskDetailDialog } from "@/components/personal-tasks/dialogs/TaskDetailDialog";
import { PerformanceStats } from "@/components/personal-tasks/performance-stats/PerformanceStats";

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
  taskDate: string; // Required, not optional
  createdAt: string;
  updatedAt: string;
}

interface TableWithSwimlanes extends TableWeek {
  swimlanes: Swimlane[];
}

const PersonalTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableWeek | null>(null);
  const [isCreateSwimlaneOpen, setIsCreateSwimlaneOpen] = useState(false);
  const [isEditSwimlaneOpen, setIsEditSwimlaneOpen] = useState(false);
  const [swimlaneToEdit, setSwimlaneToEdit] = useState<SwimlaneToEdit | null>(
    null
  );
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDeleteTableOpen, setIsDeleteTableOpen] = useState(false);
  const [isDeleteSwimlaneOpen, setIsDeleteSwimlaneOpen] = useState(false);
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [tableToDelete, setTableToDelete] = useState<{
    tableId: string;
    week: number;
    startDate: string;
  } | null>(null);
  const [swimlaneToDelete, setSwimlaneToDelete] = useState<{
    swimlaneId: string;
    name: string;
  } | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{
    taskId: string;
    content: string;
  } | null>(null);
  const [editingTask, setEditingTask] = useState<{
    task: Task | null;
    swimlaneId: string;
    dayIndex: number;
  } | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [weekFilter, setWeekFilter] = useState<number | null>(null);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const queryClient = useQueryClient();

  // Email feature temporarily disabled (incomplete / has bugs)
  // const { data: emailSettings } = useQuery({ queryKey: ["settings", "personal-tasks-email"], ... });

  // Fetch all tables
  const {
    data: tablesData,
    isLoading: isLoadingTables,
    refetch: refetchTables,
  } = useQuery<{ data: TableWeek[] }>({
    queryKey: ["personal-tasks", "tables"],
    queryFn: async () => {
      const response = await apiRequest("/api/personal-tasks/tables");
      if (!response.ok) throw new Error("Failed to fetch tables");
      return response.json();
    },
  });

  // Filter and search tables
  const filteredTables = useMemo(() => {
    if (!tablesData?.data) return [];

    let filtered = tablesData.data;

    // Search filter (by description or week)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (table) =>
          table.description?.toLowerCase().includes(query) ||
          table.week.toString().includes(query) ||
          format(parseISO(table.startDate), "MMM d, yyyy")
            .toLowerCase()
            .includes(query)
      );
    }

    // Week filter
    if (weekFilter !== null) {
      filtered = filtered.filter((table) => table.week === weekFilter);
    }

    // Date range filter
    if (startDateFilter) {
      filtered = filtered.filter((table) => table.startDate >= startDateFilter);
    }

    if (endDateFilter) {
      filtered = filtered.filter((table) => table.startDate <= endDateFilter);
    }

    return filtered;
  }, [
    tablesData?.data,
    searchQuery,
    weekFilter,
    startDateFilter,
    endDateFilter,
  ]);

  // Get unique weeks for filter
  const availableWeeks = useMemo(() => {
    if (!tablesData?.data) return [];
    const weeks = new Set(tablesData.data.map((t) => t.week));
    return Array.from(weeks).sort((a, b) => b - a);
  }, [tablesData?.data]);

  const handleRefresh = () => {
    refetchTables();
    toast.success("Tables refreshed");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setWeekFilter(null);
    setStartDateFilter("");
    setEndDateFilter("");
  };

  // Email feature temporarily disabled (incomplete / has bugs)
  // const sendEmailMutation = useMutation({ ... });
  // const handleSendEmail = () => { ... };

  // Fetch selected table with swimlanes and tasks
  const { data: tableData } = useQuery<{ data: TableWithSwimlanes }>({
    queryKey: ["personal-tasks", "table", selectedTableId],
    queryFn: async () => {
      if (!selectedTableId) return null;
      const response = await apiRequest(
        `/api/personal-tasks/tables/${selectedTableId}`
      );
      if (!response.ok) throw new Error("Failed to fetch table");
      return response.json();
    },
    enabled: !!selectedTableId,
  });

  // Create table mutation
  const createTableMutation = useMutation({
    mutationFn: async (data: {
      startDate: string;
      week: number;
      description?: string;
    }) => {
      const response = await apiRequest("/api/personal-tasks/tables", {
        method: "POST",
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

  // Update table mutation
  const updateTableMutation = useMutation({
    mutationFn: async ({
      tableId,
      ...data
    }: {
      tableId: string;
      startDate: string;
      week: number;
      description?: string;
    }) => {
      const response = await apiRequest(
        `/api/personal-tasks/tables/${tableId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error("Failed to update table");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "tables"] });
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "table", selectedTableId],
      });
      setIsEditTableOpen(false);
      setEditingTable(null);
      toast.success("Table updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update table: ${error.message}`);
    },
  });

  // Create swimlane mutation
  const createSwimlaneMutation = useMutation({
    mutationFn: async (data: {
      tableId: string;
      content: string;
      startTime?: string;
      duration?: number;
    }) => {
      const response = await apiRequest("/api/personal-tasks/swimlanes", {
        method: "POST",
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

  // Delete table mutation
  const deleteTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const response = await apiRequest(
        `/api/personal-tasks/tables/${tableId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete table");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-tasks", "tables"] });
      if (selectedTableId) {
        setSelectedTableId(null);
      }
      toast.success("Table deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete table: ${error.message}`);
    },
  });

  // Update swimlane mutation
  const updateSwimlaneMutation = useMutation({
    mutationFn: async ({
      swimlaneId,
      content,
      startTime,
      duration,
    }: {
      swimlaneId: string;
      content: string;
      startTime?: string;
      duration?: number;
    }) => {
      const response = await apiRequest(
        `/api/personal-tasks/swimlanes/${swimlaneId}`,
        {
          method: "PUT",
          body: JSON.stringify({ content, startTime, duration }),
        }
      );
      if (!response.ok) throw new Error("Failed to update swimlane");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "table", selectedTableId],
      });
      setIsEditSwimlaneOpen(false);
      setSwimlaneToEdit(null);
      toast.success("Swimlane updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update swimlane: ${error.message}`);
    },
  });

  // Delete swimlane mutation
  const deleteSwimlaneMutation = useMutation({
    mutationFn: async (swimlaneId: string) => {
      const response = await apiRequest(
        `/api/personal-tasks/swimlanes/${swimlaneId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete swimlane");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "table", selectedTableId],
      });
      setIsDeleteSwimlaneOpen(false);
      setSwimlaneToDelete(null);
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
      detail?: string | null;
      checklist?: Array<{
        id: string;
        description: string;
        isComplete: boolean;
      }> | null;
    }) => {
      const response = await apiRequest("/api/personal-tasks/tasks", {
        method: "POST",
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
      detail?: string | null;
      checklist?: Array<{
        id: string;
        description: string;
        isComplete: boolean;
      }> | null;
      taskDate?: string;
      swimlaneId?: string;
    }) => {
      const response = await apiRequest(`/api/personal-tasks/tasks/${taskId}`, {
        method: "PUT",
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
      setIsTaskDetailOpen(false);
      setEditingTask(null);
      setViewingTask(null);
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
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "table", selectedTableId],
      });
      setIsDeleteTaskOpen(false);
      setTaskToDelete(null);
      toast.success("Task deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  // Copy task mutation (creates a new task with same data)
  const copyTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const response = await apiRequest("/api/personal-tasks/tasks", {
        method: "POST",
        body: JSON.stringify({
          swimlaneId: task.swimlaneId,
          content: `${task.content} (Copy)`,
          status: task.status,
          priority: task.priority,
          taskDate: task.taskDate,
          detail: task.detail,
        }),
      });
      if (!response.ok) throw new Error("Failed to copy task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "table", selectedTableId],
      });
      toast.success("Task copied successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to copy task: ${error.message}`);
    },
  });

  const handleCreateTable = (
    startDate: string,
    week: number,
    description?: string
  ) => {
    createTableMutation.mutate({ startDate, week, description });
  };

  const handleEditTable = (table: TableWeek) => {
    setEditingTable(table);
    setIsEditTableOpen(true);
  };

  const handleUpdateTable = (
    tableId: string,
    startDate: string,
    week: number,
    description?: string
  ) => {
    updateTableMutation.mutate({ tableId, startDate, week, description });
  };

  const handleCopyTask = (task: Task) => {
    copyTaskMutation.mutate(task);
  };

  const handleCreateSwimlane = (data: {
    content: string;
    startTime?: string;
    duration?: number;
  }) => {
    if (!selectedTableId) return;
    createSwimlaneMutation.mutate({
      tableId: selectedTableId,
      content: data.content,
      startTime: data.startTime,
      duration: data.duration,
    });
  };

  const handleDeleteTable = (tableId: string) => {
    const table = tablesData?.data?.find((t) => t.tableId === tableId);
    if (table) {
      setTableToDelete({
        tableId,
        week: table.week,
        startDate: table.startDate,
      });
      setIsDeleteTableOpen(true);
    }
  };

  const handleConfirmDeleteTable = () => {
    if (tableToDelete) {
      deleteTableMutation.mutate(tableToDelete.tableId);
      setIsDeleteTableOpen(false);
      setTableToDelete(null);
    }
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
    taskDate: string,
    detail?: string,
    checklist?: Array<{
      id: string;
      description: string;
      isComplete: boolean;
    }> | null
  ) => {
    if (!editingTask) return;

    const detailValue = detail && detail.trim() ? detail.trim() : null;
    const checklistValue = checklist !== undefined ? checklist : null;

    if (editingTask.task) {
      const updateData: {
        taskId: string;
        content: string;
        status: string;
        priority: string;
        detail: string | null;
        checklist?: Array<{
          id: string;
          description: string;
          isComplete: boolean;
        }> | null;
      } = {
        taskId: editingTask.task.taskId,
        content,
        status,
        priority,
        detail: detailValue,
        checklist: checklistValue,
      };
      updateTaskMutation.mutate(updateData);
    } else {
      const createData: {
        swimlaneId: string;
        content: string;
        status: string;
        priority: string;
        taskDate: string;
        detail: string | null;
        checklist?: Array<{
          id: string;
          description: string;
          isComplete: boolean;
        }> | null;
      } = {
        swimlaneId: editingTask.swimlaneId,
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

  const handleDeleteSwimlane = (swimlaneId: string) => {
    const swimlane = tableData?.data?.swimlanes?.find(
      (s) => s.swimlaneId === swimlaneId
    );
    if (swimlane) {
      setSwimlaneToDelete({
        swimlaneId,
        name: swimlane.content,
      });
      setIsDeleteSwimlaneOpen(true);
    }
  };

  const handleConfirmDeleteSwimlane = () => {
    if (swimlaneToDelete) {
      deleteSwimlaneMutation.mutate(swimlaneToDelete.swimlaneId);
    }
  };

  const handleEditSwimlane = (swimlane: SwimlaneEditPayload) => {
    setSwimlaneToEdit({
      swimlaneId: swimlane.swimlaneId,
      content: swimlane.content,
      startTime: swimlane.startTime,
      duration: swimlane.duration,
    });
    setIsEditSwimlaneOpen(true);
  };

  const handleUpdateSwimlane = (
    swimlaneId: string,
    data: { content: string; startTime?: string; duration?: number }
  ) => {
    updateSwimlaneMutation.mutate({ swimlaneId, ...data });
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
    checklist?: Array<{
      id: string;
      description: string;
      isComplete: boolean;
    }> | null
  ) => {
    const detailValue = detail && detail.trim() ? detail.trim() : null;
    const checklistValue = checklist !== undefined ? checklist : null;
    const updateData: {
      taskId: string;
      content: string;
      status: string;
      priority: string;
      detail: string | null;
      checklist?: Array<{
        id: string;
        description: string;
        isComplete: boolean;
      }> | null;
    } = {
      taskId,
      content,
      status,
      priority,
      detail: detailValue,
      checklist: checklistValue,
    };
    updateTaskMutation.mutate(updateData);
  };

  const handleMoveTask = (
    taskId: string,
    newTaskDate: string,
    newSwimlaneId?: string
  ) => {
    updateTaskMutation.mutate({
      taskId,
      taskDate: newTaskDate,
      swimlaneId: newSwimlaneId,
    });
  };

  // Get task date for dialog
  const getTaskDate = (): string => {
    if (!editingTask || !tableData?.data) return "";
    // Parse startDate as a date string (YYYY-MM-DD) without timezone issues
    const startDateStr = tableData.data.startDate;
    // If startDate is already in YYYY-MM-DD format, use it directly
    // Otherwise parse it and format it
    let startDate: Date;
    if (startDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // It's already in YYYY-MM-DD format, create date in local timezone
      const [year, month, day] = startDateStr.split("-").map(Number);
      startDate = new Date(year, month - 1, day);
    } else {
      // Parse ISO string and use local date
      const parsed = parseISO(startDateStr);
      startDate = new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );
    }
    // Add days to get the target date
    const targetDate = addDays(startDate, editingTask.dayIndex);
    return format(targetDate, "yyyy-MM-dd");
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Personal Tasks</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoadingTables}
            className="shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoadingTables ? "animate-spin" : ""}`}
            />
          </Button>
          {/* Email feature temporarily disabled (incomplete / has bugs) */}
          {/* <Button variant="outline" onClick={handleSendEmail} ... >Send Email</Button> */}
          <Button variant="outline" onClick={() => navigate("/self-study")}>
            <BookOpen className="h-4 w-4 mr-2" />
            Self Study
          </Button>
          <Button onClick={() => setIsCreateTableOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Table
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="🔍 Search by description, week, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={weekFilter === null ? "" : weekFilter}
              onChange={(e) =>
                setWeekFilter(e.target.value ? Number(e.target.value) : null)
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Weeks</option>
              {availableWeeks.map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              From:
            </span>
            <Input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full sm:w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              To:
            </span>
            <Input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full sm:w-auto"
            />
          </div>
          {(searchQuery ||
            weekFilter !== null ||
            startDateFilter ||
            endDateFilter) && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <CreateTableDialog
        open={isCreateTableOpen}
        onOpenChange={setIsCreateTableOpen}
        onCreate={handleCreateTable}
        isLoading={createTableMutation.isPending}
      />

      <EditTableDialog
        open={isEditTableOpen}
        onOpenChange={setIsEditTableOpen}
        onUpdate={handleUpdateTable}
        table={editingTable}
        isLoading={updateTableMutation.isPending}
      />

      <TablesList
        tables={filteredTables}
        selectedTableId={selectedTableId}
        onSelectTable={setSelectedTableId}
        onDeleteTable={handleDeleteTable}
        onEditTable={handleEditTable}
      />

      {tableData?.data && (
        <>
          <WeekTable
            startDate={tableData.data.startDate}
            week={tableData.data.week}
            swimlanes={tableData.data.swimlanes}
            onAddSwimlane={() => setIsCreateSwimlaneOpen(true)}
            onDeleteSwimlane={handleDeleteSwimlane}
            onEditSwimlane={handleEditSwimlane}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onMoveTask={handleMoveTask}
            onCopyTask={handleCopyTask}
          />

          <CreateSwimlaneDialog
            open={isCreateSwimlaneOpen}
            onOpenChange={setIsCreateSwimlaneOpen}
            onCreate={handleCreateSwimlane}
            isLoading={createSwimlaneMutation.isPending}
          />

          <TaskSummaryTables
            swimlanes={tableData.data.swimlanes}
            onViewTask={handleViewTask}
            onDeleteTask={handleDeleteTask}
          />

          <PerformanceStats
            swimlanes={tableData.data.swimlanes}
            startDate={tableData.data.startDate}
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

      <DeleteTableDialog
        open={isDeleteTableOpen}
        onOpenChange={setIsDeleteTableOpen}
        onConfirm={handleConfirmDeleteTable}
        isLoading={deleteTableMutation.isPending}
        tableInfo={
          tableToDelete
            ? {
                week: tableToDelete.week,
                startDate: tableToDelete.startDate,
              }
            : undefined
        }
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
        onConfirm={handleConfirmDeleteSwimlane}
        isLoading={deleteSwimlaneMutation.isPending}
        swimlaneName={swimlaneToDelete?.name}
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

export default PersonalTaskPage;
