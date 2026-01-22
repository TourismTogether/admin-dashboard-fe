export interface Task {
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

export interface Swimlane {
  swimlaneId: string;
  content: string;
  tasks?: Task[];
}

export type TabType = "incomplete" | "done" | "kanban";
