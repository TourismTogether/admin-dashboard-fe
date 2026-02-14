import React, { useEffect, useMemo, useState } from "react";
import { format, parseISO, startOfWeek } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, X, Edit2, Filter, RefreshCw, UserMinus, LogOut, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GroupTaskTimelineView } from "@/components/group-tasks/GroupTaskTimelineView";
import { GroupTaskWeekTable } from "@/components/group-tasks/GroupTaskWeekTable";
import { GroupTasksTable } from "@/components/group-tasks/GroupTasksTable";
import { GroupsList } from "@/components/group-tasks/GroupsList";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthUser } from "@/store/authSlice";

interface GroupTask {
  groupTaskId: string;
  groupId: string;
  priority: string;
  status: string;
  startDate?: string;
  endDate?: string;
  requirement?: string;
  delivery?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  assignees?: GroupMember[];
}

interface GroupWithRole {
  groupId: string;
  name: string;
  role: string;
  description?: string;
}

interface GroupMember {
  userId: string;
  email: string;
  nickname?: string | null;
  fullname?: string | null;
  role?: string;
}

const GroupTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskRequirement, setTaskRequirement] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskStatus, setTaskStatus] = useState("todo");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editTaskRequirement, setEditTaskRequirement] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState("medium");
  const [editTaskStatus, setEditTaskStatus] = useState("todo");
  const [editTaskStartDate, setEditTaskStartDate] = useState("");
  const [editTaskEndDate, setEditTaskEndDate] = useState("");
  const [editSelectedAssignees, setEditSelectedAssignees] = useState<string[]>([]);
  const [editAssigneeSearchQuery, setEditAssigneeSearchQuery] = useState("");
  const [isEditAssigneePopoverOpen, setIsEditAssigneePopoverOpen] = useState(false);
  const [isDeleteTaskDialogOpen, setIsDeleteTaskDialogOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [viewTaskId, setViewTaskId] = useState<string | null>(null);
  const [isViewTaskOpen, setIsViewTaskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "tasks" | "timeline">("schedule");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);
  const [kickMemberId, setKickMemberId] = useState<string | null>(null);
  const [isLeaveGroupDialogOpen, setIsLeaveGroupDialogOpen] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [taskSortBy, setTaskSortBy] = useState<string>("start_desc");
  const [taskPage, setTaskPage] = useState(0);

  const currentUser = useSelector(selectAuthUser);

  const PAGE_SIZE = 20;

  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const toDateOnly = (value: string | undefined | null): string => {
    if (!value || typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.includes("T")) return trimmed.split("T")[0];
    return trimmed;
  };

  useEffect(() => {
    if (groupId) {
      setSelectedGroupId(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    setSelectedAssignees([]);
  }, [selectedGroupId]);

  const queryClient = useQueryClient();

  // Fetch user's groups
  const { data: groupsData, isLoading: isLoadingGroups } = useQuery<
    { data: GroupWithRole[] }
  >({
    queryKey: ["groups", "user"],
    queryFn: async () => {
      const response = await apiRequest("/api/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      return response.json();
    },
  });

  // Fetch group tasks for selected group
  const { data: tasksData, isLoading: isLoadingTasks, isError: isTasksError, error: tasksError } = useQuery<
    { data: GroupTask[] }
  >({
    queryKey: ["group-tasks", selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return { data: [] };
      const response = await apiRequest(`/api/group-tasks?groupId=${selectedGroupId}`);
      if (response.status === 403) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "You are not a member of this group");
      }
      if (!response.ok) throw new Error("Failed to fetch group tasks");
      const result = await response.json();
      return result;
    },
    enabled: !!selectedGroupId,
    retry: false,
  });

  // Fetch members for selected group
  const { data: membersData, isLoading: isLoadingMembers } = useQuery<{ data: GroupMember[] }>(
    {
      queryKey: ["group-members", selectedGroupId],
      queryFn: async () => {
        if (!selectedGroupId) return { data: [] };
        const response = await apiRequest(`/api/groups/${selectedGroupId}/members`);
        if (!response.ok) throw new Error("Failed to fetch members");
        return response.json();
      },
      enabled: !!selectedGroupId,
    }
  );

  // Redirect if URL has a groupId the user is not a member of
  useEffect(() => {
    if (isLoadingGroups || !groupsData?.data || !selectedGroupId) return;
    const isMember = groupsData.data.some((g) => g.groupId === selectedGroupId);
    if (!isMember) {
      setSelectedGroupId(null);
      navigate("/group-tasks", { replace: true });
      toast.error("You are not a member of this group");
    }
  }, [isLoadingGroups, groupsData?.data, selectedGroupId, navigate]);

  // Redirect when tasks API returns 403 (e.g. user was removed from group)
  useEffect(() => {
    if (!isTasksError || !tasksError || !selectedGroupId) return;
    const msg = tasksError.message || "";
    if (msg.includes("not a member") || msg.includes("403")) {
      setSelectedGroupId(null);
      navigate("/group-tasks", { replace: true });
      toast.error("You are not a member of this group");
    }
  }, [isTasksError, tasksError, selectedGroupId, navigate]);

  // Create group mutation
  const createGroup = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiRequest("/api/groups", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create group");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Group created successfully");
      queryClient.invalidateQueries({ queryKey: ["groups", "user"] });
      setIsCreateGroupOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create group");
    },
  });

  const createTask = useMutation({
    mutationFn: async (data: {
      groupId: string;
      requirement: string;
      priority?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      assigneeIds?: string[];
    }) => {
      const response = await apiRequest("/api/group-tasks", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Task created successfully");
      queryClient.invalidateQueries({ queryKey: ["group-tasks", selectedGroupId] });
      setIsCreateTaskOpen(false);
      setTaskRequirement("");
      setTaskPriority("medium");
      setTaskStatus("todo");
      setTaskStartDate("");
      setTaskEndDate("");
      setSelectedAssignees([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create task");
    },
  });

  const addMember = useMutation({
    mutationFn: async (data: { groupId: string; email: string; role?: string }) => {
      const response = await apiRequest(`/api/groups/${data.groupId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: data.email, role: data.role }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add member");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Member added successfully");
      setIsAddMemberOpen(false);
      setNewMemberEmail("");
      setNewMemberRole("member");
      if (selectedGroupId) {
        queryClient.invalidateQueries({ queryKey: ["group-members", selectedGroupId] });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add member");
    },
  });

  const kickMember = useMutation({
    mutationFn: async (data: { groupId: string; userId: string }) => {
      const response = await apiRequest(
        `/api/groups/${data.groupId}/members/${data.userId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to remove member");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Member removed from group");
      queryClient.invalidateQueries({ queryKey: ["group-members", selectedGroupId] });
      setKickMemberId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove member");
    },
  });

  const leaveGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await apiRequest(`/api/groups/${groupId}/leave`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to leave group");
      }
      return response.json();
    },
    onSuccess: (_, groupId) => {
      toast.success("You left the group");
      queryClient.invalidateQueries({ queryKey: ["groups", "user"] });
      setIsLeaveGroupDialogOpen(false);
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
        navigate("/group-tasks");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to leave group");
    },
  });

  const updateGroup = useMutation({
    mutationFn: async (data: { groupId: string; name?: string; description?: string }) => {
      const response = await apiRequest(`/api/groups/${data.groupId}`, {
        method: "PUT",
        body: JSON.stringify({ name: data.name, description: data.description }),
      });
      if (!response.ok) throw new Error("Failed to update group");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Group updated successfully");
      queryClient.invalidateQueries({ queryKey: ["groups", "user"] });
      setIsEditGroupOpen(false);
      setEditingGroupId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update group");
    },
  });

  const updateTask = useMutation({
    mutationFn: async (data: {
      groupTaskId: string;
      requirement?: string;
      priority?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      assigneeIds?: string[];
    }) => {
      const response = await apiRequest(`/api/group-tasks/${data.groupTaskId}`, {
        method: "PUT",
        body: JSON.stringify({
          requirement: data.requirement,
          priority: data.priority,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          assigneeIds: data.assigneeIds,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Task updated successfully");
      queryClient.invalidateQueries({ queryKey: ["group-tasks", selectedGroupId] });
      setIsEditTaskOpen(false);
      setEditingTaskId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update task");
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (groupTaskId: string) => {
      const response = await apiRequest(`/api/group-tasks/${groupTaskId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete task");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Task deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["group-tasks", selectedGroupId] });
      setIsDeleteTaskDialogOpen(false);
      setDeleteTaskId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete task");
    },
  });

  // Delete group mutation
  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await apiRequest(`/api/groups/${groupId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete group");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Group deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["groups", "user"] });
      setIsDeleteGroupDialogOpen(false);
      if (groupToDeleteId === selectedGroupId) {
        setSelectedGroupId(null);
        navigate("/group-tasks");
      }
      setGroupToDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete group");
    },
  });

  // Filter groups by search query and role
  const filteredGroups = useMemo(() => {
    const data = groupsData?.data ?? [];
    return data.filter((group) => {
      const matchesSearch =
        !searchQuery.trim() ||
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesRole = !roleFilter || group.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [groupsData?.data, searchQuery, roleFilter]);

  const availableRoles = useMemo(() => {
    const data = groupsData?.data ?? [];
    const roles = new Set(data.map((g) => g.role));
    return Array.from(roles).sort();
  }, [groupsData?.data]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["groups", "user"] });
    if (selectedGroupId) {
      queryClient.invalidateQueries({ queryKey: ["group-tasks", selectedGroupId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", selectedGroupId] });
    }
    toast.success("Refreshed");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
  };

  const groupMembers = membersData?.data || [];

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "done":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300";
      case "todo":
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
      case "reopen":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300";
      case "delay":
        return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const filteredMembers = groupMembers.filter((member) =>
    (member.nickname || member.fullname || member.email)
      .toLowerCase()
      .includes(assigneeSearchQuery.toLowerCase())
  );

  const rawTasks = tasksData?.data ?? [];
  const filteredTasks = useMemo(() => {
    if (!taskSearchQuery.trim()) return rawTasks;
    const q = taskSearchQuery.toLowerCase();
    return rawTasks.filter(
      (t) =>
        (t.requirement && t.requirement.toLowerCase().includes(q)) ||
        (t.assignees?.some((a) => {
          const name = (a.nickname || a.fullname || a.email || "").toString().toLowerCase();
          const email = (a.email || "").toString().toLowerCase();
          return name.includes(q) || email.includes(q);
        }))
    );
  }, [rawTasks, taskSearchQuery]);

  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    if (!taskSortBy || taskSortBy === "default") return list;
    const safeDate = (t: GroupTask, field: "startDate" | "endDate") => {
      const v = t[field] || t.startDate || t.endDate;
      if (!v) return new Date(0);
      try {
        const d = parseISO(v);
        return Number.isNaN(d.getTime()) ? new Date(0) : d;
      } catch {
        return new Date(0);
      }
    };
    const weekStart = (t: GroupTask) => {
      const d = safeDate(t, "startDate");
      return startOfWeek(d, { weekStartsOn: 1 }).getTime();
    };
    list.sort((a, b) => {
      let cmp = 0;
      if (taskSortBy === "start_asc" || taskSortBy === "start_desc") {
        cmp = safeDate(a, "startDate").getTime() - safeDate(b, "startDate").getTime();
        if (taskSortBy === "start_desc") cmp = -cmp;
      } else if (taskSortBy === "end_asc" || taskSortBy === "end_desc") {
        cmp = safeDate(a, "endDate").getTime() - safeDate(b, "endDate").getTime();
        if (taskSortBy === "end_desc") cmp = -cmp;
      } else if (taskSortBy === "week_asc" || taskSortBy === "week_desc") {
        cmp = weekStart(a) - weekStart(b);
        if (taskSortBy === "week_desc") cmp = -cmp;
      }
      return cmp;
    });
    return list;
  }, [filteredTasks, taskSortBy]);

  const totalTaskPages = Math.max(1, Math.ceil(sortedTasks.length / PAGE_SIZE));
  const taskPageClamped = Math.min(taskPage, totalTaskPages - 1);
  const paginatedTasks = useMemo(
    () => sortedTasks.slice(taskPageClamped * PAGE_SIZE, (taskPageClamped + 1) * PAGE_SIZE),
    [sortedTasks, taskPageClamped]
  );
  const taskStartRow = taskPageClamped * PAGE_SIZE + 1;
  const taskEndRow = Math.min((taskPageClamped + 1) * PAGE_SIZE, sortedTasks.length);

  useEffect(() => {
    setTaskPage(0);
  }, [taskSearchQuery, taskSortBy]);

  if (isLoadingGroups) {
    return (
      <div className="flex items-center justify-center h-full">
        <div>Loading groups...</div>
      </div>
    );
  }

  const selectedGroup = groupsData?.data?.find((group) => group.groupId === selectedGroupId);

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4">
      {/* Header - same as Personal Task */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Group Tasks</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoadingGroups}
            className="shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoadingGroups ? "animate-spin" : ""}`}
            />
          </Button>
          <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a new group to manage team tasks and workflows
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Group Name *</Label>
                  <Input
                    id="group-name"
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-description">Description</Label>
                  <Input
                    id="group-description"
                    placeholder="Enter group description (optional)"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() =>
                    createGroup.mutate({
                      name: newGroupName,
                      description: newGroupDescription || undefined,
                    })
                  }
                  disabled={!newGroupName.trim() || createGroup.isPending}
                  className="w-full"
                >
                  {createGroup.isPending ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters - same as Personal Task */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="🔍 Search by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {(searchQuery || roleFilter) && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <GroupsList
        groups={filteredGroups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={(id) => {
          setSelectedGroupId(id);
          navigate(`/group-tasks/${id}`);
        }}
        onEditGroup={(group) => {
          setEditingGroupId(group.groupId);
          setEditGroupName(group.name);
          setEditGroupDescription(group.description || "");
          setIsEditGroupOpen(true);
        }}
        onDeleteGroup={(id) => {
          setGroupToDeleteId(id);
          setIsDeleteGroupDialogOpen(true);
        }}
      />

      <section className="space-y-4">
          {selectedGroupId ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{selectedGroup?.name || "Group Tasks"}</h2>
                  {selectedGroup?.role && (
                    <p className="text-sm text-gray-500 capitalize">Role: {selectedGroup.role}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedGroup?.role === "owner" && (
                    <Dialog
                      open={isEditGroupOpen}
                      onOpenChange={(open) => {
                        setIsEditGroupOpen(open);
                        if (!open) setEditingGroupId(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingGroupId(selectedGroupId);
                            setEditGroupName(selectedGroup?.name || "");
                            setEditGroupDescription(selectedGroup?.description || "");
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit Group
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Group</DialogTitle>
                          <DialogDescription>Update group information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="edit-group-name">Group Name *</Label>
                            <Input
                              id="edit-group-name"
                              placeholder="Group name"
                              value={editGroupName}
                              onChange={(e) => setEditGroupName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="edit-group-desc">Description</Label>
                            <textarea
                              id="edit-group-desc"
                              placeholder="Group description"
                              value={editGroupDescription}
                              onChange={(e) => setEditGroupDescription(e.target.value)}
                              className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </div>
                          <Button
                            disabled={!editGroupName.trim() || updateGroup.isPending || !editingGroupId}
                            onClick={() => {
                              if (!editingGroupId) return;
                              updateGroup.mutate({
                                groupId: editingGroupId,
                                name: editGroupName,
                                description: editGroupDescription || undefined,
                              });
                            }}
                            className="w-full"
                          >
                            {updateGroup.isPending ? "Updating..." : "Update Group"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Add Teammate
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add teammate</DialogTitle>
                        <DialogDescription>Invite someone by email to this group</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="member-email">Email *</Label>
                          <Input
                            id="member-email"
                            type="email"
                            placeholder="teammate@example.com"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="member-role">Role</Label>
                          <select
                            id="member-role"
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="member">Member</option>
                            <option value="leader">Leader</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <Button
                          disabled={!newMemberEmail.trim() || addMember.isPending}
                          onClick={() => {
                            if (!selectedGroupId) return;
                            addMember.mutate({
                              groupId: selectedGroupId,
                              email: newMemberEmail,
                              role: newMemberRole,
                            });
                          }}
                          className="w-full"
                        >
                          {addMember.isPending ? "Adding..." : "Add member"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {selectedGroup?.role === "owner" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setGroupToDeleteId(selectedGroupId);
                        setIsDeleteGroupDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Group
                    </Button>
                  )}

                  <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2" size="sm">
                        <Plus className="h-4 w-4" />
                        Create Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                        <DialogDescription>
                          Add a task to this group
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="task-requirement">Requirement *</Label>
                          <Textarea
                            id="task-requirement"
                            placeholder="Enter requirement (supports multiple lines)"
                            value={taskRequirement}
                            onChange={(e) => setTaskRequirement(e.target.value)}
                            className="min-h-[100px] resize-y"
                            rows={4}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="task-priority">Priority</Label>
                            <select
                              id="task-priority"
                              value={taskPriority}
                              onChange={(e) => setTaskPriority(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="task-status">Status</Label>
                            <select
                              id="task-status"
                              value={taskStatus}
                              onChange={(e) => setTaskStatus(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="todo">To do</option>
                              <option value="in_progress">In progress</option>
                              <option value="reopen">Reopen</option>
                              <option value="done">Done</option>
                              <option value="delay">Delay</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="task-start">Start date</Label>
                            <Input
                              id="task-start"
                              type="date"
                              value={taskStartDate || getTodayDateString()}
                              min={getTodayDateString()}
                              placeholder="Select start date"
                              onChange={(e) => {
                                setTaskStartDate(e.target.value);
                                if (taskEndDate && e.target.value > taskEndDate) {
                                  setTaskEndDate(e.target.value);
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="task-end">End date</Label>
                            <Input
                              id="task-end"
                              type="date"
                              value={taskEndDate || (taskStartDate || getTodayDateString())}
                              min={taskStartDate || getTodayDateString()}
                              placeholder="Select end date"
                              onChange={(e) => setTaskEndDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Assignees</Label>
                          <Popover open={isAssigneePopoverOpen} onOpenChange={setIsAssigneePopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                disabled={isLoadingMembers}
                              >
                                {selectedAssignees.length === 0
                                  ? "Select assignees..."
                                  : `${selectedAssignees.length} selected`}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <div className="p-3 space-y-2">
                                <Input
                                  placeholder="Search members..."
                                  value={assigneeSearchQuery}
                                  onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                                  className="h-9"
                                />
                                <div className="max-h-48 overflow-auto space-y-2">
                                  {filteredMembers.length === 0 ? (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                      {assigneeSearchQuery ? "No members found" : "No members available"}
                                    </div>
                                  ) : (
                                    filteredMembers.map((member) => (
                                      <div
                                        key={member.userId}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                                        onClick={() => {
                                          setSelectedAssignees((prev) =>
                                            prev.includes(member.userId)
                                              ? prev.filter((id) => id !== member.userId)
                                              : [...prev, member.userId]
                                          );
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedAssignees.includes(member.userId)}
                                          onChange={() => {}}
                                          className="h-4 w-4 cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium truncate">
                                            {member.nickname || member.fullname || member.email}
                                          </div>
                                          <div className="text-xs text-gray-500 truncate">{member.email}</div>
                                        </div>
                                        <span className="text-xs text-gray-600 capitalize flex-shrink-0">
                                          {member.role || "member"}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                                <div className="border-t pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setIsAssigneePopoverOpen(false)}
                                  >
                                    Done
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {selectedAssignees.length > 0 && (
                            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded">
                              {selectedAssignees.map((id) => {
                                const member = groupMembers.find((m) => m.userId === id);
                                return member ? (
                                  <div
                                    key={id}
                                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-1 text-xs"
                                  >
                                    {member.nickname || member.fullname || member.email}
                                    <button
                                      onClick={() =>
                                        setSelectedAssignees((prev) => prev.filter((aid) => aid !== id))
                                      }
                                      className="hover:text-blue-900"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}
                          <p className="text-xs text-gray-500">Select one or more members to assign.</p>
                        </div>
                        <Button
                          disabled={!taskRequirement.trim() || createTask.isPending}
                          onClick={() => {
                            if (!selectedGroupId) return;
                            createTask.mutate({
                              groupId: selectedGroupId,
                              requirement: taskRequirement,
                              priority: taskPriority,
                              status: taskStatus,
                              startDate: taskStartDate || getTodayDateString(),
                              endDate: taskEndDate || taskStartDate || getTodayDateString(),
                              assigneeIds: selectedAssignees,
                            });
                          }}
                          className="w-full"
                        >
                          {createTask.isPending ? "Creating..." : "Create Task"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedGroup?.role !== "owner" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLeaveGroupDialogOpen(true)}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Leave Group
                  </Button>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      View Members ({groupMembers.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Group Members</DialogTitle>
                      <DialogDescription>Members in {selectedGroup?.name || "this group"}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {groupMembers.length === 0 ? (
                        <div className="text-sm text-gray-500">No members found</div>
                      ) : (
                        groupMembers.map((member) => {
                          const isCurrentUser = currentUser?.userId === member.userId;
                          const canKick =
                            !isCurrentUser &&
                            member.role !== "owner" &&
                            selectedGroupId &&
                            ["owner", "admin", "leader"].includes(selectedGroup?.role || "");
                          return (
                            <div key={member.userId} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
                              <div className="truncate text-sm min-w-0">
                                <div className="font-medium truncate">
                                  {member.nickname || member.fullname || member.email}
                                  {isCurrentUser && (
                                    <span className="text-xs text-muted-foreground ml-1">(You)</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{member.email}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-gray-600 capitalize">{member.role || "member"}</span>
                                {canKick && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setKickMemberId(member.userId)}
                                  >
                                    <UserMinus className="h-4 w-4" title="Kick" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
                  <Button
                    variant={activeTab === "schedule" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setActiveTab("schedule")}
                  >
                    Weekly Schedule
                  </Button>
                  <Button
                    variant={activeTab === "tasks" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setActiveTab("tasks")}
                  >
                    Group Tasks
                  </Button>
                  <Button
                    variant={activeTab === "timeline" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setActiveTab("timeline")}
                  >
                    Timeline
                  </Button>
                </div>

                <div className="p-4">
                  {activeTab === "schedule" ? (
                    isLoadingTasks ? (
                      <div className="text-gray-500 text-sm">Loading tasks...</div>
                    ) : (
                      <GroupTaskWeekTable
                        tasks={tasksData?.data ?? []}
                        getStatusStyles={getStatusStyles}
                        onTaskClick={(task) => {
                          setViewTaskId(task.groupTaskId);
                          setIsViewTaskOpen(true);
                        }}
                        onEdit={(task) => {
                          setEditingTaskId(task.groupTaskId);
                          setEditTaskRequirement(task.requirement || "");
                          setEditTaskPriority(task.priority);
                          setEditTaskStatus(task.status);
                          setEditTaskStartDate(toDateOnly(task.startDate));
                          setEditTaskEndDate(toDateOnly(task.endDate));
                          setEditSelectedAssignees((task.assignees || []).map((a) => a.userId));
                          setEditAssigneeSearchQuery("");
                          setIsEditTaskOpen(true);
                        }}
                        onDelete={(task) => {
                          setDeleteTaskId(task.groupTaskId);
                          setIsDeleteTaskDialogOpen(true);
                        }}
                      />
                    )
                  ) : activeTab === "tasks" ? (
                    isLoadingTasks ? (
                      <div className="text-gray-500 text-sm">Loading tasks...</div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <h3 className="text-lg font-semibold">Group Tasks ({sortedTasks.length})</h3>
                          <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                            <div className="relative flex-1 sm:max-w-[220px]">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="text"
                                placeholder="Search task or assignee..."
                                value={taskSearchQuery}
                                onChange={(e) => setTaskSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                              />
                            </div>
                            <select
                              value={taskSortBy}
                              onChange={(e) => setTaskSortBy(e.target.value)}
                              className="flex h-9 min-w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="default">Sort: Default</option>
                              <option value="start_asc">Start date (oldest first)</option>
                              <option value="start_desc">Start date (newest first)</option>
                              <option value="end_asc">End date (oldest first)</option>
                              <option value="end_desc">End date (newest first)</option>
                              <option value="week_asc">Week (oldest first)</option>
                              <option value="week_desc">Week (newest first)</option>
                            </select>
                          </div>
                        </div>
                        <GroupTasksTable
                          tasks={paginatedTasks}
                          emptyMessage="No tasks in this group yet."
                          onView={(task) => {
                            setViewTaskId(task.groupTaskId);
                            setIsViewTaskOpen(true);
                          }}
                          onEdit={(task) => {
                            setEditingTaskId(task.groupTaskId);
                            setEditTaskRequirement(task.requirement || "");
                            setEditTaskPriority(task.priority);
                            setEditTaskStatus(task.status);
                            setEditTaskStartDate(toDateOnly(task.startDate));
                            setEditTaskEndDate(toDateOnly(task.endDate));
                            setEditSelectedAssignees((task.assignees || []).map((a) => a.userId));
                            setEditAssigneeSearchQuery("");
                            setIsEditTaskOpen(true);
                          }}
                          onDelete={(task) => {
                            setDeleteTaskId(task.groupTaskId);
                            setIsDeleteTaskDialogOpen(true);
                          }}
                          canEdit={true}
                        />
                        {sortedTasks.length > PAGE_SIZE && (
                          <div className="flex items-center justify-between pt-2">
                            <p className="text-sm text-muted-foreground">
                              Showing {taskStartRow} to {taskEndRow} of {sortedTasks.length} tasks
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTaskPage((p) => Math.max(0, p - 1))}
                                disabled={taskPageClamped <= 0}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <span className="text-sm px-2">
                                Page {taskPageClamped + 1} of {totalTaskPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTaskPage((p) => p + 1)}
                                disabled={taskPageClamped >= totalTaskPages - 1}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : activeTab === "timeline" ? (
                    isLoadingTasks ? (
                      <div className="text-gray-500 text-sm">Loading tasks...</div>
                    ) : tasksData?.data && tasksData.data.length > 0 ? (
                      <GroupTaskTimelineView tasks={tasksData.data} />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No tasks to display in timeline</p>
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[320px] rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No group selected</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Choose a group from the list on the left to view and manage its tasks.
              </p>
            </div>
          )}
        </section>

      {/* View Task Dialog - standalone */}
      <Dialog
        open={isViewTaskOpen}
        onOpenChange={(open) => {
          setIsViewTaskOpen(open);
          if (!open) setViewTaskId(null);
        }}
      >
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>View task information</DialogDescription>
          </DialogHeader>
          {viewTaskId && (() => {
            const task = tasksData?.data?.find((t) => t.groupTaskId === viewTaskId);
            if (!task) return null;
            const priorityClass: Record<string, string> = {
              high: "border-red-200 bg-red-100 text-red-800",
              medium: "border-amber-200 bg-amber-100 text-amber-800",
              low: "border-slate-200 bg-slate-100 text-slate-700",
            };
            const statusClass: Record<string, string> = {
              done: "border-emerald-200 bg-emerald-100 text-emerald-800",
              in_progress: "border-blue-200 bg-blue-100 text-blue-800",
              todo: "border-slate-200 bg-slate-100 text-slate-600",
              reopen: "border-orange-200 bg-orange-100 text-orange-800",
              delay: "border-red-200 bg-red-100 text-red-800",
            };
            return (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Requirement</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words min-h-[60px]">
                    {task.requirement?.trim() || "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={statusClass[task.status.toLowerCase()] ?? "bg-muted text-muted-foreground"}>
                    {task.status.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="outline" className={priorityClass[task.priority.toLowerCase()] ?? "bg-muted text-muted-foreground"}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Start date</p>
                    <p className="font-medium">{task.startDate ? format(parseISO(task.startDate), "MMM d, yyyy") : "—"}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground">End date</p>
                    <p className="font-medium">{task.endDate ? format(parseISO(task.endDate), "MMM d, yyyy") : "—"}</p>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-2">Assignees</p>
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {task.assignees.map((assignee) => (
                        <span
                          key={assignee.userId}
                          className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {assignee.nickname || assignee.fullname || assignee.email}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog - standalone (form state already in page) */}
      <Dialog
        open={isEditTaskOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditTaskOpen(false);
            setEditingTaskId(null);
            setEditSelectedAssignees([]);
            setEditAssigneeSearchQuery("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-task-req">Requirement *</Label>
              <Textarea
                id="edit-task-req"
                placeholder="Enter requirement (supports multiple lines)"
                value={editTaskRequirement}
                onChange={(e) => setEditTaskRequirement(e.target.value)}
                className="min-h-[100px] resize-y"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-task-pri">Priority</Label>
                <select
                  id="edit-task-pri"
                  value={editTaskPriority}
                  onChange={(e) => setEditTaskPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-task-sta">Status</Label>
                <select
                  id="edit-task-sta"
                  value={editTaskStatus}
                  onChange={(e) => setEditTaskStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="reopen">Reopen</option>
                  <option value="done">Done</option>
                  <option value="delay">Delay</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-task-start">Start date</Label>
                <Input
                  id="edit-task-start"
                  type="date"
                  value={editTaskStartDate}
                  min={getTodayDateString()}
                  onChange={(e) => {
                    setEditTaskStartDate(e.target.value);
                    if (editTaskEndDate && e.target.value > editTaskEndDate) setEditTaskEndDate(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-task-end">End date</Label>
                <Input
                  id="edit-task-end"
                  type="date"
                  value={editTaskEndDate}
                  min={editTaskStartDate || getTodayDateString()}
                  onChange={(e) => setEditTaskEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Assignees</Label>
              <Popover open={isEditAssigneePopoverOpen} onOpenChange={setIsEditAssigneePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={isLoadingMembers}
                  >
                    {editSelectedAssignees.length === 0 ? "Select assignees..." : `${editSelectedAssignees.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-3 space-y-2">
                    <Input
                      placeholder="Search members..."
                      value={editAssigneeSearchQuery}
                      onChange={(e) => setEditAssigneeSearchQuery(e.target.value)}
                      className="h-9"
                    />
                    <div className="max-h-48 overflow-auto space-y-2">
                      {filteredMembers.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">
                          {editAssigneeSearchQuery ? "No members found" : "No members available"}
                        </div>
                      ) : (
                        filteredMembers
                          .filter((m) =>
                            (m.nickname || m.fullname || m.email)
                              .toLowerCase()
                              .includes(editAssigneeSearchQuery.toLowerCase())
                          )
                          .map((member) => (
                            <div
                              key={member.userId}
                              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                              onClick={() => {
                                setEditSelectedAssignees((prev) =>
                                  prev.includes(member.userId) ? prev.filter((id) => id !== member.userId) : [...prev, member.userId]
                                );
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={editSelectedAssignees.includes(member.userId)}
                                onChange={() => {}}
                                className="h-4 w-4 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{member.nickname || member.fullname || member.email}</div>
                                <div className="text-xs text-gray-500 truncate">{member.email}</div>
                              </div>
                              <span className="text-xs text-gray-600 capitalize shrink-0">{member.role || "member"}</span>
                            </div>
                          ))
                      )}
                    </div>
                    <div className="border-t pt-2">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setIsEditAssigneePopoverOpen(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {editSelectedAssignees.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded">
                  {editSelectedAssignees.map((id) => {
                    const member = groupMembers.find((m) => m.userId === id);
                    return member ? (
                      <div key={id} className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-1 text-xs">
                        {member.nickname || member.fullname || member.email}
                        <button type="button" onClick={() => setEditSelectedAssignees((prev) => prev.filter((aid) => aid !== id))} className="hover:text-blue-900">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              <p className="text-xs text-gray-500">Select one or more members to assign.</p>
            </div>
            <Button
              disabled={!editTaskRequirement.trim() || updateTask.isPending}
              onClick={() => {
                if (!editingTaskId) return;
                const start = toDateOnly(editTaskStartDate) || getTodayDateString();
                const end = toDateOnly(editTaskEndDate) || start;
                updateTask.mutate({
                  groupTaskId: editingTaskId,
                  requirement: editTaskRequirement,
                  priority: editTaskPriority,
                  status: editTaskStatus,
                  startDate: start,
                  endDate: end,
                  assigneeIds: editSelectedAssignees,
                });
              }}
              className="w-full"
            >
              {updateTask.isPending ? "Updating..." : "Update Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Task Dialog - standalone */}
      <Dialog
        open={isDeleteTaskDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteTaskDialogOpen(false);
            setDeleteTaskId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTaskId && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm font-medium">
                {tasksData?.data?.find((t) => t.groupTaskId === deleteTaskId)?.requirement || "Untitled"}
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setIsDeleteTaskDialogOpen(false); setDeleteTaskId(null); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteTask.isPending || !deleteTaskId}
              onClick={() => { if (deleteTaskId) deleteTask.mutate(deleteTaskId); }}
            >
              {deleteTask.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kick member confirm */}
      <Dialog open={!!kickMemberId} onOpenChange={(open) => !open && setKickMemberId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kick member</DialogTitle>
            <DialogDescription>
              Remove this person from the group? They will lose access to all group tasks.
            </DialogDescription>
          </DialogHeader>
          {kickMemberId && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm font-medium">
                {groupMembers.find((m) => m.userId === kickMemberId)?.nickname ||
                  groupMembers.find((m) => m.userId === kickMemberId)?.fullname ||
                  groupMembers.find((m) => m.userId === kickMemberId)?.email ||
                  "Member"}
              </p>
              <p className="text-xs text-muted-foreground">
                {groupMembers.find((m) => m.userId === kickMemberId)?.email}
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setKickMemberId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={kickMember.isPending || !selectedGroupId}
              onClick={() => {
                if (selectedGroupId && kickMemberId) {
                  kickMember.mutate({ groupId: selectedGroupId, userId: kickMemberId });
                }
              }}
            >
              {kickMember.isPending ? "Removing..." : "Kick"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave group confirm */}
      <Dialog open={isLeaveGroupDialogOpen} onOpenChange={setIsLeaveGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave group</DialogTitle>
            <DialogDescription>
              You will no longer have access to this group or its tasks. You can be re-invited later.
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm font-medium">{selectedGroup.name}</p>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsLeaveGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={leaveGroup.isPending || !selectedGroupId}
              onClick={() => selectedGroupId && leaveGroup.mutate(selectedGroupId)}
            >
              {leaveGroup.isPending ? "Leaving..." : "Leave group"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog - top level so it can be opened from table or header */}

      <Dialog
        open={isDeleteGroupDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteGroupDialogOpen(open);
          if (!open) setGroupToDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteGroupDialogOpen(false);
                setGroupToDeleteId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteGroup.isPending || !groupToDeleteId}
              onClick={() => {
                if (!groupToDeleteId) return;
                deleteGroup.mutate(groupToDeleteId);
              }}
            >
              {deleteGroup.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupTaskPage;
