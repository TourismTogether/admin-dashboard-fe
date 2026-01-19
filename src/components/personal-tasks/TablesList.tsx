import React from "react";
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
import { Trash2 } from "lucide-react";

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

export const TablesList: React.FC<TablesListProps> = ({
  tables,
  selectedTableId,
  onSelectTable,
  onDeleteTable,
}) => {
  const handleDelete = (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation();
    if (onDeleteTable) {
      onDeleteTable(tableId);
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Your Tables</h2>
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Description</TableHead>
                {onDeleteTable && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={onDeleteTable ? 4 : 3}
                    className="h-24 text-center"
                  >
                    No tables yet. Create your first table to get started!
                  </TableCell>
                </TableRow>
              ) : (
                tables.map((table) => (
                  <TableRow
                    key={table.tableId}
                    onClick={() => onSelectTable(table.tableId)}
                    className={cn(
                      "cursor-pointer",
                      selectedTableId === table.tableId &&
                        "bg-primary/5"
                    )}
                  >
                    <TableCell className="font-medium">
                      Week {table.week}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(table.startDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {table.description || "-"}
                    </TableCell>
                    {onDeleteTable && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(e, table.tableId)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
