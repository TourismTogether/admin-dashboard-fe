import React, { useState } from "react";
import { format, startOfWeek, getWeek } from "date-fns";
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

interface CreateTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (startDate: string, week: number, description?: string) => void;
  isLoading?: boolean;
}

export const CreateTableDialog: React.FC<CreateTableDialogProps> = ({
  open,
  onOpenChange,
  onCreate,
  isLoading = false,
}) => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    const week = getWeek(weekStart, { weekStartsOn: 1 });
    onCreate(
      format(weekStart, "yyyy-MM-dd"),
      week,
      description.trim() || undefined
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Table</DialogTitle>
          <DialogDescription>
            Select the start date of the week for this table. Three default
            swimlanes (Morning, Afternoon, Evening) will be created
            automatically.
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
                  {startDate ? (
                    format(startDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
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
                  handleCreate();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
