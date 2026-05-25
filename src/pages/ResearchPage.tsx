import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bot,
  ExternalLink,
  Plus,
  Search,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteResearchConversation,
  fetchResearchConversations,
  sendResearchMessage,
  type ResearchConversation,
  type ResearchMessage,
  type ResearchSource,
} from "@/lib/api/researchApi";
import { cn } from "@/lib/utils";

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function SourceList({ sources }: { sources: ResearchSource[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {sources.map((source, index) => (
        <a
          key={`${source.link}-${index}`}
          href={source.link}
          target="_blank"
          rel="noreferrer"
          className="group rounded-lg border border-border/80 bg-background p-3 text-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
        >
          <div className="flex items-start gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <p className="line-clamp-2 font-medium text-foreground">
                  {source.title}
                </p>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              {source.date && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {source.date}
                </p>
              )}
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {source.snippet || source.link}
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: ResearchMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[880px] rounded-lg border px-4 py-3",
          isUser
            ? "border-primary/20 bg-primary text-primary-foreground"
            : "border-border/80 bg-card",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {!isUser && <SourceList sources={message.sources} />}
        <p
          className={cn(
            "mt-3 text-xs",
            isUser ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          {formatDateTime(message.createdAt)}
        </p>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

const ResearchPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [deleteConfirmItem, setDeleteConfirmItem] =
    useState<ResearchConversation | null>(null);

  const {
    data: conversations = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["research"],
    queryFn: fetchResearchConversations,
    retry: false,
  });

  const selectedConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === selectedId) ??
      conversations[0] ??
      null,
    [conversations, selectedId],
  );

  useEffect(() => {
    if (!selectedId && conversations[0]) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  const sendMutation = useMutation({
    mutationFn: sendResearchMessage,
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["research"] });
      setSelectedId(conversation.id);
      setPrompt("");
      toast.success("Research completed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResearchConversation,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["research"] });
      if (selectedId === id) setSelectedId(null);
      setDeleteConfirmItem(null);
      toast.success("Conversation deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startNewConversation = () => {
    setSelectedId(null);
    setPrompt("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    sendMutation.mutate({
      conversationId: selectedConversation?.id,
      prompt: trimmed,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">
            Failed to load: {error?.message ?? "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  const messages = selectedConversation?.messages ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Research</h1>
        <Button variant="outline" size="sm" onClick={startNewConversation}>
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="flex min-h-[520px] max-h-[calc(100vh-180px)] flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto pr-2">
            {conversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No research conversations yet.
              </div>
            ) : (
              <ul className="space-y-1">
                {conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      className={cn(
                        "flex w-full items-start justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        selectedConversation?.id === conversation.id
                          ? "bg-primary/15 text-primary"
                          : "hover:bg-accent",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {conversation.title}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {formatDateTime(conversation.updatedAt)}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        disabled={deleteMutation.isPending}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteConfirmItem(conversation);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-[520px] max-h-[calc(100vh-180px)] flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Search className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-base">
                  {selectedConversation?.title ?? "New research"}
                </CardTitle>
                {selectedConversation && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {formatDateTime(selectedConversation.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto rounded-lg border border-border/70 bg-background/70 p-4">
              {messages.length === 0 ? (
                <div className="flex min-h-[260px] items-center justify-center text-sm text-muted-foreground">
                  Start with a research prompt.
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}
              {sendMutation.isPending && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  Searching 6 sources and aggregating...
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask a research question..."
                className="min-h-[96px] resize-y"
                disabled={sendMutation.isPending}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={sendMutation.isPending}>
                  <Send className="h-4 w-4" />
                  {sendMutation.isPending ? "Researching" : "Send"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!deleteConfirmItem}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="space-y-4 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1 space-y-2 pt-1">
                <DialogTitle className="text-xl font-semibold">
                  Delete conversation
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This research conversation will
                  be permanently deleted.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {deleteConfirmItem && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm font-medium">{deleteConfirmItem.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Updated {formatDateTime(deleteConfirmItem.updatedAt)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmItem(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmItem &&
                deleteMutation.mutate(deleteConfirmItem.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResearchPage;
