import React, { useEffect, useMemo, useState } from "react";
import { addWeeks, endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, X, Edit2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { useNavigate, useParams } from "react-router-dom";

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
  const [isGroupsListVisible, setIsGroupsListVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedule" | "tasks" | "timeline">("schedule");
  const [isWeeklyScheduleExpanded, setIsWeeklyScheduleExpanded] = useState(false);

  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
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
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery<
    { data: GroupTask[] }
  >({
    queryKey: ["group-tasks", selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return { data: [] };
      const response = await apiRequest(`/api/group-tasks?groupId=${selectedGroupId}`);
      if (!response.ok) throw new Error("Failed to fetch group tasks");
      const result = await response.json();
      console.log("Group tasks response:", result.data);
      return result;
    },
    enabled: !!selectedGroupId,
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
      if (!response.ok) throw new Error("Failed to delete task");
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
      setSelectedGroupId(null);
      navigate("/group-tasks");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete group");
    },
  });

  // Filter groups by search query
  const filteredGroups = groupsData?.data?.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const groupMembers = membersData?.data || [];

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "reopen":
        return "bg-orange-100 text-orange-800";
      case "delay":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const safeDateFromString = (value?: string | null) => {
    if (!value) return null;
    const date = parseISO(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const taskDateBounds = (task: GroupTask) => {
    const start = safeDateFromString(task.startDate || task.createdAt);
    const end = safeDateFromString(task.endDate || task.startDate || task.createdAt);
    if (!start && !end) return null;

    const startDate = start || end || new Date();
    const endDate = end || start || startDate;

    return { start: startDate, end: endDate };
  };

  const weeklyTaskBuckets = useMemo(() => {
    const data = tasksData?.data || [];
    if (!data.length) return [] as { weekStart: Date; weekEnd: Date; tasks: GroupTask[] }[];

    const ranges = data
      .map((task) => taskDateBounds(task))
      .filter(Boolean) as { start: Date; end: Date }[];

    if (!ranges.length) return [] as { weekStart: Date; weekEnd: Date; tasks: GroupTask[] }[];

    const earliest = ranges.reduce((acc, curr) => (curr.start < acc ? curr.start : acc), ranges[0].start);
    const latest = ranges.reduce((acc, curr) => (curr.end > acc ? curr.end : acc), ranges[0].end);

    const weeks: { weekStart: Date; weekEnd: Date; tasks: GroupTask[] }[] = [];
    const lastWeekEnd = endOfWeek(latest, { weekStartsOn: 1 });
    let cursor = startOfWeek(earliest, { weekStartsOn: 1 });

    while (cursor <= lastWeekEnd) {
      const weekStart = cursor;
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      const weekTasks = data.filter((task) => {
        const bounds = taskDateBounds(task);
        if (!bounds) return false;
        return bounds.start <= weekEnd && bounds.end >= weekStart;
      });

      weeks.push({ weekStart, weekEnd, tasks: weekTasks });
      cursor = addWeeks(weekStart, 1);
    }

    return weeks;
  }, [tasksData]);

  const filteredMembers = groupMembers.filter((member) =>
    (member.nickname || member.fullname || member.email)
      .toLowerCase()
      .includes(assigneeSearchQuery.toLowerCase())
  );


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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Group Tasks</h1>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Group
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

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-4 items-start">
        <aside className="bg-white border rounded-lg p-3 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Groups</h2>
            <button
              onClick={() => setIsGroupsListVisible(!isGroupsListVisible)}
              className="p-1 hover:bg-gray-100 rounded transition lg:hidden"
            >
              {isGroupsListVisible ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className={`${isGroupsListVisible ? 'block' : 'hidden'} lg:block space-y-3`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {filteredGroups.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    {searchQuery ? "No groups found" : "No groups yet"}
                  </div>
                ) : (
                  filteredGroups.map((group) => {
                    const isActive = selectedGroupId === group.groupId;
                    return (
                      <button
                        key={group.groupId}
                        onClick={() => navigate(`/group-tasks/${group.groupId}`)}
                        className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                          isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{group.name}</span>
                          <span className="text-xs text-gray-500 capitalize">{group.role}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
        </aside>

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
                    <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
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
                            disabled={!editGroupName.trim() || updateGroup.isPending}
                            onClick={() => {
                              if (!selectedGroupId) return;
                              updateGroup.mutate({
                                groupId: selectedGroupId,
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
                    <Dialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Group
                        </Button>
                      </DialogTrigger>
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
                            onClick={() => setIsDeleteGroupDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            disabled={deleteGroup.isPending}
                            onClick={() => {
                              if (!selectedGroupId) return;
                              deleteGroup.mutate(selectedGroupId);
                            }}
                          >
                            {deleteGroup.isPending ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
                          <Input
                            id="task-requirement"
                            placeholder="Enter requirement"
                            value={taskRequirement}
                            onChange={(e) => setTaskRequirement(e.target.value)}
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
                        groupMembers.map((member) => (
                          <div key={member.userId} className="flex items-center justify-between border rounded-md px-3 py-2">
                            <div className="truncate text-sm">
                              <div className="font-medium truncate">{member.nickname || member.fullname || member.email}</div>
                              <div className="text-xs text-gray-500 truncate">{member.email}</div>
                            </div>
                            <span className="text-xs text-gray-600 capitalize">{member.role || "member"}</span>
                          </div>
                        ))
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
                    ) : weeklyTaskBuckets.length > 0 ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">Weekly Schedule</h3>
                          <p className="text-sm text-gray-500">Tasks appear in every week they span.</p>
                        </div>
                        <div className="divide-y">
                          {weeklyTaskBuckets
                            .slice(0, isWeeklyScheduleExpanded ? undefined : 3)
                            .map((week) => (
                            <div key={week.weekStart.toISOString()} className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold">
                                    {format(week.weekStart, "MMM d")} - {format(week.weekEnd, "MMM d, yyyy")}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {week.tasks.length} {week.tasks.length === 1 ? "task" : "tasks"}
                                  </p>
                                </div>
                              </div>

                              {week.tasks.length === 0 ? (
                                <div className="text-sm text-gray-500">No tasks this week.</div>
                              ) : (
                                <div className="space-y-2">
                                  {week.tasks.map((task) => (
                                    <div
                                      key={`${week.weekStart.toISOString()}-${task.groupTaskId}`}
                                      className="flex flex-col sm:flex-col justify-between gap-2 border rounded-md p-3 bg-gray-50"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex flex-col gap-2">
                                          <span className="font-medium text-sm text-gray-900 whitespace-normal break-words">
                                            {task.requirement || "Untitled task"}
                                          </span>
                                          <div className="text-xs text-gray-600 flex flex-wrap gap-3">
                                            <span>Start: {task.startDate ? format(parseISO(task.startDate), "MMM d") : "-"}</span>
                                            <span>End: {task.endDate ? format(parseISO(task.endDate), "MMM d") : "-"}</span>
                                            <span>Priority: {task.priority}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-end gap-2 flex-wrap">
                                        <span className={`text-xs px-2 py-1 rounded-full capitalize whitespace-nowrap ${getStatusStyles(task.status)}`}>
                                          {task.status.replace(/_/g, " ")}
                                        </span>
                                        {task.assignees?.length ? (
                                          <div className="flex flex-wrap gap-1">
                                            {task.assignees.map((assignee) => (
                                              <span
                                                key={`${assignee.userId}-${task.groupTaskId}`}
                                                className="text-[11px] bg-white border rounded-full px-2 py-0.5 text-gray-700"
                                              >
                                                {assignee.nickname || assignee.fullname || assignee.email}
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-xs text-gray-500">Unassigned</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {weeklyTaskBuckets.length > 3 && !isWeeklyScheduleExpanded && (
                          <div className="flex justify-center pt-4">
                            <button
                              onClick={() => setIsWeeklyScheduleExpanded(true)}
                              className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                              <ChevronDown className="h-5 w-5 text-gray-600" />
                            </button>
                          </div>
                        )}
                        {isWeeklyScheduleExpanded && weeklyTaskBuckets.length > 3 && (
                          <div className="flex justify-center pt-4">
                            <button
                              onClick={() => setIsWeeklyScheduleExpanded(false)}
                              className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                              <ChevronDown className="h-5 w-5 text-gray-600 transform rotate-180" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">No tasks to show in schedule</div>
                    )
                  ) : activeTab === "tasks" ? (
                    isLoadingTasks ? (
                      <div className="text-gray-500 text-sm">Loading tasks...</div>
                    ) : tasksData?.data && tasksData.data.length > 0 ? (
                      <div className="divide-y">
                      {tasksData.data.map((task) => (
                        <div
                          key={task.groupTaskId}
                          className="p-4 flex items-start justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="text-sm font-semibold text-gray-900 whitespace-normal break-words">
                              {task.requirement || `Task ${task.groupTaskId}`}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-1 rounded-full capitalize whitespace-nowrap ${getStatusStyles(task.status)}`}>
                                {task.status.replace(/_/g, " ")}
                              </span>
                              {task.assignees && task.assignees.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {task.assignees.map((assignee) => (
                                    <span
                                      key={assignee.userId}
                                      className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-1 text-xs"
                                    >
                                      {assignee.nickname || assignee.fullname || assignee.email}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">Unassigned</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Dialog
                              open={viewTaskId === task.groupTaskId && isViewTaskOpen}
                              onOpenChange={(open) => {
                                if (open) {
                                  setViewTaskId(task.groupTaskId);
                                  setIsViewTaskOpen(true);
                                } else {
                                  setIsViewTaskOpen(false);
                                  setViewTaskId(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">Details</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Task Details</DialogTitle>
                                  <DialogDescription>Overview of this task</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 text-sm text-gray-700">
                                  <div>
                                    <span className="font-semibold">Requirement:</span> {task.requirement || "Untitled"}
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    <span><span className="font-semibold">Status:</span> {task.status.replace(/_/g, " ")}</span>
                                    <span><span className="font-semibold">Priority:</span> {task.priority}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    <span><span className="font-semibold">Start:</span> {task.startDate ? format(parseISO(task.startDate), "MMM d, yyyy") : "-"}</span>
                                    <span><span className="font-semibold">End:</span> {task.endDate ? format(parseISO(task.endDate), "MMM d, yyyy") : "-"}</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="font-semibold">Assignees</div>
                                    {task.assignees && task.assignees.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {task.assignees.map((assignee) => (
                                          <span
                                            key={assignee.userId}
                                            className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-1"
                                          >
                                            {assignee.nickname || assignee.fullname || assignee.email}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-500">Unassigned</span>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog
                              open={editingTaskId === task.groupTaskId && isEditTaskOpen}
                              onOpenChange={(open) => {
                                if (open) {
                                  setEditingTaskId(task.groupTaskId);
                                  setEditTaskRequirement(task.requirement || "");
                                  setEditTaskPriority(task.priority);
                                  setEditTaskStatus(task.status);
                                  setEditTaskStartDate(task.startDate || "");
                                  setEditTaskEndDate(task.endDate || "");
                                  setEditSelectedAssignees((task.assignees || []).map((a) => a.userId));
                                  setEditAssigneeSearchQuery("");
                                  setIsEditTaskOpen(true);
                                } else {
                                  setIsEditTaskOpen(false);
                                  setEditingTaskId(null);
                                  setEditSelectedAssignees([]);
                                  setEditAssigneeSearchQuery("");
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Task</DialogTitle>
                                  <DialogDescription>Update task details</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <Label htmlFor="edit-task-req">Requirement *</Label>
                                    <Input
                                      id="edit-task-req"
                                      placeholder="Enter requirement"
                                      value={editTaskRequirement}
                                      onChange={(e) => setEditTaskRequirement(e.target.value)}
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
                                        placeholder="Select start date"
                                        onChange={(e) => {
                                          setEditTaskStartDate(e.target.value);
                                          if (editTaskEndDate && e.target.value > editTaskEndDate) {
                                            setEditTaskEndDate(e.target.value);
                                          }
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
                                        placeholder="Select end date"
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
                                          {editSelectedAssignees.length === 0
                                            ? "Select assignees..."
                                            : `${editSelectedAssignees.length} selected`}
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
                                                        prev.includes(member.userId)
                                                          ? prev.filter((id) => id !== member.userId)
                                                          : [...prev, member.userId]
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
                                              onClick={() => setIsEditAssigneePopoverOpen(false)}
                                            >
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
                                            <div
                                              key={id}
                                              className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-1 text-xs"
                                            >
                                              {member.nickname || member.fullname || member.email}
                                              <button
                                                onClick={() =>
                                                  setEditSelectedAssignees((prev) => prev.filter((aid) => aid !== id))
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
                                          if (editTaskEndDate && e.target.value > editTaskEndDate) {
                                            setEditTaskEndDate(e.target.value);
                                          }
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
                                  <Button
                                    disabled={!editTaskRequirement.trim() || updateTask.isPending}
                                    onClick={() => {
                                      if (!editingTaskId) return;
                                      updateTask.mutate({
                                        groupTaskId: editingTaskId,
                                        requirement: editTaskRequirement,
                                        priority: editTaskPriority,
                                        status: editTaskStatus,
                                        startDate: editTaskStartDate || getTodayDateString(),
                                        endDate: editTaskEndDate || editTaskStartDate || getTodayDateString(),
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

                            {["owner", "admin", "leader"].includes(selectedGroup?.role || "") && (
                              <Dialog
                                open={deleteTaskId === task.groupTaskId && isDeleteTaskDialogOpen}
                                onOpenChange={(open) => {
                                  if (open) {
                                    setDeleteTaskId(task.groupTaskId);
                                    setIsDeleteTaskDialogOpen(true);
                                  } else {
                                    setIsDeleteTaskDialogOpen(false);
                                    setDeleteTaskId(null);
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Task</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete this task? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex gap-3 justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setIsDeleteTaskDialogOpen(false);
                                        setDeleteTaskId(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      disabled={deleteTask.isPending}
                                      onClick={() => {
                                        if (!deleteTaskId) return;
                                        deleteTask.mutate(deleteTaskId);
                                      }}
                                    >
                                      {deleteTask.isPending ? "Deleting..." : "Delete"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No tasks in this group yet</p>
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
            <div className="flex items-center justify-center h-full min-h-[320px] rounded-lg border border-dashed bg-gray-50 text-gray-500">
              Select a group to view tasks
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default GroupTaskPage;
