import React, { useMemo } from "react";
import { format, parseISO } from "date-fns";
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
  SortingState,
} from "@tanstack/react-table";
import { Trash2, ArrowDown, ArrowUp } from "lucide-react";

interface TableWeek {
  tableId: string;
  userId: string;
  week: number;
  startDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface TablesListProps {
  tables: TableWeek[];
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  onDeleteTable?: (tableId: string) => void;
}

const columnHelper = createColumnHelper<TableWeek>();

export const TablesList: React.FC<TablesListProps> = ({
  tables,
  selectedTableId,
  onSelectTable,
  onDeleteTable,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "week", desc: true },
  ]);

  const handleDelete = (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation();
    if (onDeleteTable) {
      onDeleteTable(tableId);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("week", {
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
              Week
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
          <div className="font-medium">Week {info.getValue()}</div>
        ),
        size: 100,
      }),
      columnHelper.accessor("startDate", {
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
              Start Date
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
          <div className="text-muted-foreground">
            {format(parseISO(info.getValue()), "MMM d, yyyy")}
          </div>
        ),
        size: 150,
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
      columnHelper.accessor("createdAt", {
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
              Created
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
            {format(parseISO(info.getValue()), "MMM d, yyyy HH:mm")}
          </div>
        ),
        size: 150,
      }),
      ...(onDeleteTable
        ? [
            columnHelper.display({
              id: "actions",
              header: () => <div className="text-right">Actions</div>,
              size: 100,
              cell: ({ row }) => (
                <div className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(e, row.original.tableId)}
                    className="h-8 px-2 sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            }),
          ]
        : []),
    ],
    [onDeleteTable]
  );

  const table = useReactTable({
    data: tables,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Your Tables ({tables.length})</h3>
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <Table>
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
                      No tables yet. Create your first table to get started!
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onSelectTable(row.original.tableId)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedTableId === row.original.tableId &&
                        "bg-primary/5 hover:bg-primary/10"
                    )}
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
        </div>
      </div>
    </div>
  );
};
