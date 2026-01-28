import React, { useState } from "react";
import { format, parseISO, addDays, startOfWeek, endOfWeek } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { CreateGroupTaskDialog } from "./CreateGroupTaskDialog";
import { CreateGroupSwimlaneDialog } from "./CreateGroupSwimlaneDialog";
import { DeleteGroupSwimlaneDialog } from "./DeleteGroupSwimlaneDialog";

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
  groupTaskId: string;
  assignedUserId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

interface GroupTaskWeekViewProps {
  groupTaskId: string;
  startDate: string;
  swimlanes: Swimlane[];
  isLeader: boolean;
  onRefresh: () => void;
  onCreateTask: (swimlaneId: string, data: any) => Promise<void>;
  onUpdateTask: (taskId: string, data: any) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCreateSwimlane: (data: any) => Promise<void>;
  onDeleteSwimlane: (swimlaneId: string) => Promise<void>;
  onAssignSwimlane: (swimlaneId: string, userId: string) => Promise<void>;
  teamMembers?: Array<{ userId: string; email: string }>;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "done":
      return "bg-green-100 text-green-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "delay":
      return "bg-orange-100 text-orange-800";
    case "reopen":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const GroupTaskWeekView: React.FC<GroupTaskWeekViewProps> = ({
  groupTaskId,
  startDate,
  swimlanes,
  isLeader,
  onRefresh,
  onCreateTask,
  onUpdateTask: _onUpdateTask,
  onDeleteTask: _onDeleteTask,
  onCreateSwimlane,
  onDeleteSwimlane,
  onAssignSwimlane: _onAssignSwimlane,
  teamMembers: _teamMembers,
}) => {
  const [selectedSwimlane, setSelectedSwimlane] = useState<Swimlane | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isDeleteSwimlaneOpen, setIsDeleteSwimlaneOpen] = useState(false);
  const [swimlaneToDelete, setSwimlaneToDelete] = useState<{ swimlaneId: string; content: string } | null>(null);

  const weekStart = startOfWeek(parseISO(startDate));
  const weekEnd = endOfWeek(weekStart);

  // Generate array of dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group tasks by swimlane and date
  const tasksByDate = (swimlaneId: string) => {
    const swimlane = swimlanes.find((s) => s.swimlaneId === swimlaneId);
    const grouped: { [key: string]: Task[] } = {};

    weekDates.forEach((date) => {
      grouped[format(date, "yyyy-MM-dd")] = [];
    });

    swimlane?.tasks?.forEach((task) => {
      if (grouped[task.taskDate]) {
        grouped[task.taskDate].push(task);
      }
    });

    return grouped;
  };

  const handleCreateTask = async (data: any) => {
    if (selectedSwimlane) {
      await onCreateTask(selectedSwimlane.swimlaneId, data);
      onRefresh();
    }
  };

  const handleDeleteSwimlane = async () => {
    if (swimlaneToDelete) {
      await onDeleteSwimlane(swimlaneToDelete.swimlaneId);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-2 items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Week of {format(weekStart, "MMM dd")} - {format(weekEnd, "MMM dd, yyyy")}
          </h3>
          <p className="text-sm text-gray-500">
            {format(weekStart, "EEEE, MMMM d, yyyy")} to {format(weekEnd, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        {isLeader && (
          <CreateGroupSwimlaneDialog
            groupTaskId={groupTaskId}
            onSuccess={onRefresh}
            onSubmit={onCreateSwimlane}
          />
        )}
      </div>

      {/* Week Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="border-r px-4 py-3 text-left font-semibold w-48">Swimlane</th>
              {weekDates.map((date) => (
                <th
                  key={format(date, "yyyy-MM-dd")}
                  className="border-r px-4 py-3 text-left font-semibold bg-gray-50 min-w-[200px]"
                >
                  <div>
                    <div className="text-sm font-semibold">{format(date, "EEE")}</div>
                    <div className="text-xs text-gray-500">{format(date, "MMM dd")}</div>
                  </div>
                </th>
              ))}
              {isLeader && <th className="px-4 py-3 text-center w-12">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {swimlanes.map((swimlane) => (
              <tr key={swimlane.swimlaneId} className="border-b hover:bg-gray-50">
                <td className="border-r px-4 py-3 font-medium bg-gray-50">
                  <div className="flex flex-col gap-1">
                    <span>{swimlane.content}</span>
                    {swimlane.assignedUserId && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        Assigned
                      </Badge>
                    )}
                  </div>
                </td>

                {/* Task cells for each day */}
                {weekDates.map((date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const tasksForDay = tasksByDate(swimlane.swimlaneId)[dateStr] || [];

                  return (
                    <td
                      key={dateStr}
                      className="border-r px-4 py-3 align-top min-w-[200px]"
                    >
                      <div className="space-y-2">
                        {tasksForDay.map((task) => (
                          <Card
                            key={task.taskId}
                            className="p-2 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                              setSelectedSwimlane(swimlane);
                            }}
                          >
                            <div className="text-sm font-medium line-clamp-2">
                              {task.content}
                            </div>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                                {task.status.replace("_", " ")}
                              </Badge>
                              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                            </div>
                          </Card>
                        ))}

                        {/* Add task button */}
                        {isLeader && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setSelectedSwimlane(swimlane);
                              setIsCreateTaskOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Task
                          </Button>
                        )}
                      </div>
                    </td>
                  );
                })}

                {/* Actions */}
                {isLeader && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSwimlaneToDelete({
                            swimlaneId: swimlane.swimlaneId,
                            content: swimlane.content,
                          });
                          setIsDeleteSwimlaneOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Task Dialog */}
      <CreateGroupTaskDialog
        swimlaneId={selectedSwimlane?.swimlaneId || ""}
        onSuccess={onRefresh}
        isOpen={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        onSubmit={handleCreateTask}
      />

      {/* Delete Swimlane Dialog */}
      <DeleteGroupSwimlaneDialog
        swimlane={swimlaneToDelete}
        isOpen={isDeleteSwimlaneOpen}
        onOpenChange={setIsDeleteSwimlaneOpen}
        onDelete={handleDeleteSwimlane}
      />
    </div>
  );
};
