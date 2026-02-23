import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import { Trash2, ArrowDown, ArrowUp, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

export interface GroupWithRole {
  groupId: string;
  name: string;
  role: string;
  description?: string;
}

interface GroupsListProps {
  groups: GroupWithRole[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onEditGroup?: (group: GroupWithRole) => void;
  onDeleteGroup?: (groupId: string) => void;
}

const columnHelper = createColumnHelper<GroupWithRole>();

export const GroupsList: React.FC<GroupsListProps> = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  onEditGroup,
  onDeleteGroup,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDeleteGroup) onDeleteGroup(id);
  };

  const handleEdit = (e: React.MouseEvent, group: GroupWithRole) => {
    e.stopPropagation();
    if (onEditGroup) onEditGroup(group);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={() => column.toggleSorting(isSorted === "asc")}
            >
              Group Name
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
          <div className="font-medium">{info.getValue()}</div>
        ),
        size: 200,
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: (info) => (
          <div className="text-muted-foreground capitalize">
            {info.getValue()}
          </div>
        ),
        size: 100,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => (
          <div className="text-muted-foreground max-w-[300px] truncate" title={info.getValue() || ""}>
            {info.getValue() || (
              <span className="text-muted-foreground/50 italic">No description</span>
            )}
          </div>
        ),
        size: 300,
      }),
      ...(onEditGroup || onDeleteGroup
        ? [
            columnHelper.display({
              id: "actions",
              header: () => <div className="text-right">Actions</div>,
              size: 120,
              cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                  {onEditGroup && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEdit(e, row.original)}
                      className="h-8 px-2 sm:px-3 hover:bg-primary/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteGroup && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(e, row.original.groupId)}
                      disabled={row.original.role === "member"}
                      title={row.original.role === "member" ? "Only owner can delete group" : "Delete group"}
                      className="h-8 px-2 sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ),
            }),
          ]
        : []),
    ],
    [onEditGroup, onDeleteGroup]
  );

  const table = useReactTable({
    data: groups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  });

  const totalRows = groups.length;
  const totalPages = table.getPageCount();
  const currentPage = pagination.pageIndex + 1;
  const startRow = pagination.pageIndex * pagination.pageSize + 1;
  const endRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows);

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Your Groups ({groups.length})</h3>
      <div className="w-full overflow-x-auto rounded-lg border">
        <Table className="min-w-[560px]">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="text-muted-foreground">
                        No groups yet. Create your first group to get started!
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={() => onSelectGroup(row.original.groupId)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedGroupId === row.original.groupId &&
                          "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
            Showing {startRow} to {endRow} of {totalRows} groups
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
    </div>
  );
};
