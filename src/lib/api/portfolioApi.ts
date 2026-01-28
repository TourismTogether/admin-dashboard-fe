import { apiRequest } from "../api";

export interface Portfolio {
  portfolioId: string;
  userId: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  readme: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  twitterUsername: string | null;
  commits: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioUpdateData {
  username?: string;
  bio?: string;
  avatarUrl?: string;
  readme?: string;
  location?: string;
  company?: string;
  blog?: string;
  twitterUsername?: string;
}

// Get user's portfolio
export async function getPortfolio(): Promise<Portfolio | null> {
  const response = await apiRequest("/api/portfolio");
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch portfolio");
  }
  const data = await response.json();
  return data.data;
}

// Create or update portfolio
export async function upsertPortfolio(portfolioData: PortfolioUpdateData): Promise<Portfolio> {
  const response = await apiRequest("/api/portfolio", {
    method: "POST",
    body: JSON.stringify(portfolioData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update portfolio");
  }
  const data = await response.json();
  return data.data;
}

// Delete portfolio
export async function deletePortfolio(): Promise<void> {
  const response = await apiRequest("/api/portfolio", {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete portfolio");
  }
}

// Get contribution calendar data
export async function getContributions(): Promise<Record<string, number>> {
  const response = await apiRequest("/api/portfolio/contributions");
  if (!response.ok) {
    throw new Error("Failed to fetch contributions");
  }
  const data = await response.json();
  return data.data || {};
}

// ChecklistItem interface
export interface ChecklistItem {
  id: string;
  description: string;
  isComplete: boolean;
}

// Task interface for history
export interface Task {
  taskId: string;
  swimlaneId: string;
  content: string;
  status: string;
  priority: string;
  detail?: string;
  checklist?: ChecklistItem[];
  taskDate: string;
  createdAt: string;
  updatedAt: string;
}

// Get recent tasks (last 10)
export async function getRecentTasks(): Promise<Task[]> {
  const response = await apiRequest("/api/personal-tasks/tasks/recent");
  if (!response.ok) {
    throw new Error("Failed to fetch recent tasks");
  }
  const data = await response.json();
  return data.data || [];
}
