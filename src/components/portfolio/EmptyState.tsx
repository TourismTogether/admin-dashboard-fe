import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  onCreate: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreate }) => {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Portfolio</h1>
      </div>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground mb-4">
            No portfolio found. Create one to get started.
          </div>
          <Button onClick={onCreate} className="mx-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Portfolio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
