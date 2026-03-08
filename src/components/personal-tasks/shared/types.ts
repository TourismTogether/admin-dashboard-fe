export interface ChecklistItem {
  id: string;
  description: string;
  isComplete: boolean;
}

export type TaskDifficulty = "easy" | "medium" | "hard";

export interface Task {
  taskId: string;
  swimlaneId: string;
  content: string;
  status: string;
  priority: string;
  difficulty?: TaskDifficulty;
  detail?: string;
  checklist?: ChecklistItem[];
  taskDate: string;
  createdAt: string;
  updatedAt: string;
  /** UI-only flag for optimistic updates */
  isPending?: boolean;
}

export interface Swimlane {
  swimlaneId: string;
  content: string;
  tasks?: Task[];
}

export type TabType = "incomplete" | "done" | "kanban";
