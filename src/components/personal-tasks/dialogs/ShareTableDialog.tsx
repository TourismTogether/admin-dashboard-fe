import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Loader2, Check } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

interface TableWeek {
  tableId: string;
  userId: string;
  week: number;
  startDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShareTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableWeek | null;
}

export const ShareTableDialog: React.FC<ShareTableDialogProps> = ({
  open,
  onOpenChange,
  table,
}) => {
  const [isPublic, setIsPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !table) return;
    setFetching(true);
    apiRequest(`/api/personal-tasks/tables/${table.tableId}/share`)
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 404) {
          setIsPublic(false);
          setShareUrl(null);
          return null;
        }
        throw new Error("Failed to fetch share status");
      })
      .then((data) => {
        if (data?.data) {
          setIsPublic(data.data.isPublic);
          // Build URL from current origin so it works in dev/staging/prod
          const shareId = data.data.shareId;
          setShareUrl(shareId ? `${window.location.origin}/share/table/${shareId}` : null);
        }
      })
      .catch(() => {
        setIsPublic(false);
        setShareUrl(null);
      })
      .finally(() => setFetching(false));
  }, [open, table?.tableId]);

  const handleToggle = async (checked: boolean) => {
    if (!table || loading) return;
    setLoading(true);
    try {
      if (checked) {
        const res = await apiRequest(`/api/personal-tasks/tables/${table.tableId}/share`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error("Failed to create share");
        const data = await res.json();
        setIsPublic(true);
        const shareId = data.data?.shareId;
        setShareUrl(shareId ? `${window.location.origin}/share/table/${shareId}` : null);
        toast.success("Share link created");
      } else {
        const res = await apiRequest(`/api/personal-tasks/tables/${table.tableId}/share`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to disable share");
        setIsPublic(false);
        setShareUrl(null);
        toast.success("Share link disabled");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <DialogTitle>Share Table</DialogTitle>
          </div>
          <DialogDescription>
            {table
              ? `Week ${table.week} • ${table.startDate}`
              : "Generate a public link so others can view or copy this table."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="share-toggle" className="flex flex-col gap-1">
              <span className="font-medium">Public link</span>
              <span className="text-sm text-muted-foreground font-normal">
                {isPublic ? "Anyone with the link can view" : "Link is disabled"}
              </span>
            </Label>
            {fetching ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="share-toggle"
                checked={isPublic}
                onCheckedChange={handleToggle}
                disabled={loading}
              />
            )}
          </div>

          {isPublic && shareUrl && (
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={copyLink} title="Copy link">
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
