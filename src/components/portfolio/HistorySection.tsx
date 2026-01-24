import React, { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Task } from "@/lib/api/portfolioApi";

interface HistorySectionProps {
  tasks: Task[];
  isLoading?: boolean;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ tasks, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_DISPLAY_COUNT = 3;
  const displayedTasks = isExpanded ? tasks : tasks.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreTasks = tasks.length > INITIAL_DISPLAY_COUNT;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "todo":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "reopen":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "delay":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading recent tasks...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No tasks yet.</p>
            <p className="text-sm mt-2">Complete some tasks to see them here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedTasks.map((task) => (
            <div
              key={task.taskId}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-medium truncate">{task.content}</h4>
                    <Badge className={getPriorityColor(task.priority)} variant="outline">
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)} variant="outline">
                      {task.status}
                    </Badge>
                  </div>
                  {task.detail && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {task.detail}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {format(new Date(task.taskDate), "MMM d, yyyy")}
                    </span>
                    <span>•</span>
                    <span>
                      Updated {format(new Date(task.updatedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {hasMoreTasks && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show More ({tasks.length - INITIAL_DISPLAY_COUNT} more)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
