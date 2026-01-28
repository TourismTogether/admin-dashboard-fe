import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface CreateGroupSwimlaneDialogProps {
  groupTaskId: string;
  onSuccess: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: { content: string; assignedUserId?: string }) => Promise<void>;
}

export const CreateGroupSwimlaneDialog: React.FC<CreateGroupSwimlaneDialogProps> = ({
  groupTaskId: _groupTaskId,
  onSuccess,
  isOpen,
  onOpenChange,
  onSubmit,
}) => {
  const [swimlaneName, setSwimllaneName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!swimlaneName.trim()) {
      setError("Swimlane name is required");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({ content: swimlaneName });
      setSwimllaneName("");
      onSuccess();
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create swimlane");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Swimlane
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Swimlane</DialogTitle>
          <DialogDescription>
            Add a new swimlane for this group task. Swimlanes can be assigned to team members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="swimlane-name">Swimlane Name</Label>
            <Input
              id="swimlane-name"
              placeholder="e.g., Backend Development, Frontend, Testing"
              value={swimlaneName}
              onChange={(e) => setSwimllaneName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSwimllaneName("");
                setError("");
                if (onOpenChange) onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Swimlane"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
