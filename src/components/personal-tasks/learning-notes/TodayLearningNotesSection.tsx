import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, ListChecks, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api";

interface LearningNote {
  noteId: string;
  userId: string;
  noteDate: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const todayDate = () => format(new Date(), "yyyy-MM-dd");

export const TodayLearningNotesSection: React.FC = () => {
  const queryClient = useQueryClient();
  const today = useMemo(todayDate, []);
  const [content, setContent] = useState("");

  const { data: todayNoteData, isLoading: isLoadingTodayNote } = useQuery<{
    data: LearningNote | null;
  }>({
    queryKey: ["personal-tasks", "learning-note", today],
    queryFn: async () => {
      const response = await apiRequest(
        `/api/personal-tasks/learning-notes/${today}`
      );
      if (!response.ok) throw new Error("Failed to fetch today's note");
      return response.json();
    },
  });

  useEffect(() => {
    setContent(todayNoteData?.data?.content ?? "");
  }, [todayNoteData?.data?.content]);

  const saveNoteMutation = useMutation({
    mutationFn: async (nextContent: string) => {
      const response = await apiRequest(
        `/api/personal-tasks/learning-notes/${today}`,
        {
          method: "PUT",
          body: JSON.stringify({ content: nextContent }),
        }
      );
      if (!response.ok) throw new Error("Failed to save learning note");
      return response.json() as Promise<{ data: LearningNote }>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["personal-tasks", "learning-note", today], data);
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "learning-notes"],
      });
      toast.success("Learning note saved");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save note: ${error.message}`);
    },
  });

  const hasUnsavedChanges = content !== (todayNoteData?.data?.content ?? "");
  const canSave = !isLoadingTodayNote && !saveNoteMutation.isPending;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookMarked className="h-5 w-5 text-primary" />
              What did you learn today?
            </CardTitle>
            <CardDescription>
              Capture the useful ideas, mistakes, and patterns from {today}.
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/learning-notes">
                <ListChecks className="h-4 w-4" />
                View your note list
              </Link>
            </Button>
            <Button
              onClick={() => saveNoteMutation.mutate(content)}
              disabled={!canSave || !hasUnsavedChanges}
              className="w-full sm:w-auto"
            >
              {saveNoteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
        {isLoadingTodayNote ? (
          <div className="h-32 rounded-xl bg-muted animate-pulse" />
        ) : (
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write the concepts, links, commands, bugs, or small wins you want future-you to remember."
            className="min-h-32 resize-y"
          />
        )}
      </CardContent>
    </Card>
  );
};
