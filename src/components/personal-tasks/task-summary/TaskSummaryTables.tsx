import React, { useMemo, useState } from "react";
import type { Task, Swimlane, TabType } from "../shared/types";
import { TaskTabs } from "./TaskTabs";
import { TasksTable } from "./TasksTable";
import { KanbanBoard } from "./KanbanBoard";
import { Pagination } from "./Pagination";

interface TaskSummaryTablesProps {
  swimlanes: Swimlane[];
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: string, content: string) => void;
}

const PAGE_SIZE = 20;

export const TaskSummaryTables: React.FC<TaskSummaryTablesProps> = ({
  swimlanes,
  onViewTask,
  onDeleteTask,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("incomplete");
  const [donePage, setDonePage] = useState(1);
  const [incompletePage, setIncompletePage] = useState(1);

  // Get all tasks from all swimlanes
  const allTasks = useMemo(() => {
    return swimlanes.flatMap((swimlane) => swimlane.tasks || []);
  }, [swimlanes]);

  // Separate tasks into done and incomplete
  const doneTasks = useMemo(() => {
    return allTasks.filter((task) => task.status === "done");
  }, [allTasks]);

  const incompleteTasks = useMemo(() => {
    return allTasks.filter((task) => task.status !== "done");
  }, [allTasks]);

  // Group tasks by status for kanban view
  const tasksByStatus = useMemo(() => {
    const statusGroups: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      reopen: [],
      delay: [],
      done: [],
    };

    allTasks.forEach((task) => {
      const status = task.status.toLowerCase();
      if (statusGroups[status]) {
        statusGroups[status].push(task);
      } else {
        statusGroups[status] = [task];
      }
    });

    return statusGroups;
  }, [allTasks]);

  // Pagination calculations for done tasks
  const doneTotalPages = Math.ceil(doneTasks.length / PAGE_SIZE);
  const doneStartIndex = (donePage - 1) * PAGE_SIZE;
  const doneEndIndex = doneStartIndex + PAGE_SIZE;
  const paginatedDoneTasks = doneTasks.slice(doneStartIndex, doneEndIndex);

  // Pagination calculations for incomplete tasks
  const incompleteTotalPages = Math.ceil(incompleteTasks.length / PAGE_SIZE);
  const incompleteStartIndex = (incompletePage - 1) * PAGE_SIZE;
  const incompleteEndIndex = incompleteStartIndex + PAGE_SIZE;
  const paginatedIncompleteTasks = incompleteTasks.slice(
    incompleteStartIndex,
    incompleteEndIndex
  );

  return (
    <div className="space-y-6 mt-8">
      <TaskTabs
        activeTab={activeTab}
        incompleteCount={incompleteTasks.length}
        doneCount={doneTasks.length}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === "incomplete" && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Incomplete Tasks ({incompleteTasks.length})
          </h3>
          <TasksTable
            tasks={paginatedIncompleteTasks}
            swimlanes={swimlanes}
            emptyMessage="No incomplete tasks."
            onViewTask={onViewTask}
            onDeleteTask={onDeleteTask}
          />
          {incompleteTasks.length > PAGE_SIZE && (
            <Pagination
              currentPage={incompletePage}
              totalPages={incompleteTotalPages}
              totalItems={incompleteTasks.length}
              pageSize={PAGE_SIZE}
              startIndex={incompleteStartIndex}
              endIndex={incompleteEndIndex}
              onPageChange={setIncompletePage}
            />
          )}
        </div>
      )}

      {activeTab === "done" && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Done Tasks ({doneTasks.length})</h3>
          <TasksTable
            tasks={paginatedDoneTasks}
            swimlanes={swimlanes}
            emptyMessage="No completed tasks yet."
            onViewTask={onViewTask}
            onDeleteTask={onDeleteTask}
          />
          {doneTasks.length > PAGE_SIZE && (
            <Pagination
              currentPage={donePage}
              totalPages={doneTotalPages}
              totalItems={doneTasks.length}
              pageSize={PAGE_SIZE}
              startIndex={doneStartIndex}
              endIndex={doneEndIndex}
              onPageChange={setDonePage}
            />
          )}
        </div>
      )}

      {activeTab === "kanban" && (
        <KanbanBoard
          tasksByStatus={tasksByStatus}
          swimlanes={swimlanes}
          onViewTask={onViewTask}
          onDeleteTask={onDeleteTask}
        />
      )}
    </div>
  );
};
