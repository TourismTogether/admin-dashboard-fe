import React from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

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
}

export const TablesList: React.FC<TablesListProps> = ({
  tables,
  selectedTableId,
  onSelectTable,
}) => {
  if (tables.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tables yet. Create your first table to get started!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Your Tables</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div
            key={table.tableId}
            onClick={() => onSelectTable(table.tableId)}
            className={cn(
              "p-4 border rounded-lg cursor-pointer transition-colors",
              selectedTableId === table.tableId
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50"
            )}
          >
            <div className="font-semibold">Week {table.week}</div>
            <div className="text-sm text-muted-foreground">
              {format(parseISO(table.startDate), "MMM d, yyyy")}
            </div>
            {table.description && (
              <div className="text-sm mt-2 text-muted-foreground">
                {table.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
