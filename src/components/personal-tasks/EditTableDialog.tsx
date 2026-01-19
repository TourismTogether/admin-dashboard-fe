import React, { useState, useEffect } from "react";
import { format, startOfWeek, getWeek, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

interface EditTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (tableId: string, startDate: string, week: number, description?: string) => void;
  table: TableWeek | null;
  isLoading?: boolean;
}

export const EditTableDialog: React.FC<EditTableDialogProps> = ({
  open,
  onOpenChange,
  onUpdate,
  table,
  isLoading = false,
}) => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (table) {
      setStartDate(parseISO(table.startDate));
      setDescription(table.description || "");
    }
  }, [table]);

  const handleUpdate = () => {
    if (!table) return;
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    const week = getWeek(weekStart, { weekStartsOn: 1 });
    onUpdate(table.tableId, format(weekStart, "yyyy-MM-dd"), week, description.trim() || undefined);
  };

  const handleClose = () => {
    onOpenChange(false);
    if (table) {
      setStartDate(parseISO(table.startDate));
      setDescription(table.description || "");
    }
  };

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
          <DialogDescription>
            Update the start date and description of this table.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-description">Description (Optional)</Label>
            <Input
              id="table-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter table description"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleUpdate();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
