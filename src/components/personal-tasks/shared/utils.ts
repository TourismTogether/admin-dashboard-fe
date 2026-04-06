import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export const getPriorityBadgeVariant = (priority: string): BadgeVariant => {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "outline";
  }
};

export const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case "done":
      return "default";
    case "in_progress":
      return "secondary";
    case "reopen":
      return "outline";
    case "delay":
      return "destructive";
    default:
      return "outline";
  }
};

export const formatStatusLabel = (status: string): string => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/** Tailwind classes for difficulty badge (calendar/popover). Easy=green, Medium=amber, Hard=red. */
export const getDifficultyBadgeClassName = (difficulty: string): string => {
  const d = (difficulty || "medium").toLowerCase();
  switch (d) {
    case "easy":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800";
    case "hard":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800";
    default:
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800";
  }
};

export const formatDifficultyLabel = (difficulty: string): string => {
  const d = (difficulty || "medium").toLowerCase();
  return d.charAt(0).toUpperCase() + d.slice(1);
};

/** True while create-task optimistic UI uses a temporary id (not a server UUID). */
export function isOptimisticTaskId(taskId: string): boolean {
  return taskId.startsWith("optimistic-");
}
