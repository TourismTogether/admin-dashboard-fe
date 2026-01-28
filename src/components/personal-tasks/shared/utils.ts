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
