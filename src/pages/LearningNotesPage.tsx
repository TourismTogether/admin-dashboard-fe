import React, { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const columnHelper = createColumnHelper<LearningNote>();

const LearningNotesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "noteDate", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [viewingNote, setViewingNote] = useState<LearningNote | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [createContent, setCreateContent] = useState("");
  const [editingNote, setEditingNote] = useState<LearningNote | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deletingNote, setDeletingNote] = useState<LearningNote | null>(null);

  const {
    data: notesData,
    isLoading,
    isError,
    error,
  } = useQuery<{ data: LearningNote[] }>({
    queryKey: ["personal-tasks", "learning-notes", "list"],
    queryFn: async () => {
      const response = await apiRequest(
        "/api/personal-tasks/learning-notes?limit=30"
      );
      if (!response.ok) throw new Error("Failed to fetch learning notes");
      return response.json();
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({
      noteDate,
      content,
    }: {
      noteDate: string;
      content: string;
    }) => {
      const response = await apiRequest(
        `/api/personal-tasks/learning-notes/${noteDate}`,
        {
          method: "PUT",
          body: JSON.stringify({ content }),
        }
      );
      if (!response.ok) throw new Error("Failed to update learning note");
      return response.json() as Promise<{ data: LearningNote }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "learning-notes"],
      });
      setEditingNote(null);
      setEditingContent("");
      toast.success("Learning note updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteDate: string) => {
      const response = await apiRequest(
        `/api/personal-tasks/learning-notes/${noteDate}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete learning note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "learning-notes"],
      });
      setDeletingNote(null);
      toast.success("Learning note deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const notes = notesData?.data ?? [];

  const createNoteMutation = useMutation({
    mutationFn: async ({
      noteDate,
      content,
    }: {
      noteDate: string;
      content: string;
    }) => {
      const response = await apiRequest(
        `/api/personal-tasks/learning-notes/${noteDate}`,
        {
          method: "PUT",
          body: JSON.stringify({ content }),
        }
      );
      if (!response.ok) throw new Error("Failed to create learning note");
      return response.json() as Promise<{ data: LearningNote }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personal-tasks", "learning-notes"],
      });
      setIsCreateOpen(false);
      setCreateDate(format(new Date(), "yyyy-MM-dd"));
      setCreateContent("");
      toast.success("Learning note created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleEdit = (note: LearningNote) => {
    setEditingNote(note);
    setEditingContent(note.content);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("noteDate", {
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={() => {
                const nextSort =
                  isSorted === "asc"
                    ? "desc"
                    : isSorted === "desc"
                    ? false
                    : "asc";
                column.toggleSorting(nextSort === "desc");
              }}
            >
              Date
              <span className="inline-flex hover:text-green-500 hover:scale-110 transition-all duration-200">
                {isSorted === "desc" ? (
                  <ArrowDown className="h-4 w-4" />
                ) : isSorted === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : null}
              </span>
            </button>
          );
        },
        cell: (info) => (
          <div className="font-medium">
            {format(parseISO(info.getValue()), "MMM d, yyyy")}
          </div>
        ),
        size: 150,
      }),
      columnHelper.accessor("content", {
        header: "Note",
        cell: (info) => (
          <div
            className="line-clamp-2 max-w-[520px] whitespace-pre-wrap text-muted-foreground"
            title={info.getValue()}
          >
            {info.getValue().trim() || (
              <span className="text-muted-foreground/50 italic">Empty note</span>
            )}
          </div>
        ),
        size: 520,
      }),
      columnHelper.accessor("updatedAt", {
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={() => {
                const nextSort =
                  isSorted === "asc"
                    ? "desc"
                    : isSorted === "desc"
                    ? false
                    : "asc";
                column.toggleSorting(nextSort === "desc");
              }}
            >
              Updated
              <span className="inline-flex hover:text-green-500 hover:scale-110 transition-all duration-200">
                {isSorted === "desc" ? (
                  <ArrowDown className="h-4 w-4" />
                ) : isSorted === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : null}
              </span>
            </button>
          );
        },
        cell: (info) => (
          <div className="text-xs text-muted-foreground">
            {format(new Date(info.getValue()), "MMM d, yyyy HH:mm")}
          </div>
        ),
        size: 170,
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        size: 160,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setViewingNote(row.original);
              }}
              className="h-8 px-2 sm:px-3 hover:bg-primary/10"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                handleEdit(row.original);
              }}
              className="h-8 px-2 sm:px-3 hover:bg-primary/10"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setDeletingNote(row.original);
              }}
              className="h-8 px-2 sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: notes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

  const totalRows = notes.length;
  const totalPages = table.getPageCount();
  const currentPage = pagination.pageIndex + 1;
  const startRow = pagination.pageIndex * pagination.pageSize + 1;
  const endRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalRows
  );

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
            <BookMarked className="h-5 w-5" />
            Learning Notes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your daily notes from the personal tasks workspace.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
          <Button variant="outline" asChild>
            <Link to="/personal-tasks">
              <ArrowLeft className="h-4 w-4" />
              Back to Personal Tasks
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-10 rounded-md bg-muted animate-pulse" />
            <div className="h-16 rounded-md bg-muted animate-pulse" />
            <div className="h-16 rounded-md bg-muted animate-pulse" />
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error?.message ?? "Failed to load notes"}
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto rounded-lg border">
              <Table className="min-w-[760px]">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          style={{
                            width:
                              header.getSize() !== 150
                                ? header.getSize()
                                : undefined,
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        <div className="text-muted-foreground">
                          No learning notes yet. Save today's note from
                          Personal Tasks.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer transition-colors"
                        onClick={() => setViewingNote(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalRows > pagination.pageSize && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startRow} to {endRow} of {totalRows} notes
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={!!viewingNote} onOpenChange={(open) => !open && setViewingNote(null)}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              {viewingNote
                ? format(parseISO(viewingNote.noteDate), "MMM d, yyyy")
                : "Learning note"}
            </DialogTitle>
            <DialogDescription>Daily learning note detail.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-xl border bg-card p-4 text-sm leading-relaxed">
            {viewingNote?.content.trim() || "Empty note"}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setCreateDate(format(new Date(), "yyyy-MM-dd"));
            setCreateContent("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Create learning note</DialogTitle>
            <DialogDescription>
              Add a daily learning note for any date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="learning-note-date">Date</Label>
              <Input
                id="learning-note-date"
                type="date"
                value={createDate}
                onChange={(event) => setCreateDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="learning-note-content">Note</Label>
              <Textarea
                id="learning-note-content"
                value={createContent}
                onChange={(event) => setCreateContent(event.target.value)}
                className="min-h-56 resize-y"
                placeholder="Write what you learned..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createNoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                createNoteMutation.mutate({
                  noteDate: createDate,
                  content: createContent,
                })
              }
              disabled={!createDate || createNoteMutation.isPending}
            >
              {createNoteMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingNote}
        onOpenChange={(open) => {
          if (!open) {
            setEditingNote(null);
            setEditingContent("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              Edit{" "}
              {editingNote
                ? format(parseISO(editingNote.noteDate), "MMM d, yyyy")
                : "learning note"}
            </DialogTitle>
            <DialogDescription>Update this daily learning note.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editingContent}
            onChange={(event) => setEditingContent(event.target.value)}
            className="min-h-56 resize-y"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingNote(null);
                setEditingContent("");
              }}
              disabled={updateNoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                editingNote &&
                updateNoteMutation.mutate({
                  noteDate: editingNote.noteDate,
                  content: editingContent,
                })
              }
              disabled={updateNoteMutation.isPending}
            >
              {updateNoteMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingNote}
        onOpenChange={(open) => !open && setDeletingNote(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="space-y-4 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5 transition-all duration-200">
                <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
              </div>
              <div className="flex-1 space-y-2 pt-1">
                <DialogTitle className="text-xl font-semibold text-foreground">
                  Delete note
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  This action cannot be undone. This will permanently delete
                  this learning note.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {deletingNote && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-foreground">
                {format(parseISO(deletingNote.noteDate), "MMM d, yyyy")}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingNote(null)}
              disabled={deleteNoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deletingNote && deleteNoteMutation.mutate(deletingNote.noteDate)
              }
              disabled={deleteNoteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {deleteNoteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearningNotesPage;
